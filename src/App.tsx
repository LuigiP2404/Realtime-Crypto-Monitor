import { useEffect, useState } from "react"
import { fetchKlines } from "./api/binance";
import Chart from "./components/Chart";
import type { Candle } from "./api/binance.types";
import { connectToSocket } from "./api/binanceSocket";

function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastCandle, setLastCandle] = useState<Candle | null>(null)
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchKlines()
    .then((res) => {
      setCandles(res);
    })
    .catch((err: Error) => {
      console.error('Failed to fetch ', err);
      setError(err)
    })
    .finally(() =>{
      setLoading(false);
    })
  }, []);

  useEffect(() => {
    const unmount = connectToSocket({ onCandle: setLastCandle });

    return unmount;
  }, [])
  

  return (
    <>
      {loading ? <p>Loading...</p> : null}
      {error ? <p>{ error.message }</p> : null}
      <Chart candles={candles} lastCandle={lastCandle} />
    </>
  )
}

export default App
