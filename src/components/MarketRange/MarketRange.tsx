import { formatPrice } from "../../utils/format";
import './MarketRange.css';

export default function MarketRange({ low, high, current }: { low: number, high: number, current: number }) {
    const isAboveHigh = current > high;
    const isBelowLow = current < low;
    const pct = high > low
        ? Math.min(100, Math.max(0, ((current - low) / (high - low)) * 100))
        : 50;

    return (
        <div className="marketRange">
            <span className="marketRange-edge">{formatPrice(low)}</span>
            <div className="marketRange-track">
                <div className="marketRange-trackFill" style={{ width: `${pct}%` }} />
                <div className="marketRange-thumb" style={{ left: `${pct}%` }} />
                {isAboveHigh ? (
                    <span className="marketRange-overflow is-up" style={{ left: `${pct}%` }}>▲</span>
                ) : null}
                {isBelowLow ? (
                    <span className="marketRange-overflow is-down" style={{ left: `${pct}%` }}>▼</span>
                ) : null}
            </div>
            <span className="marketRange-edge">{formatPrice(high)}</span>
        </div>
    );
}
