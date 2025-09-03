import { ApiCardResponse, CardRecord } from "../types";

export function transformCardResponse(apiCardResponse: ApiCardResponse): CardRecord {
    return {
    cardId: apiCardResponse.id,
    name: apiCardResponse.name,
    set: apiCardResponse.set,
    rarity: apiCardResponse.rarity,
    tcgplayerid: apiCardResponse.tcgplayerId ?? null,
    variants: apiCardResponse.variants.map(v => ({
        condition: v.condition,
        printing: v.printing,
        language: v.language,
        price: v.price,
        lastUpdated: v.lastUpdated
    }))
}
}