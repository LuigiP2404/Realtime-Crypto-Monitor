import type { Crypto } from "../../api/coingecko.types";
import { formatPrice } from "../../utils/format";
import './MarketStats.css';

export default function MarketStats({ crypto }: { crypto: Crypto }) {
    return (
        <div className="marketStats">
            <div className="marketStats-tile">
                <span className="marketStats-label">24h High</span>
                <span className="marketStats-value is-up">{formatPrice(crypto.high_24h)}</span>
            </div>
            <div className="marketStats-tile">
                <span className="marketStats-label">24h Low</span>
                <span className="marketStats-value is-down">{formatPrice(crypto.low_24h)}</span>
            </div>
            <div className="marketStats-tile">
                <span className="marketStats-label">Market Cap Rank</span>
                <span className="marketStats-value">#{crypto.market_cap_rank}</span>
            </div>
        </div>
    );
}
