import type { OrderBookLevel } from "../../api/binance.types";
import { amountDecimalsFor, decimalsFor, formatNumber } from "../../utils/format";
import './OrderBook.css';

type Side = 'bid' | 'ask';

// rows drawn per side before the first message arrives, so the book already
// occupies its final height and the page does not reflow when the socket
// connects. Must match the @depth<N> stream the parent subscribes to.
const PLACEHOLDER_ROWS = 20;

interface Row extends OrderBookLevel {
    total: number; // cumulative quantity, from the best price outwards
    depth: number; // 0..1, share of the side's total liquidity
}

function toRows(levels: OrderBookLevel[]): Row[] {
    let running = 0;
    const rows = levels.map((level) => {
        running += level.quantity;
        return { ...level, total: running, depth: 0 };
    });
    // the last cumulative value is the side's total, so each bar is measured
    // against the deepest row of its own side
    if (running === 0) return rows;
    return rows.map((row) => ({ ...row, depth: row.total / running }));
}

function OrderBookSide({ side, rows, base, priceDigits, amountDigits }: {
    side: Side,
    rows: Row[],
    base: string,
    priceDigits: number,
    amountDigits: number,
}) {
    return (
        <div className={`orderBook-side is-${side}s`}>
            {/* per-side header: hidden until the side-by-side layout, where the
                shared header above the book no longer sits over its columns */}
            <div className="orderBook-sideHead">
                <span>Price (USDT)</span>
                <span>Amount ({base})</span>
                <span>Total</span>
            </div>
            <div className="orderBook-rows">
                {rows.length === 0
                    ? Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
                        <div className="orderBook-row is-placeholder" key={index} aria-hidden="true">
                            <span>—</span>
                            <span>—</span>
                            <span>—</span>
                        </div>
                    ))
                    : rows.map((row) => (
                        <div className={`orderBook-row is-${side}`} key={row.price}>
                            <span className="orderBook-depth" style={{ width: `${row.depth * 100}%` }} aria-hidden="true" />
                            <span className="orderBook-price">{formatNumber(row.price, priceDigits)}</span>
                            <span>{formatNumber(row.quantity, amountDigits)}</span>
                            <span>{formatNumber(row.total, amountDigits)}</span>
                        </div>
                    ))}
            </div>
        </div>
    );
}

export default function OrderBook({ symbol, bids, asks, lastPrice, lastSide }: {
    symbol: string,
    bids: OrderBookLevel[],
    asks: OrderBookLevel[],
    lastPrice?: number | null,
    lastSide?: 'buy' | 'sell',
}) {
    const base = symbol.replace('USDT', '');
    const isEmpty = bids.length === 0 && asks.length === 0;

    const priceDigits = decimalsFor(asks[0]?.price ?? bids[0]?.price ?? 0);
    const largestQuantity = Math.max(
        0,
        ...bids.map((level) => level.quantity),
        ...asks.map((level) => level.quantity),
    );
    const amountDigits = amountDecimalsFor(largestQuantity);

    const askRows = toRows(asks);
    const bidRows = toRows(bids);

    const bestAsk = asks[0]?.price;
    const bestBid = bids[0]?.price;
    const spread = bestAsk !== undefined && bestBid !== undefined ? bestAsk - bestBid : null;

    // the last cumulative value of a side is its total, so the split comes for
    // free from the rows already built — note it covers the visible levels only,
    // not the whole book
    const bidTotal = bidRows[bidRows.length - 1]?.total ?? 0;
    const askTotal = askRows[askRows.length - 1]?.total ?? 0;
    const visibleTotal = bidTotal + askTotal;
    const bidPercent = visibleTotal > 0 ? Math.round((bidTotal / visibleTotal) * 100) : 50;
    // derived rather than rounded on its own, otherwise the two can add up to 101
    const askPercent = 100 - bidPercent;

    return (
        <section className="orderBook">
            <h3 className="orderBook-title">Order book</h3>
            <div className="orderBook-imbalance" title="Share of the visible depth resting on each side">
                <span className="orderBook-imbalanceLabel is-bid">B {isEmpty ? '—' : `${bidPercent}%`}</span>
                <div className="orderBook-imbalanceBar" aria-hidden="true">
                    {isEmpty ? null : (
                        <>
                            <span className="is-bid" style={{ width: `${bidPercent}%` }} />
                            <span className="is-ask" style={{ width: `${askPercent}%` }} />
                        </>
                    )}
                </div>
                <span className="orderBook-imbalanceLabel is-ask">{isEmpty ? '—' : `${askPercent}%`} S</span>
            </div>

            <div className="orderBook-head">
                <span>Price (USDT)</span>
                <span>Amount ({base})</span>
                <span title="Cumulative amount">Total</span>
            </div>

            <OrderBookSide
                side="ask"
                rows={askRows.slice().reverse()}
                base={base}
                priceDigits={priceDigits}
                amountDigits={amountDigits}
            />

            <div className="orderBook-spread">
                <span className={`orderBook-last is-${lastSide ?? 'flat'}`}>
                    {lastPrice != null ? (
                        <div className="orderBook-trade-container" key={lastPrice}>
                            <span className="orderBook-arrow">{lastSide === 'buy' ? '▲' : '▼'}</span>
                            {formatNumber(lastPrice, priceDigits)}
                        </div>
                     ) : '—'}
                </span>
                {isEmpty
                    ? <span className="orderBook-spreadValue">Waiting for order book…</span>
                    : spread !== null ? (
                        <span className="orderBook-spreadValue">
                            Spread {formatNumber(spread, priceDigits)}
                        </span>
                    ) : null}
            </div>

            <OrderBookSide
                side="bid"
                rows={bidRows}
                base={base}
                priceDigits={priceDigits}
                amountDigits={amountDigits}
            />
        </section>
    );
}
