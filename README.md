# Realtime Crypto Monitor

A candlestick chart that merges historical data with a live WebSocket feed — pick a
pair, watch the last candle update tick by tick, see trades scroll in as they happen.

Live: [realtime-crypto-monitor.vercel.app](https://realtime-crypto-monitor.vercel.app/)

This is a rewrite of an older project of mine, [Crypto-Graph](https://github.com/LuigiP2404/Crypto-Graph)
([live](https://luigip2404.github.io/Crypto-Graph/)), which only ever pulled REST
snapshots. The chart UI is carried over, but the data layer is new: Vite instead of
Create React App, and a real WebSocket connection instead of polling.

## How it fits together

On mount, the chart loads historical candles over REST (`/api/v3/uiKlines`), then
opens a WebSocket for the same symbol and starts patching just the last candle as
ticks come in — no re-fetch, no full redraw. When a candle's interval closes, the
next one gets appended. A second, separate WebSocket stream feeds the live price
ticker and the trade tape.

Both connections handle Binance's 24h disconnect and ping/pong heartbeat, with
exponential backoff + jitter on reconnect. The trade tape throttles incoming
trades per side (bid/ask) so a busy pair doesn't hammer the DOM with a render per
tick.

Symbol search and the "24h high/low/rank" data come from CoinGecko, since Binance
doesn't expose that kind of market metadata — everything price- and trade-related
comes straight from Binance.

## APIs

**Binance** — price and chart data, no key required:

- `GET /api/v3/ticker/price` — full symbol list on load, filtered down to `*USDT`
  pairs. Used to check which coins CoinGecko turns up are actually tradeable here.
- `GET /api/v3/uiKlines` — historical OHLC candles for the selected symbol.
- `wss://.../ws/<symbol>@kline_1m` — live updates for the in-progress candle.
- `wss://.../ws/<symbol>@trade` — every individual trade, feeds the price ticker
  and the trade tape.

**CoinGecko** — search and market metadata, needs `VITE_CRYPTO_API_KEY`:

- `GET /api/v3/search?query=` — fuzzy name search as you type.
- `GET /api/v3/coins/markets?ids=` — hydrates the matches with price, image, rank,
  24h high/low for the dropdown.

### How search works

Typing debounces 500ms, then hits CoinGecko's `/search`. Those results get filtered
down to whatever also exists as a `<SYMBOL>USDT` pair on Binance — CoinGecko knows
about plenty of coins Binance doesn't list, so this keeps out anything you couldn't
actually pull a chart for. The surviving ids go to `/coins/markets` to pull in
price/image/rank for the dropdown rows. Picking one hands that whole CoinGecko
object up to the chart view — its price/image/rank/24h-high-low are shown as static
context (the hero header, the stat tiles), while every number that actually moves
after that point comes from Binance's own REST + WebSocket.

## Stack

- Vite + React + TypeScript
- [lightweight-charts](https://github.com/tradingview/lightweight-charts) for the candlestick chart
- MUI, just for the autocomplete and toast alerts
- Binance REST + WS for OHLC and live trades, CoinGecko for search/market data

## Running it locally

```bash
npm install
npm run dev
```

You'll need a CoinGecko demo API key for search to work — copy `.env.example` to
`.env` and set:

```
VITE_CRYPTO_API_KEY=your_key_here
```

Other scripts:

```bash
npm run build       # typecheck + production build
npm run typecheck   # tsc only
npm run lint         # eslint
```

CI runs lint/typecheck/build on every PR into `main`; Vercel handles deploys on
its own from the GitHub integration.
