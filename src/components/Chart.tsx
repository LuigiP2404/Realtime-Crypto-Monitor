import { useEffect, useRef } from "react";
import type { Candle } from "../api/binance.types";
import { createChart, type IChartApi, type ISeriesApi, CandlestickSeries, ColorType, CrosshairMode } from 'lightweight-charts';
import { getCssProperty } from "../utils/style";
import './Chart.css';

export default function Chart({ candles, lastCandle }: { candles: Candle[], lastCandle: Candle | null }) {
    const chartDiv = useRef<HTMLDivElement | null>(null);
    const chart = useRef<IChartApi | null>(null);
    const series = useRef<ISeriesApi<'Candlestick'> | null>(null);

    // create chart on mount
    useEffect(() => {
        if (chartDiv.current) {
            chart.current = createChart(chartDiv.current, {
                autoSize: true,
                layout: {
                    textColor: getCssProperty('--text-muted'),
                    background: { 
                        type: ColorType.Solid,
                        color: getCssProperty('--bg')
                    },
                    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, sans-serif",
                    attributionLogo: true
                },
                grid: {
                    vertLines: {
                        color: getCssProperty('--border'),
                        visible: false
                    },
                    horzLines: {
                        color: getCssProperty('--border')
                    }
                },
                crosshair: {
                    mode: CrosshairMode.Magnet,
                    vertLine: {
                        color: getCssProperty('--accent'),
                        labelBackgroundColor: getCssProperty('--accent')
                    },
                    horzLine: {
                        color: getCssProperty('--accent'),
                        labelBackgroundColor: getCssProperty('--accent')
                    }
                },
                rightPriceScale: {
                    borderColor: getCssProperty('--border')
                },
                timeScale: {
                    borderColor: getCssProperty('--border'),
                    timeVisible: true
                }
            });
            series.current = chart.current.addSeries(CandlestickSeries, {
                upColor: getCssProperty('--up'),
                downColor: getCssProperty('--down'),
                wickUpColor: getCssProperty('--up'),
                wickDownColor: getCssProperty('--down'),
                borderVisible: false,
                wickVisible: true
            });
        }
        

        return(() => {
            chart.current?.remove()
            chart.current = null;
            series.current = null;
        })
    }, []);

    // set initial data when candles change from parents (fetched)
    useEffect(() => {
        series.current?.setData(candles);
    }, [candles]);

    // update last candle from websocket
    useEffect(() => {
        if (lastCandle) series.current?.update(lastCandle)
    }, [lastCandle])


    return (
        <>
            <div className={`chart ${candles.length ? '' : 'hidden'}`} ref={chartDiv}></div>
        </>
    );
}