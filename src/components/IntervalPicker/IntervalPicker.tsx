import type { Interval } from "../../api/binance.types";
import './IntervalPicker.css';

// a readable subset of the intervals Binance exposes: enough to cover
// scalping to swing without overflowing the chart header
const INTERVALS: Interval[] = ['1m', '5m', '15m', '1h', '4h', '1d'];

export default function IntervalPicker({ value, onChange, disabled = false }: { value: Interval, onChange: (interval: Interval) => void, disabled?: boolean }) {
    return (
        <div className="intervalPicker" role="group" aria-label="Chart interval">
            {INTERVALS.map((option) => (
                <button
                    key={option}
                    type="button"
                    className={`intervalPicker-option ${option === value ? 'is-active' : ''}`}
                    aria-pressed={option === value}
                    disabled={disabled}
                    onClick={() => onChange(option)}
                >
                    {option}
                </button>
            ))}
        </div>
    );
}
