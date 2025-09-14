import { SQSEvent, SQSHandler, SQSRecord } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { ApiCardResponse, ApiDataResponse, CardMsg, CardRecord } from './types'
import { transformCardResponse } from './utils/transformer'
import dotenv from 'dotenv'

const dynamoDb = new DynamoDBClient({})
const tableName = process.env.CARD_TABLE

async function fetchCardData(cardTitle: string): Promise<ApiCardResponse[]> {
    console.log(`Fetching card data for: ${cardTitle}`)
    try {
        const baseURL = 'https://api.justtcg.com/v1/cards?'
        const res = await fetch(`${baseURL}q=${encodeURIComponent(cardTitle)}`, {
            method: 'GET',
            headers: {
                'X-API-Key': process.env.JTCG_API_KEY ?? '',
                'Content-Type': 'application/json'
            }
        })
        if (!res.ok) {
            throw Error(`HTTP Status Error: ${res.status}`)
        }
        
        const data: ApiDataResponse = await res.json()

        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid response from External API')
        }

        return data.data

    } catch (err) {
        console.error('Error fetching card data:', (err as Error).message)
        throw err
    }
    
}

export const handler: SQSHandler = async (event: SQSEvent) => {
    for (const record of event.Records) {
        try {
            const { cardName } = JSON.parse(record.body)
            console.log('Recieved Card Name:', cardName);

            const cards: ApiCardResponse[] = await fetchCardData(cardName)
            
            if (cards.length === 0) {
                console.log(`No cards found for ${cardName}`)
                continue
            }

            for (const rawCard of cards) {
                const processedCard: CardRecord = transformCardResponse(rawCard)
                console.log(JSON.stringify(processedCard))
                const putCmd = new PutItemCommand({
                    TableName: tableName,
                    Item: {
                        cardId: { S: processedCard.cardId },
                        name: { S: processedCard.name},
                        set: { S: processedCard.set },
                        rarity: { S: processedCard.rarity },
                        variants: {
                            L: processedCard.variants.map((v) => ({
                                M: {
                                    condition: { S: v.condition },
                                    printing: { S: v.printing },
                                    language: { S: v.language },                                    
                                    price: { N: v.price.toString() },
                                    lastUpdated: { N: v.lastUpdated.toString() }
                                },
                            })),
                        },
                    }
                })

                await dynamoDb.send(putCmd)
                console.log(`stored card ${processedCard.name} - ${processedCard.cardId} with ${processedCard.variants.length} variants`)
            }


        } catch (err) {
            console.error('Error processing record:', (err as Error).message)
            throw(err)
        }

    }
}