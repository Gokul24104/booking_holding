'use client'

import { useGasStore } from '@/store/useGasStore'
import { useEffect } from 'react'

export function SimulationPanel() {
  const {
    txValue,
    setTxValue,
    chains,
    usdPrice,
    mode,
    setMode,
    updateSimulatedCost,
  } = useGasStore()

  const gasLimit = 21000

  useEffect(() => {
    if (mode !== 'simulation') return

    Object.entries(chains).forEach(([chain, data]) => {
      const totalGwei = data.baseFee + data.priorityFee
      const usdCost = (totalGwei * gasLimit * usdPrice) / 1e9

      updateSimulatedCost(chain as keyof typeof chains, {
        gasUsed: gasLimit,
        totalUsdCost: usdCost,
      })
    })
  }, [chains, usdPrice, txValue, mode, updateSimulatedCost])

  return (
    <div className="bg-zinc-800 p-6 rounded-xl shadow-md text-white mt-8 w-full max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">💡 Gas Simulation</h2>
        <button
          onClick={() => setMode(mode === 'live' ? 'simulation' : 'live')}
          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm"
        >
          Mode: {mode === 'live' ? 'Live' : 'Simulation'}
        </button>
      </div>

      {mode === 'simulation' && (
        <label className="block mb-4">
          Transaction Amount (ETH / MATIC):
          <input
            type="number"
            value={Number.isFinite(txValue) ? txValue.toString() : ''}
            onChange={(e) => setTxValue(parseFloat(e.target.value))}
            className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white"
            placeholder="Enter amount (e.g. 0.5)"
          />
        </label>
      )}

      <table className="mt-6 w-full text-left border-separate border-spacing-y-2">
        <thead>
          <tr className="text-sm text-zinc-400">
            <th>Chain</th>
            <th>Base Fee (Gwei)</th>
            <th>Priority Fee (Gwei)</th>
            <th>Total Gas (Gwei)</th>
            <th>Gas Cost (USD)</th>
            <th>Tx Value (USD)</th>
            <th>Total Cost (USD)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(chains).map(([chain, data]) => {
            const totalGwei = data.baseFee + data.priorityFee
            const gasCostUsd = (totalGwei * gasLimit * usdPrice) / 1e9
            const txValueUsd = txValue * usdPrice
            const totalCostUsd = gasCostUsd + txValueUsd

            return (
              <tr key={chain} className="bg-zinc-700 rounded">
                <td className="capitalize">{chain}</td>
                <td>{data.baseFee.toFixed(2)}</td>
                <td>{data.priorityFee.toFixed(2)}</td>
                <td>{totalGwei.toFixed(2)}</td>
                <td>${gasCostUsd.toFixed(4)}</td>
                <td>${txValueUsd.toFixed(4)}</td>
                <td>${totalCostUsd.toFixed(4)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
