import { useEffect, useState } from "react";
import { fetchKlines } from "../api/binance";
import type { Candle, Trade } from "../api/binance.types";
import { connectToSocket, connectToSocketTrade } from "../api/binanceSocket";
import { describeError } from "../utils/errorMessage";
import Chart from "./Chart";
import PriceTicker from "./PriceTicker/PriceTicker";
import TradeTape from "./TradeTape/TradeTape";

type Status = 'loading' | 'error' | 'success'

// mounted with key={symbol}: a new symbol means a new instance, so there is no
// previous state to clear and the initial values are already the right ones
export default function SymbolChart({ symbol }: { symbol: string }) {
    const [status, setStatus] = useState<Status>('loading');
    const [candles, setCandles] = useState<Candle[]>([]);
    const [lastCandle, setLastCandle] = useState<Candle | null>(null);
    const [trade, setTrade] = useState<Trade | null>(null);
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

    return (
        <>
            {status === 'loading' ? <p>Loading graph... </p> : null}
            {status === 'error' ? <p>{errorMsg}</p> : null}
            <PriceTicker trade={trade} symbol={symbol} key={symbol} />
            <Chart candles={candles} lastCandle={lastCandle} />
            <TradeTape trade={trade} symbol={symbol} />
        </>
    );
}
