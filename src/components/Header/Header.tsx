import type { Crypto } from "../../api/coingecko.types";
import Autocomplete from "../Autocomplete/Autocomplete";
import './Header.css';

interface HeaderProps {
    onSelectCrypto: (crypto: Crypto | null) => void;
    symbolsList: Set<string> | undefined;
}

export default function Header({ onSelectCrypto, symbolsList }: HeaderProps) {
    return (
        <header className="header">
            <div className="header-inner">
                <div className="header-brand" aria-label="Realtime Crypto Monitor">
                    <span className="header-mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="4" y="9" width="4" height="8" rx="1.2" />
                            <path d="M6 5.5v3.5M6 17v1.5" strokeLinecap="round" />
                            <rect x="16" y="6" width="4" height="7" rx="1.2" />
                            <path d="M18 3v3M18 13v5.5" strokeLinecap="round" />
                        </svg>
                    </span>
                    <span className="header-wordmark">
                        Crypto<span className="header-wordmark-accent">Monitor</span>
                    </span>
                </div>

                <div className="header-search">
                    <Autocomplete onSelectCrypto={onSelectCrypto} symbolsList={symbolsList} />
                </div>
            </div>
        </header>
    );
}
