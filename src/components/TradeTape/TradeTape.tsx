import { useEffect, useRef, useState } from "react";
import type { Trade } from "../../api/binance.types";
import './TradeTape.css'
import { formatPrice } from "../../utils/format";

type Side = 'buy' | 'sell';

const MAX_RESULTS = 50;

function TradeColumn({ title, side, trades, asset }: { title: string, side: Side, trades: Trade[], asset: string }) {
    return (
        <section className={`tradeTape-column is-${side}`}>
            <h3 className="tradeTape-title">
                <span className="tradeTape-dot" />
                {title}
            </h3>
            <div className="tradeTape-head">
                <span>Price (USD)</span>
                <span>Amount ({asset})</span>
                <span>Value</span>
            </div>
            <div className="tradeTape-body">
                {trades.length === 0
                    ? <p className="tradeTape-empty">Waiting for trades…</p>
                    : trades.map((t, index) => (
                        <div className="tradeTape-row" key={index}>
                            <span className="tradeTape-price">{formatPrice(t.price)}</span>
                            <span>{t.quantity}</span>
                            <span>{formatPrice(t.price * t.quantity)}</span>
                        </div>
                    ))}
            </div>
        </section>
    );
}

export default function TradeTape({ symbol, trade }: {symbol: string, trade: Trade | null}) {
    const [bids, setBids] = useState<Trade[]>([]);
    const [asks, setAsks] = useState<Trade[]>([]);
    const timeoutBidRef = useRef<number | undefined>(undefined);
    const pendingBidRef = useRef<Trade | null>(null);
    const timeoutAskRef = useRef<number | undefined>(undefined);
    const pendingAskRef = useRef<Trade | null>(null);

    function handleTrade(trade: Trade) {
        if (trade.marketMaker) {
            pendingBidRef.current = trade;
            if (!timeoutBidRef.current) {
                timeoutBidRef.current = setTimeout(() => {
                    const pending = pendingBidRef.current;
                    if (pending) setBids((prevBids) => [pending, ...prevBids].slice(0, MAX_RESULTS));
                    timeoutBidRef.current = undefined
                }, 400)
            }
        } else {
            pendingAskRef.current = trade;
            if (!timeoutAskRef.current) {
                timeoutAskRef.current = setTimeout(() => {
                    const pending = pendingAskRef.current;
                    if (pending) setAsks((prevAsks) => [pending, ...prevAsks].slice(0, MAX_RESULTS));
                    timeoutAskRef.current = undefined
                }, 400)
            }
        }
    }

    useEffect(() => {
        if (trade) {
            handleTrade(trade);
        }
    }, [trade]);

    useEffect(() => {
        return(() => {
            clearTimeout(timeoutAskRef.current);
            clearTimeout(timeoutBidRef.current);
        })
    }, []);

    const asset = symbol.replace('USDT', '');

    return (
        <div className="tradeTape">
            <TradeColumn title="Sells" side="sell" trades={bids} asset={asset} />
            <TradeColumn title="Buys" side="buy" trades={asks} asset={asset} />
        </div>
    )
}
