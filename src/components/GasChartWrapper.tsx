'use client';

import { useGasStore, getCandles } from '@/store/useGasStore';
import GasChart from './GasChart';

export default function GasChartWrapper() {
  const history = useGasStore((state) => state.chains.ethereum.history);
  const candles = getCandles(history);

  if (!candles.length) {
    return <p className="mt-8 text-zinc-400">No gas data available to show chart.</p>;
  }

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">📈 Ethereum Gas Price Candlestick Chart (15 min)</h2>
      <GasChart data={candles} />
    </div>
  );
}
