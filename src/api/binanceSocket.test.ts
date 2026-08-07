import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest'
import { mockWebSocket } from '../test-utils/mockWebSocket';
import { connectToSocketKline } from './binanceSocket';
import type { Candle, Interval, SocketMessage } from './binance.types';
import type { UTCTimestamp } from 'lightweight-charts';

type SocketConfig = {
    symbol: string,
    interval: Interval,
    onCandle: (candle: Candle) => void,
    onClose?: () => void,
    onError?: () => void
}

const dummyKlineRes: SocketMessage = {
    e: 'kline', E: 1754485260000, s: 'BTCUSDT',
    k: {
        t: 1754485200000, T: 1754485499999, s: 'BTCUSDT', i: '4h',
        f: 100, L: 200, o: '45466', c: '45765', h: '45864', l: '45300',
        v: '12.5', n: 42, x: false, q: '570000', V: '6.2', Q: '280000', B: '0'
    }
};

const expectedCandle: Candle = {
    time: 1754485200 as UTCTimestamp,
    open: 45466,
    high: 45864,
    low: 45300,
    close: 45765
}

function initSocket(socketConfig: SocketConfig) {
    const socket = mockWebSocket();
    const disconnect = connectToSocketKline({ symbol: socketConfig.symbol, interval: socketConfig.interval, onCandle: socketConfig.onCandle, onError: socketConfig.onError, onClose: socketConfig.onClose });
    const instances = socket.instances;
    return { socket, disconnect, instances }
}

const FIRST_RETRY_MS = 500;
const WATCHDOG_THRESHOLD = 15000;
const WATCHDOG_RETRY = 5000;

beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(Math, 'random').mockReturnValue(0);
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.restoreAllMocks();
})

describe('binanceSocket', () => {
    it('URL Check', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const s = initSocket(config);
        expect(s.socket.last().url).toBe('wss://stream.binance.com:9443/ws/btcusdt@kline_4h');
        s.disconnect();
    });

    it('check Kline message', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect } = initSocket(config);
        const ls = socket.last();
        ls.emitOpen();
        ls.emitMessage(dummyKlineRes);
        expect(config.onCandle).toHaveBeenCalledTimes(1);
        expect(config.onCandle).toHaveBeenCalledWith(expectedCandle);
        disconnect();
    });

    it('check close and reconnect', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        const ls = socket.last();
        expect(instances.length).toBe(1);
        ls.emitClose();
        expect(instances.length).toBe(1);
        vi.advanceTimersByTime(FIRST_RETRY_MS - 1); // spyOn forces first retry to be after 500ms
        expect(instances.length).toBe(1);
        vi.advanceTimersByTime(1);
        expect(instances.length).toBe(2);
        disconnect();
    });

    it('check backoff', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        /*
            wait = delay / 2 + 0 (because spyOn returns 0 on Math.random)
            delay = Min(1000 * (2 ** retryCount), 30000) 
            delay tables
            retry delay retryCount wait
              1    1000     0      500
              2    2000     1      1000
              3    4000     2      2000
              4    8000     3      4000
              5   16000     4      8000
              6   30000     5      15000 - here the delay Min returns 30s instead of 32s
        */
        const timers = [500, 1000, 2000, 4000, 8000, 15000, 15000];
        timers.forEach((t, i) => {
            socket.last().emitClose();
            expect(instances.length).toBe(i + 1);
            vi.advanceTimersByTime(t);
            expect(instances.length, `retry #${i} (wait ${t}ms)`).toBe(i + 2);
        });
        disconnect();
    })

    it('check retryCount to equal 0 after reconnecting', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        socket.last().emitClose();
        vi.advanceTimersByTime(FIRST_RETRY_MS);
        socket.last().emitOpen();
        expect(instances.length).toBe(2);
        socket.last().emitClose();
        vi.advanceTimersByTime(FIRST_RETRY_MS);
        socket.last().emitOpen();
        expect(instances.length).toBe(3);
        disconnect();
    });

    it('Watchdog close then reconnect', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        socket.last().emitOpen();
        vi.advanceTimersByTime(WATCHDOG_THRESHOLD); // socket still opened because its > not >=
        expect(instances.length).toBe(1);
        vi.advanceTimersByTime(WATCHDOG_RETRY); // watchdog closed, on next retry, it will reconnect
        expect(instances.length).toBe(1);
        vi.advanceTimersByTime(FIRST_RETRY_MS); // socket re-opened, so first retry is at 500ms
        expect(instances.length).toBe(2);
        disconnect();
    })

    it('watchdog does not close when messages are sent', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        socket.last().emitOpen();
        for (let i=0; i<12; i++) {
            vi.advanceTimersByTime(5000);
            socket.last().emitMessage(dummyKlineRes);
            expect(instances.length).toBe(1);
        }
        disconnect();
    })

    it('cleanup when a retry is not scheduled, should not create a new socket', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        const spy = vi.spyOn(socket.last(), 'close')
        socket.last().emitOpen();
        expect(instances.length).toBe(1);
        expect(vi.getTimerCount()).toBe(1);
        disconnect();
        expect(spy).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(60000);
        expect(spy).toHaveBeenCalledTimes(1);
        expect(vi.getTimerCount()).toBe(0);
        expect(instances.length).toBe(1);
    });

    it('cleanup when a retry is scheduled, should not create a new socket', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect, instances } = initSocket(config);
        socket.last().emitOpen();
        expect(instances.length).toBe(1);
        socket.last().emitClose();
        expect(vi.getTimerCount()).toBe(2)
        disconnect();
        // after disconnecting, all timers should be cleared and there should be no more sockets.
        vi.advanceTimersByTime(60000);
        expect(instances.length).toBe(1);
        expect(vi.getTimerCount()).toBe(0)
        expect(socket.last().readyState).toBe(3) // readyState === 3 -> closed
    });

    it('malformed JSON in message', () => {
        const config: SocketConfig = { symbol: 'BTCUSDT', interval: '4h', onCandle: vi.fn() }
        const { socket, disconnect } = initSocket(config);
        const ls = socket.last();
        const spy = vi.spyOn(socket.last(), 'close')
        ls.emitOpen();
        vi.advanceTimersByTime(WATCHDOG_THRESHOLD); // right before watchdog closure
        const malformedJson = {
            e: 'kline', E: 1754485260000, s: 'BTCUSDT',
        };
        ls.emitMessage(malformedJson);
        vi.advanceTimersByTime(WATCHDOG_RETRY);
        expect(spy).toHaveBeenCalledTimes(0);
        expect(config.onCandle).toHaveBeenCalledTimes(0);
        expect(socket.instances.length).toBe(1);
        ls.emitMessage(dummyKlineRes);
        expect(config.onCandle).toHaveBeenCalledTimes(1);
        disconnect();
    })
});