import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchCoins, fetchMarket } from './coingecko';
import type { Coin, Crypto } from './coingecko.types';
import { mockFetch } from '../test-utils/mockFetch';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
});

describe('fetchCoins', () => {
    it('check headers, URL and content', async () => {
        vi.stubEnv('VITE_CRYPTO_API_KEY', 'test');
        const coin = {
            id: "1",
            name: 'btc',
            api_symbol: 'btc',
            symbol: 'btc',
            market_cap_rank: 1,
            thumb: 'urlthumb',
            large: 'urlthumblarge'
        }
        const obj = {
            body: {
                coins: [
                    coin
                ] as Coin[]
            }
        }
        const fn = mockFetch(obj);
        const expected:Coin[] = [coin]
        expect(await fetchCoins('btc')).toStrictEqual(expected)
        expect(String(fn.mock.calls[0][0])).toBe('https://api.coingecko.com/api/v3/search?query=btc')
        expect(fn.mock.calls[0][1].headers).toEqual({
            "Accept": "application/json",
            "x-cg-demo-api-key": 'test'
        })
    });
})

describe('fetchMarket', () => {
    it('check headers, URL and content', async () => {
        vi.stubEnv('VITE_CRYPTO_API_KEY', 'test');
        const bodyArr: Crypto[] = 
        [
            {
                id: 'bitcoin',
                symbol: 'btc',
                name: 'bitcoin',
                image: 'urlimg',
                current_price: 55000,
                high_24h: 56000,
                low_24h: 54000,
                market_cap_rank: 1,
                price_change_percentage_24h: 23
            },
            {
                id: 'ethereum',
                symbol: 'eth',
                name: 'ethereum',
                image: 'urlimg',
                current_price: 25000,
                high_24h: 26000,
                low_24h: 24000,
                market_cap_rank: 2,
                price_change_percentage_24h: 44
            },
        ];
        const obj = {
            body: bodyArr
        }
        const fn = mockFetch(obj);
        const expected = structuredClone(bodyArr);
        expect(await fetchMarket('bitcoin,ethereum')).toStrictEqual(expected);
        expect(String(fn.mock.calls[0][0])).toBe('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum')
        expect(fn.mock.calls[0][1].headers).toEqual({
            "Accept": "application/json",
            "x-cg-demo-api-key": 'test'
        })
    });
})