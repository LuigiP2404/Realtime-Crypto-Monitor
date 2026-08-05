import { useEffect, useState } from "react";
import { fetchKlines } from "../api/binance";
import type { Candle, Trade } from "../api/binance.types";
import { connectToSocket, connectToSocketTrade } from "../api/binanceSocket";
import { describeError } from "../utils/errorMessage";
import Chart from "./Chart";
import TradeTape from "./TradeTape/TradeTape";
import MarketStats from "./MarketStats/MarketStats";
import MarketRange from "./MarketRange/MarketRange";
import './SymbolChart.css';
import type { Crypto } from "../api/coingecko.types";
import { formatPrice } from "../utils/format";

type Status = 'loading' | 'error' | 'success'

// mounted with key={symbol}: a new symbol means a new instance, so there is no
// previous state to clear and the initial values are already the right ones
export default function SymbolChart({ crypto }: { crypto: Crypto | null }) {
    const [status, setStatus] = useState<Status>('loading');
    const [candles, setCandles] = useState<Candle[]>([]);
    const [lastCandle, setLastCandle] = useState<Candle | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const symbol = (crypto?.symbol + 'USDT').toUpperCase() ?? '';

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        fetchKlines({ symbol , signal })
            .then((res) => {
                if (signal.aborted) return;
                setCandles(res);
                setStatus('success');
            })
            .catch((err: unknown) => {
                if (signal.aborted) return;
                console.error('Failed to fetch klines', err);
                setErrorMsg(describeError(err, 'the chart'));
                setStatus('error');
            })

        return (() => controller.abort());
    }, [symbol]);

    useEffect(() => {
        const disconnectKline = connectToSocket({
            symbol,
            onCandle: setLastCandle,
            onClose: () => console.log('WS disconnected - KLINE'),
        });
        const disconnectTrading = connectToSocketTrade({
            symbol,
            onTrade: setTrade,
            onClose: () => console.log('WS disconnected - TRADING'),
        });
        return(() => {
            disconnectKline();
            disconnectTrading();
        })
    }, [symbol]);

    // marketMaker === true: a resting buy order was hit, so the aggressor sold
    const side = trade?.marketMaker ? 'sell' : 'buy';

    return (
        <div className="symbolChart">
            <div className="symbolChart-card">
                <div className="symbolChart-hero">
                    <div className="symbolChart-identity">
                        {crypto ? <img className="symbolChart-avatar" src={crypto.image} alt="" /> : null}
                        <div className="symbolChart-titles">
                            <div className="symbolChart-name">{crypto?.name ?? symbol}</div>
                            <div className="symbolChart-tags">
                                <span className="symbolChart-symbolTag">{crypto?.symbol?.toUpperCase()}</span>
                                {crypto ? <span className="symbolChart-rankTag">Rank #{crypto.market_cap_rank}</span> : null}
                            </div>
                        </div>
                    </div>
                    <div className="symbolChart-priceBlock">
                        {trade ? (
                            <div className={`symbolChart-price is-${side}`} key={trade.time}>
                                <span className="symbolChart-arrow">{side === 'buy' ? '▲' : '▼'}</span>
                                {formatPrice(trade.price)}
                            </div>
                        ) : (
                            <div className="symbolChart-price is-waiting">{formatPrice(crypto?.current_price)}</div>
                        )}
                    </div>
                </div>
                {crypto ? <MarketStats crypto={crypto} /> : null}
                {crypto ? (
                    <MarketRange
                        low={crypto.low_24h}
                        high={crypto.high_24h}
                        current={trade?.price ?? crypto.current_price}
                    />
                ) : null}
                {status === 'loading' ? <p className="symbolChart-status">Loading graph…</p> : null}
                {status === 'error' ? <p className="symbolChart-status is-error">{errorMsg}</p> : null}
                <Chart candles={candles} lastCandle={lastCandle} />
            </div>
            <TradeTape trade={trade} symbol={symbol} />
        </div>
    );
}
