"use client";

import { useState } from "react";
import useEthUsdFeed from "@/hooks/useEthUsdFeed";
import useGasFeed from "@/hooks/useGasFeed";
import { useGasStore } from "@/store/useGasStore";
import { GasCard } from "@/components/GasCard";
import { SimulationPanel } from "@/components/SimulationPanel";
import GasChart from "@/components/GasChart";
import ThemeToggle from "@/components/ThemeToggle";

export default function Home() {
  useGasFeed();
  useEthUsdFeed();

  const usdPrice = useGasStore((state) => state.usdPrice);
  const mode = useGasStore((state) => state.mode);
  const setMode = useGasStore((state) => state.setMode);

  const ethereumCandles = useGasStore((s) => s.chains.ethereum.candlestickData);
  const polygonCandles = useGasStore((s) => s.chains.polygon.candlestickData);
  const arbitrumCandles = useGasStore((s) => s.chains.arbitrum.candlestickData);

  const [selectedChain, setSelectedChain] = useState<
    "ethereum" | "polygon" | "arbitrum"
  >("ethereum");

  const chartDataMap = {
    ethereum: ethereumCandles,
    polygon: polygonCandles,
    arbitrum: arbitrumCandles,
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white text-black dark:bg-zinc-950 dark:text-white transition-colors duration-300">
      {/* Theme Toggle Button */}
          <ThemeToggle />
      {/* Sidebar */}
      <aside className="w-full md:w-64 p-4 md:p-6 bg-zinc-100 dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-300 dark:border-zinc-800">
        <h2 className="text-2xl font-bold mb-6 md:mb-10">Gas Tracker</h2>
        <div className="space-y-4 md:space-y-6">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            ETH/USD:{" "}
            <span className="font-semibold text-black dark:text-white">
              ${usdPrice?.toFixed(2) || "Loading..."}
            </span>
          </div>
          <div className="space-y-2">
            <button
              onClick={() => setMode("live")}
              className={`w-full px-4 py-2 rounded-md text-left transition font-semibold ${
                mode === "live"
                  ? "bg-green-500 text-black"
                  : "bg-zinc-200 dark:bg-zinc-800 hover:bg-green-600 hover:text-black dark:hover:text-white"
              }`}
            >
              Live Mode
            </button>
            <button
              onClick={() => setMode("simulation")}
              className={`w-full px-4 py-2 rounded-md text-left transition font-semibold ${
                mode === "simulation"
                  ? "bg-blue-500 text-black"
                  : "bg-zinc-200 dark:bg-zinc-800 hover:bg-blue-600 hover:text-black dark:hover:text-white"
              }`}
            >
              Simulation Mode
            </button>
          </div>

          
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 px-4 md:px-6 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold">Dashboard</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
          {/* Gas Prices Table (Now Left side) */}
          <div className="lg:col-span-2">
            <h2 className="text-lg md:text-xl font-semibold mb-4">Gas Prices</h2>
            <div className="overflow-auto rounded-lg border border-zinc-300 dark:border-zinc-800 mb-6">
              <table className="min-w-full text-sm text-left text-black dark:text-white">
                <thead className="bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-b border-zinc-300 dark:border-zinc-700">
                  <tr>
                    <th className="px-4 py-2">Chain</th>
                    <th className="px-4 py-2">Base Fee</th>
                    <th className="px-4 py-2">Priority Fee</th>
                    <th className="px-4 py-2">Total (Gwei)</th>
                    <th className="px-4 py-2">21k Tx Cost (USD)</th>
                  </tr>
                </thead>
                <tbody className="bg-zinc-100 dark:bg-zinc-900 divide-y divide-zinc-300 dark:divide-zinc-800">
                  <GasCard chain="ethereum" asRow />
                  <GasCard chain="polygon" asRow />
                  <GasCard chain="arbitrum" asRow />
                </tbody>
              </table>
            </div>

            {/* Simulation Panel shown below gas prices */}
            {mode === "simulation" && (
              <div className="bg-zinc-100 dark:bg-zinc-900 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold mb-4">Simulation Panel</h2>
                <SimulationPanel />
              </div>
            )}
          </div>

          {/* Gas Chart (Now right side) */}
          <div>
            <div className="mb-4 md:mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <h2 className="text-lg md:text-xl font-semibold">
                Gas Price Chart
              </h2>
              <select
                value={selectedChain}
                onChange={(e) => setSelectedChain(e.target.value as any)}
                className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white px-3 py-2 rounded border border-zinc-300 dark:border-zinc-700"
              >
                <option value="ethereum">Ethereum</option>
                <option value="polygon">Polygon</option>
                <option value="arbitrum">Arbitrum</option>
              </select>
            </div>
            <div className="bg-zinc-100 dark:bg-zinc-900 p-4 rounded-lg shadow-lg">
              <GasChart chain={selectedChain} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-zinc-600 dark:text-zinc-500">
          Powered by EVM RPC + Uniswap V3 | Built by Gokul
        </footer>
      </main>
    </div>
  );
}
