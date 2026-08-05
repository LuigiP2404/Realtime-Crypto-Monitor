import { useEffect, useState } from "react"
import { fetchSymbols } from "./api/binance";
import Asynchronous from "./components/Autocomplete/Autocomplete";
import SymbolChart from "./components/SymbolChart";
import { useAlert } from './hooks/useAlert';
import { describeError } from './utils/errorMessage';

function App() {
  const [symbolsList, setSymbolsList] = useState<Set<string>>();
  const [symbol, setSymbol] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
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
        const dErr = describeError(err, 'symbols list')
        showAlert(dErr, 'error');
        setErrorMsg(dErr);
      })
    return (() => controller.abort())
  }, [showAlert]);

  return (
      <>
        <Asynchronous onSelectCrypto={setSymbol} symbolsList={symbolsList} />
        {errorMsg ? <p>{errorMsg}</p> : null}
        {symbol
          ? <SymbolChart key={symbol} symbol={symbol} />
          : <p>Search for a crypto to see the graph</p>}
      </>
  )
}

export default App
