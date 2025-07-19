"use client";

import { useGasFeed } from "@/hooks/useGasFeed";
import { useEthUsdFeed } from "@/hooks/useEthUsdFeed";
import { useGasStore } from "@/store/useGasStore";
import { GasCard } from "@/components/GasCard";
import { SimulationPanel } from "@/components/SimulationPanel";
import GasChartWrapper from "@/components/GasChartWrapper"; // <-- ✅ import chart wrapper

export default function Home() {
  useGasFeed();
  useEthUsdFeed();

  const usdPrice = useGasStore((state) => state.usdPrice);
  const mode = useGasStore((state) => state.mode);
  const setMode = useGasStore((state) => state.setMode);

  return (
    <main className="min-h-screen p-8 bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-6">
        ⛽ Live Cross-Chain Gas Tracker
      </h1>

      <h2 className="text-xl mb-4">
        ETH/USD Price: {usdPrice > 0 ? `$${usdPrice.toFixed(2)}` : "Loading..."}
      </h2>

      <div className="mb-6">
        <span className="mr-4 font-medium">Mode:</span>
        <button
          onClick={() => setMode("live")}
          className={`px-4 py-1 rounded ${
            mode === "live" ? "bg-green-600" : "bg-zinc-700"
          }`}
        >
          Live
        </button>
        <button
          onClick={() => setMode("simulation")}
          className={`ml-2 px-4 py-1 rounded ${
            mode === "simulation" ? "bg-blue-600" : "bg-zinc-700"
          }`}
        >
          Simulation
        </button>
      </div>

      <div className="flex gap-6 flex-wrap">
        <GasCard chain="ethereum" />
        <GasCard chain="polygon" />
        <GasCard chain="arbitrum" />
      </div>

      {/* ✅ Render Simulation Panel if in simulation mode */}
      {mode === "simulation" && <SimulationPanel />}

      {/* ✅ Render Ethereum gas candlestick chart */}
      <GasChartWrapper />
    </main>
  );
}
