import type { UTCTimestamp } from "lightweight-charts";
import type { Candle, Interval, RawKlineSocket, SocketMessage } from "./binance.types";

export function connectToSocket({ symbol = 'BNBUSDT', interval = '1m', onCandle, onError, onClose }: { symbol?: string, interval?: Interval, onCandle: (candle :Candle) => void, onError?: () => void, onClose?: () => void}): () => void {
    const socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    socket.onmessage = (e) => {
        const message = JSON.parse(e.data as string) as SocketMessage;
        const k: RawKlineSocket = message.k;
        const candle: Candle = {
            time: Math.floor(k.t / 1000) as UTCTimestamp,
            open: Number(k.o),
            high: Number(k.h),
            low: Number(k.l),
            close: Number(k.c)
        }
        onCandle(candle);
    }
    if (onError) socket.onerror = onError;
    if (onClose) socket.onclose = onClose;
    return (() => socket.close());
}