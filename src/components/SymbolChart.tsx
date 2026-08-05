import { useEffect, useState } from "react";
import { fetchKlines } from "../api/binance";
import type { Candle } from "../api/binance.types";
import { connectToSocket } from "../api/binanceSocket";
import { describeError } from "../utils/errorMessage";
import Chart from "./Chart";

type Status = 'loading' | 'error' | 'success'

// mounted with key={symbol}: a new symbol means a new instance, so there is no
// previous state to clear and the initial values are already the right ones
export default function SymbolChart({ symbol }: { symbol: string }) {
    const [status, setStatus] = useState<Status>('loading');
    const [candles, setCandles] = useState<Candle[]>([]);
    const [lastCandle, setLastCandle] = useState<Candle | null>(null);
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;
        fetchKlines({ symbol, signal })
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
        return connectToSocket({
            symbol,
            onCandle: setLastCandle,
            onClose: () => console.log('WS disconnected'),
        });
    }, [symbol]);

    return (
        <>
            {status === 'loading' ? <p>Loading graph... </p> : null}
            {status === 'error' ? <p>{errorMsg}</p> : null}
            <Chart candles={candles} lastCandle={lastCandle} />
        </>
    );
}
