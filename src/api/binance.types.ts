import type { UTCTimestamp } from "lightweight-charts";

export type RawKline = [number, string, string, string, string, string, number, string, number, string, string, string]
export type Interval = '1s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';
export interface RawKlineSocket {
    B: string;
    L: number;
    Q: string;
    T: number;
    V: string;
    c: string;
    f: number;
    h: string;
    i: string;
    l: string;
    n: number;
    o: string;
    q: string;
    s: string;
    t: number;
    v: string;
    x: boolean
} 

export interface SocketMessage {
    E: number;
    e: string;
    k: RawKlineSocket;
    s: string;
}

export interface Candle {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
}

export interface SymbolsResponse {
    symbol: string;
    price: string;
}