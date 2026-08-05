import type { Coin, SearchResponse, Crypto } from "./coingecko.types";
import { ApiError } from "./errors";

const baseURL = 'https://api.coingecko.com'

export async function fetchCoins(q: string, signal?: AbortSignal): Promise<Coin[]> {
    const url = new URL('/api/v3/search', baseURL);
    url.searchParams.set('query', q);
    const res = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "x-cg-demo-api-key": import.meta.env.VITE_CRYPTO_API_KEY 
        },
        signal: signal
    })
    if (res.ok) {
        const json = await res.json() as SearchResponse;
        return json.coins;
    } else {
        throw ApiError.fromResponse(res);
    }
}

export async function fetchMarket(ids: string, signal?: AbortSignal): Promise<Crypto[]> {
    const url = new URL('/api/v3/coins/markets', baseURL);
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', ids);
    const res = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "x-cg-demo-api-key": import.meta.env.VITE_CRYPTO_API_KEY 
        },
        signal: signal
    })
    if (res.ok) {
        const json = await res.json() as Crypto[];
        return json;
    } else {
        throw ApiError.fromResponse(res);
    }
}