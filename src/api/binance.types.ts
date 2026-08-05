import type { UTCTimestamp } from "lightweight-charts";

export type RawKline = [number, string, string, string, string, string, number, string, number, string, string, string]
export type Interval = '1s' | '1m' | '3m' | '5m' | '15m' | '30m' | '1h' | '2h' | '4h' | '6h' | '8h' | '12h' | '1d' | '3d' | '1w' | '1M';

export interface RawKlineSocket {
    B: string; // Ignore
    L: number; // Last trade ID
    Q: string; // Taker buy quote asset volume
    T: number; // Kline close time 
    V: string; // Taker buy base asset volume
    c: string; // Close price
    f: number; // First trade ID
    h: string; // High price
    i: string; // Interval
    l: string; // Low price
    n: number; // Number of trades
    o: string; // Open price
    q: string; // Quote asset volume
    s: string; // Symbol
    t: number; // Kline start time
    v: string; // Base asset volume
    x: boolean; // Is this kline closed?
} 

export interface RawTradeSocket {
    E: number; // event time
    M: boolean; // ignore
    T: number; // trade time
    e: string; // event type
    m: boolean; // is the buyer the market maker?
    p: string; // price
    q: string; // quantity
    s: string; // symbol
    t: number; // trade id
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

export interface Trade {
    price: number; 
    time: UTCTimestamp; 
    marketMaker: boolean;
    quantity: number;
}

export interface SymbolsResponse {
    symbol: string;
    price: string;
}