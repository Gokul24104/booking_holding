"use client";

import { useGasStore } from "@/store/useGasStore";
import { useEffect, useState } from "react";

type Chain = "ethereum" | "polygon" | "arbitrum";
const CHAINS: Chain[] = ["ethereum", "polygon", "arbitrum"];

export function SimulationPanel() {
  const {
    txValue,
    setTxValue,
    chains,
    usdPrice,
    mode,
    setMode,
    simulatedCosts,
    updateSimulatedCost,
  } = useGasStore();

  const [customGasUsed, setCustomGasUsed] = useState<Record<Chain, number>>({
    ethereum: simulatedCosts.ethereum.gasUsed,
    polygon: simulatedCosts.polygon.gasUsed,
    arbitrum: simulatedCosts.arbitrum.gasUsed,
  });

  useEffect(() => {
    CHAINS.forEach((chain) => {
      const currentGasPriceGwei = chains[chain]?.gasPrice || 0;
      const gasUsed = customGasUsed[chain];
      const gasCostGwei = gasUsed * currentGasPriceGwei;
      const gasCostEth = gasCostGwei / 1_000_000_000;
      const gasCostUsd = gasCostEth * usdPrice;

      updateSimulatedCost(chain, {
        gasUsed,
        totalUsdCost: gasCostUsd,
      });
    });
  }, [chains, usdPrice, customGasUsed, updateSimulatedCost]);

  const txValueUsd = txValue * usdPrice;

  return (
    <div className="bg-zinc-800 p-6 rounded-xl shadow-md text-white mt-8 w-full max-w-6xl mx-auto overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold"> Gas Simulation</h2>
        <button
          onClick={() => setMode(mode === "live" ? "simulation" : "live")}
          className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded text-sm w-fit"
        >
          Mode: {mode === "live" ? "Live" : "Simulation"}
        </button>
      </div>

<input
  type="number"
  step="0.01"
  min="0"
  value={Number.isFinite(txValue) ? txValue.toString() : ''}
  onChange={(e) => setTxValue(parseFloat(e.target.value) || 0)}
  className="mt-1 block w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-md text-white text-sm text-left" // 👈 added text-left
  placeholder="Enter amount (e.g. 0.5)"
/>


      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-y-2 table-auto">
          <thead>
            <tr className="text-zinc-400">
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Chain
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Base Fee (Gwei)
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Priority Fee (Gwei)
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Total Gas (Gwei)
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Gas Limit
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Gas Cost (USD)
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Tx Value (USD)
              </th>
              <th className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                Total Cost (USD)
              </th>
            </tr>
          </thead>
          <tbody>
            {CHAINS.map((chain) => {
              const data = chains[chain];
              const currentGasPriceGwei = data?.gasPrice || 0;
              const gasUsed = customGasUsed[chain];
              const calculatedGasCostUsd =
                simulatedCosts[chain]?.totalUsdCost || 0;
              const finalTotalCostUsd = calculatedGasCostUsd + txValueUsd;

              return (
                <tr key={chain} className="bg-zinc-700 rounded">
                  <td className="capitalize px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    {chain}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    {data.baseFee.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    {data.priorityFee.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    {currentGasPriceGwei.toFixed(2)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    <input
                      type="number"
                      min="0"
                      value={gasUsed}
                      onChange={(e) =>
                        setCustomGasUsed((prev) => ({
                          ...prev,
                          [chain]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-zinc-600 text-white p-1 rounded-md w-24 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    ${calculatedGasCostUsd.toFixed(4)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    ${txValueUsd.toFixed(4)}
                  </td>
                  <td className="px-2 sm:px-3 py-2 break-words max-w-[100px]">
                    ${finalTotalCostUsd.toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
