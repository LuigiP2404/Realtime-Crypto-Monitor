import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchKlines, fetchSymbols } from './binance';
import type { Candle, SymbolsResponse } from './binance.types';
import type { UTCTimestamp } from 'lightweight-charts';
import { ApiError } from './errors';
import { mockFetch } from '../test-utils/mockFetch';


afterEach(() => vi.unstubAllGlobals());

describe('fetchKlines', () => {
    it('checkUrl', async () => {
        const fn = mockFetch({ body: [] })
        await fetchKlines({ symbol: 'btcusdt', interval: '1m'})
        expect(String(fn.mock.calls[0][0])).toBe('https://api.binance.com/api/v3/uiKlines?symbol=btcusdt&interval=1m&limit=1000')
    })

    it('mapping RawKline -> Candle', async () => {
        mockFetch({
            body: [[
                1754485200000, '45466', '45864', '45300', '45765', 'a', 3, 'b', 3, 'a', 'a', 'a'
            ]]
        })
        const res = await fetchKlines({ symbol: 'btcusdt', interval: '1m'})
        const expectedCandles: Candle[] = [{
            time: 1754485200 as UTCTimestamp,
            open: 45466,
            high: 45864,
            low: 45300,
            close: 45765
        }]
        expect(res).toStrictEqual(expectedCandles)
    })

    it('reject with ApiError', async () => {
        const obj = {
            ok: false,
            headers: { 'retry-after': '30'} as HeadersInit,
            status: 429,
            statusText: 'too many calls',
            url: 'testurl',
        };
        mockFetch(obj);
        await expect(fetchKlines({ symbol: 'btcusdt', interval: '1m'})).rejects.toMatchObject({
            retryAfter: 30,
            message: '429 too many calls — testurl'
        });
        await expect(fetchKlines({ symbol: 'btcusdt', interval: '1m'})).rejects.toBeInstanceOf(ApiError);
    })
})

describe('fetchSymbols', () => {
    it('check url', async() => {
        const fn = mockFetch({ body: [] })
        await fetchSymbols()
        expect(String(fn.mock.calls[0][0])).toBe('https://api.binance.com/api/v3/ticker/price')
    })

    it('filter USDT', async () => {
        mockFetch({
            body: [
                {
                    symbol: 'BTCUSDTUSDT',
                    price: "54000"
                },
                {
                    symbol: 'BTCUSDT',
                    price: "55000"
                },
                {
                    symbol: 'btcusdt',
                    price: "55000"
                },
                {
                    symbol: 'btcusdc',
                    price: "53000"
                },
                {
                    symbol: 'btcgoldusdt',
                    price: "60000"
                },
            ] as SymbolsResponse[]
        }) 
        const res = await fetchSymbols()
        const equal = new Set(['BTCUSDT', 'BTCUSDTUSDT'])
        expect(res).toEqual(equal);
    })

    it('res not ok', async () => {
        const obj = {
            ok: false,
            status: 500,
            statusText: 'service unavailable',
            url: 'testurl',
        };
        mockFetch(obj)
        await expect(fetchSymbols).rejects.toThrow(ApiError);
    })
})