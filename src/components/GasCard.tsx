// src/components/GasCard.tsx
'use client'

import { useGasStore } from '@/store/useGasStore'

export function GasCard({ chain }: { chain: 'ethereum' | 'polygon' | 'arbitrum' }) {
  const data = useGasStore((state) => state.chains[chain])

  if (!data) return null

  const totalGwei = data.baseFee + data.priorityFee

  return (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md text-white w-72">
      <h2 className="text-xl font-semibold capitalize">{chain} Gas</h2>
      <p>Base Fee: {data.baseFee.toFixed(2)} Gwei</p>
      <p>Priority Fee: {data.priorityFee.toFixed(2)} Gwei</p>
      <p>Total: {totalGwei.toFixed(2)} Gwei</p>
    </div>
  )
}
