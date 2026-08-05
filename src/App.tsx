import { useEffect, useState } from "react"
import { fetchSymbols } from "./api/binance";
import SymbolChart from "./components/SymbolChart/SymbolChart";
import Header from "./components/Header/Header";
import { useAlert } from './hooks/useAlert';
import { describeError } from './utils/errorMessage';
import type { Crypto } from "./api/coingecko.types";
import './App.css';

const EmptyState = () => (
  <div className="empty">
    <div className="empty-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 20h18" strokeLinecap="round" />
        <rect x="5" y="10" width="3.5" height="7" rx="1" />
        <path d="M6.75 7v3M6.75 17v2" strokeLinecap="round" />
        <rect x="15.5" y="6" width="3.5" height="8" rx="1" />
        <path d="M17.25 3v3M17.25 14v3" strokeLinecap="round" />
      </svg>
    </div>
    <h2 className="empty-title">Search a cryptocurrency to get started</h2>
    <p className="empty-text">
      Type in the search bar above to pull live market data and an interactive, real-time
      candlestick chart straight from Binance.
    </p>
    <div className="empty-hints">
      <span className="empty-hint">BTC</span>
      <span className="empty-hint">ETH</span>
      <span className="empty-hint">SOL</span>
    </div>
  </div>
);

function App() {
  const [symbolsList, setSymbolsList] = useState<Set<string>>();
  const [crypto, setCrypto] = useState<Crypto | null>(null);
  const { showAlert } = useAlert();

  useEffect(() => {
    const controller: AbortController = new AbortController()
    fetchSymbols(controller.signal)
      .then((res) => {
        setSymbolsList(res);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Failed to fetch ', err);
        showAlert(describeError(err, 'symbols list'), 'error');
      })
    return (() => controller.abort())
  }, [showAlert]);

  return (
    <div className="App">
      <div className="App-backdrop" aria-hidden="true" />
      <Header onSelectCrypto={setCrypto} symbolsList={symbolsList} />
      <main className="App-main">
        {crypto
          ? <SymbolChart key={crypto?.id} crypto={crypto} />
          : <EmptyState />}
      </main>
    </div>
  )
}

export default App
