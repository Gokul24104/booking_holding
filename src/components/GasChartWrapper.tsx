'use client'

import { useState } from 'react'
import { useGasStore, getCandles } from '@/store/useGasStore'
import GasChart from './GasChart'

const CHAINS = ['ethereum', 'polygon', 'arbitrum'] as const
type Chain = (typeof CHAINS)[number]

export default function GasChartWrapper() {
  const [selectedChain, setSelectedChain] = useState<Chain>('ethereum')

  const chainHistory = useGasStore((state) => state.chains[selectedChain].history)
  const candles = getCandles(chainHistory)

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          📈 {selectedChain.charAt(0).toUpperCase() + selectedChain.slice(1)} Gas Candlestick Chart (15 min)
        </h2>
        <div className="space-x-2">
          {CHAINS.map((chain) => (
            <button
              key={chain}
              onClick={() => setSelectedChain(chain)}
              className={`px-3 py-1 rounded text-sm ${
                selectedChain === chain
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              {chain}
            </button>
          ))}
        </div>
      </div>

      {candles.length > 0 ? (
        <GasChart data={candles} />
      ) : (
        <p className="text-zinc-400 mt-4">No gas data available for {selectedChain}.</p>
      )}
    </div>
  )
}
