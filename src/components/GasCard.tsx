"use client";

import { useGasStore } from "@/store/useGasStore";

interface GasCardProps {
  chain: "ethereum" | "polygon" | "arbitrum";
  asRow?: boolean;
}

export function GasCard({ chain, asRow = false }: GasCardProps) {
  const data = useGasStore((state) => state.chains[chain]);
  const usdPrice = useGasStore((state) => state.usdPrice);

  const baseFee = data?.baseFee ?? 0;
  const priorityFee = data?.priorityFee ?? 0;
  const totalGwei = data?.gasPrice ?? 0;
  const estimated21kTxCostUsd = (21000 * totalGwei / 1_000_000_000) * usdPrice;

  if (asRow) {
    return (
      <tr className="hover:bg-zinc-800 transition">
        <td className="px-4 py-3 capitalize font-medium">{chain}</td>
        <td className="px-4 py-3">{baseFee.toFixed(2)} Gwei</td>
        <td className="px-4 py-3">{priorityFee.toFixed(2)} Gwei</td>
        <td className="px-4 py-3 font-semibold">{totalGwei.toFixed(2)} Gwei</td>
        <td className="px-4 py-3 text-sm text-zinc-400">
          ${estimated21kTxCostUsd.toFixed(2)}
        </td>
      </tr>
    );
  }

  // Card view
  return (
    <div className="bg-zinc-800 p-4 rounded-xl shadow-md text-white w-full">
      <h2 className="text-xl font-semibold capitalize mb-2">{chain} Gas</h2>
      <p className="text-sm text-zinc-300">Base Fee: {baseFee.toFixed(2)} Gwei</p>
      <p className="text-sm text-zinc-300">Priority Fee: {priorityFee.toFixed(2)} Gwei</p>
      <p className="font-bold text-lg mt-2">Total: {totalGwei.toFixed(2)} Gwei</p>
      <p className="text-xs text-zinc-400 mt-1">
        ~21k Gas Tx ≈ ${estimated21kTxCostUsd.toFixed(2)}
      </p>
    </div>
  );
}
