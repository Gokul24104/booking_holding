'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  type CandlestickData,
  type IChartApi,
} from 'lightweight-charts';

interface Props {
  data: CandlestickData[];
}

export default function GasChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#18181b' },
        textColor: '#e4e4e7',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      timeScale: {
        borderColor: '#485c7b',
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries();
    candleSeries.setData(data);

    return () => chart.remove();
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-[300px] mt-8" />;
}
