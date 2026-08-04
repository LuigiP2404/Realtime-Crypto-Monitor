import { baseUrl } from "./config";
import type { RawKline, Interval, Candle } from './binance.types'
import type { UTCTimestamp } from "lightweight-charts";

export async function fetchKlines(symbol: string = 'BNBUSDT', interval: Interval = '4h', limit?: number): Promise<Candle[]> {
    const url = new URL('/api/v3/uiKlines', baseUrl);
    url.searchParams.set('symbol', symbol);
    url.searchParams.set('interval', interval);
    if (limit) url.searchParams.set('limit', String(limit));
    const res = await fetch(url)
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
        throw new Error('Failed to fetch Klines');
    }
}