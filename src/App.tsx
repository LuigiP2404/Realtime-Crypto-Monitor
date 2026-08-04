import { useEffect, useState } from "react"
import { fetchKlines } from "./api/binance";
import Chart from "./components/Chart";
import type { Candle } from "./api/binance.types";

function App() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchKlines()
    .then((res) => {
      setCandles(res);
    })
    .catch((err: Error) => {
      console.error('Failed to fetch please try again or search for something else.');
      setError(err)
    })
    .finally(() =>{
      setLoading(false);
    })
  }, []);
  

  return (
    <>
      {loading ? <p>Loading...</p> : null}
      {error ? <p>{ error.message }</p> : null}
      <Chart candles={candles} />
    </>
  )
}

export default App
