export interface Coin {
    id: string;
    name: string;
    api_symbol: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    large: string;
}

export interface Crypto {
    id: string;
    symbol: string;
    name: string;
    image: string;
    current_price: number;
    high_24h: number;
    low_24h: number;
    market_cap_rank: number;
    price_change_percentage_24h: number;
}

export interface SearchResponse {
    categories: unknown;
    coins: Coin[];
    exchanges: unknown;
    icos: unknown;
    nfts: unknown;
}