import type { UTCTimestamp } from "lightweight-charts";
import type { Candle, Interval, RawKlineSocket, SocketMessage } from "./binance.types";

export function connectToSocket({ symbol = 'BNBUSDT', interval = '1m', onCandle, onError, onClose }: { symbol?: string, interval?: Interval, onCandle: (candle :Candle) => void, onError?: () => void, onClose?: () => void}): () => void {
    let socket: WebSocket | null = null;
    let retryCount: number = 0;
    let retry: ReturnType<typeof setTimeout> | undefined = undefined;
    let lastTimestamp: number = 0;
    let watchdog: ReturnType<typeof setInterval> | undefined = undefined;
    // binance sends a message every second if the interval is 1s, in all the other scenarios every 2s
    const watchdogThreshold = 15000;
    const watchdogRetry = 5000;
    const openSocket = () => {
        socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
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
            lastTimestamp = Date.now();
        }
        socket.onopen = () => {
            retryCount = 0;
            console.log('WS connected');
            lastTimestamp = Date.now();
        }
        if (onError) socket.onerror = onError;
        socket.onclose = () => {
            if (onClose) onClose()
            const delay = Math.min(1000 * (2**retryCount), 30000);
            const wait = delay / 2 + (Math.random() * delay / 2) // equal jitter as per aws doc
            console.log('retry #' + retryCount + ' tra ' + Math.round(wait) + 'ms');
            retryCount++;
            retry = setTimeout(openSocket, wait);
        }
    }
    openSocket();
    watchdog = setInterval(() => {
        if (socket?.readyState === 1) {
            const diff = Date.now() - lastTimestamp;
            if (diff > watchdogThreshold) socket.close()
        } 
    }, watchdogRetry)

    return (() => {
        if (socket) {
            socket.onclose = null;
            socket.close()
        }
        clearTimeout(retry);
        clearInterval(watchdog);
    });
}