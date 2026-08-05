import type { Trade } from "../../api/binance.types";
import './PriceTicker.css'
import { formatPrice } from "../../utils/format";

export default function PriceTicker({ symbol, trade }: {symbol: string, trade: Trade | null}) {
    const asset = symbol.replace('USDT', '');
    // marketMaker === true: a resting buy order was hit, so the aggressor sold
    const side = trade?.marketMaker ? 'sell' : 'buy';

    return (
        <div className="priceTicker">
            <div className="priceTicker-head">
                <span className="priceTicker-symbol">
                    {asset}<span className="priceTicker-quote">/USDT</span>
                </span>
                <span className="priceTicker-label">Last trade</span>
            </div>

            {trade ? (
                <>
                    {/* the key forces a fresh node on every trade, so the flash animation restarts */}
                    <div className={`priceTicker-price is-${side}`} key={trade.time}>
                        <span className="priceTicker-arrow">{side === 'buy' ? '▲' : '▼'}</span>
                        {formatPrice(trade.price)}
                    </div>
                    <dl className="priceTicker-meta">
                        <div>
                            <dt>Amount</dt>
                            <dd>{trade.quantity} {asset}</dd>
                        </div>
                        <div>
                            <dt>Value</dt>
                            <dd>{formatPrice(trade.price * trade.quantity)}</dd>
                        </div>
                    </dl>
                </>
            ) : (
                <p className="priceTicker-waiting">Waiting for the first trade…</p>
            )}
        </div>
    );
}
