import { baseUrl } from "./config";
import type { RawKline, Interval, Candle, SymbolsResponse } from './binance.types'
import type { UTCTimestamp } from "lightweight-charts";
import { ApiError } from "./errors";

export async function fetchKlines({symbol, interval, limit = 1000, signal}: { symbol: string, interval: Interval, limit?: number, signal?: AbortSignal }): Promise<Candle[]> {
    const url = new URL('/api/v3/uiKlines', baseUrl);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    if (limit) url.searchParams.set('limit', String(limit));
    const res = await fetch(url, { signal })
    if (res.ok) {
        const json = await res.json() as RawKline[];
        const arr: Candle[] = json.map((k) => {
            return {
                time: Math.floor(k[0] / 1000) as UTCTimestamp,
                open: Number(k[1]),
                high: Number(k[2]),
                low: Number(k[3]),
                close: Number(k[4])
            };
        });
        return arr;
    } else {
        throw ApiError.fromResponse(res);
    }
}

export async function fetchSymbols(signal: AbortSignal) {
    const url = new URL('/api/v3/ticker/price', baseUrl);
    const res = await fetch(url, { signal });
    if (res.ok) {
        const json = await res.json() as SymbolsResponse[];
        const symbolsArr: string[] = json.map((x) => x.symbol).filter((x) => x.endsWith('USDT'));
        const set = new Set(symbolsArr)
        return set;
    } else {
        throw ApiError.fromResponse(res);
    }
}