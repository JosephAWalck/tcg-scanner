import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs'
import * as dotenv from 'dotenv'

dotenv.config()

const sqs = new SQSClient({ region: process.env.AWS_REGION })
const QUEUE_URL = process.env.AWS_SQS_URL

const mockCardData = {
    cardName: 'Ugin, Eye of the Storms'
}

async function main(): Promise<void> {
    try {
        const result = await sqs.send(
            new SendMessageCommand({
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(mockCardData)
            })
        )
        console.log(`Message sent: ${JSON.stringify(result)}`)
    } catch (error) {
        console.error(`Error sending message: ${error}`)
    }
}

main()