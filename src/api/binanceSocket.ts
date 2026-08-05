import type { UTCTimestamp } from "lightweight-charts";
import type { BookOrder, Candle, Interval, RawBookOrderSocket, RawKlineSocket, RawTradeSocket, SocketMessage, Trade } from "./binance.types";

export function connectToSocketKline({ symbol, interval, onCandle, onError, onClose }: { symbol: string, interval: Interval, onCandle: (candle :Candle) => void, onError?: () => void, onClose?: () => void}): () => void {
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
            console.log('WS connected - KLINE');
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

export function connectToSocketTrade({ symbol, onTrade, onError, onClose }: { symbol: string, onTrade: (trade :Trade) => void, onError?: () => void, onClose?: () => void}): () => void {
    let socket: WebSocket | null = null;
    let retryCount: number = 0;
    let retry: ReturnType<typeof setTimeout> | undefined = undefined;
    let lastTimestamp: number = 0;
    let watchdog: ReturnType<typeof setInterval> | undefined = undefined;
    const watchdogThreshold = 360000;
    const watchdogRetry = 25000;
    const openSocket = () => {
        socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@trade`);
        socket.onmessage = (e) => {
            const t = JSON.parse(e.data as string) as RawTradeSocket;
            const trade: Trade = {
                time: t.T as UTCTimestamp,
                price: Number(t.p),
                marketMaker: t.m,
                quantity: Number(t.q),
            }
            onTrade(trade);
            lastTimestamp = Date.now();
        }
        socket.onopen = () => {
            retryCount = 0;
            console.log('WS connected - TRADING');
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

export function connectToSocketBookOrder({ symbol, onBook, onError, onClose }: { symbol: string, onBook: (order :BookOrder) => void, onError?: () => void, onClose?: () => void}): () => void {
    let socket: WebSocket | null = null;
    let retryCount: number = 0;
    let retry: ReturnType<typeof setTimeout> | undefined = undefined;
    let lastTimestamp: number = 0;
    let watchdog: ReturnType<typeof setInterval> | undefined = undefined;
    const watchdogThreshold = 15000;
    const watchdogRetry = 2000;
    const openSocket = () => {
        socket = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20`);
        socket.onmessage = (e) => {
            const o = JSON.parse(e.data as string) as RawBookOrderSocket;
            const order: BookOrder = {
                lastUpdateId: o.lastUpdateId,
                bids: o.bids.map((x) => ({ price: Number(x[0]), quantity: Number(x[1])})),
                asks: o.asks.map((x) => ({ price: Number(x[0]), quantity: Number(x[1])}))
            }
            onBook(order);
            lastTimestamp = Date.now();
        }
        socket.onopen = () => {
            retryCount = 0;
            console.log('WS connected - BOOKORDER');
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