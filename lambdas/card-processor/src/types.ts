export interface CardMsg {
    cardName: string
    setName?: string
    imageUrl?: string
    timestamp?: number
}

// External API response types
export interface ApiVariantResponse {
    condition: string
    printing: string
    language: string
    price: number
    lastUpdated: number
}

export interface ApiCardResponse {
    id: string
    tcgplayerId: string
    name: string
    set: string
    rarity: string
    variants: ApiVariantResponse[]
    [key: string]: any
}

export interface ApiDataResponse {
    data: ApiCardResponse[]
}

// DB types
export interface CardVariant {
    condition: string
    printing: string
    language: string
    price: number
    lastUpdated: number
}

export interface CardRecord {
    cardId: string
    name: string
    set: string
    rarity: string
    tcgplayerid: string | null
    variants: CardVariant[]
}