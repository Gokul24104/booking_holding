import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CandlestickData, UTCTimestamp } from "lightweight-charts";

type Chain = "ethereum" | "polygon" | "arbitrum";

export interface GasPoint {
  timestamp: number;
  baseFee: number;
  priorityFee: number;
  effectiveGasPrice: number;
}

interface ChainGasData {
  baseFee: number;
  priorityFee: number;
  gasPrice: number;
  history: GasPoint[];
  candlestickData: CandlestickData[];
}

interface SimulatedCost {
  gasUsed: number;
  totalUsdCost: number;
}

interface GasStoreState {
  mode: "live" | "simulation";
  chains: Record<Chain, ChainGasData>;
  usdPrice: number;
  txValue: number;
  simulatedCosts: Record<Chain, SimulatedCost>;

  updateChainData: (
    chain: Chain,
    data: { baseFee: number; priorityFee: number; gasPrice: number }
  ) => void;
  updateCandlestickData: (chain: Chain, candles: CandlestickData[]) => void;
  setUsdPrice: (price: number) => void;
  setTxValue: (value: number) => void;
  setMode: (mode: "live" | "simulation") => void;
  updateSimulatedCost: (chain: Chain, cost: SimulatedCost) => void;
}

const CANDLESTICK_INTERVAL_MS = 15 * 60 * 1000;

export const useGasStore = create<GasStoreState>()(
  persist(
    (set, get) => ({
      mode: "live",
      usdPrice: 0,
      txValue: 0,
      simulatedCosts: {
        ethereum: { gasUsed: 21000, totalUsdCost: 0 },
        polygon: { gasUsed: 21000, totalUsdCost: 0 },
        arbitrum: { gasUsed: 21000, totalUsdCost: 0 },
      },
      chains: {
        ethereum: {
          baseFee: 0,
          priorityFee: 0,
          gasPrice: 0,
          history: [],
          candlestickData: [],
        },
        polygon: {
          baseFee: 0,
          priorityFee: 0,
          gasPrice: 0,
          history: [],
          candlestickData: [],
        },
        arbitrum: {
          baseFee: 0,
          priorityFee: 0,
          gasPrice: 0,
          history: [],
          candlestickData: [],
        },
      },

      updateChainData: (chain, data) => {
        set((state) => {
          const existingChainData = state.chains?.[chain] ?? {
            baseFee: 0,
            priorityFee: 0,
            gasPrice: 0,
            history: [],
            candlestickData: [],
          };

          const now = Date.now();
          const newPoint: GasPoint = {
            timestamp: now,
            baseFee: data.baseFee,
            priorityFee: data.priorityFee,
            effectiveGasPrice: data.gasPrice,
          };

          const history = Array.isArray(existingChainData.history)
            ? existingChainData.history
            : [];

          const candlestickData = Array.isArray(
            existingChainData.candlestickData
          )
            ? [...existingChainData.candlestickData]
            : [];

          const bucketStart =
            Math.floor(now / CANDLESTICK_INTERVAL_MS) * CANDLESTICK_INTERVAL_MS;
          const bucketTime = Math.floor(bucketStart / 1000) as UTCTimestamp;
          const lastCandle = candlestickData[candlestickData.length - 1];

          if (!lastCandle || lastCandle.time !== bucketTime) {
            candlestickData.push({
              time: bucketTime,
              open: newPoint.effectiveGasPrice,
              high: newPoint.effectiveGasPrice,
              low: newPoint.effectiveGasPrice,
              close: newPoint.effectiveGasPrice,
            });
            if (candlestickData.length > 100) candlestickData.shift();
          } else {
            lastCandle.high = Math.max(
              lastCandle.high,
              newPoint.effectiveGasPrice
            );
            lastCandle.low = Math.min(
              lastCandle.low,
              newPoint.effectiveGasPrice
            );
            lastCandle.close = newPoint.effectiveGasPrice;
          }

          return {
            chains: {
              ...state.chains,
              [chain]: {
                ...existingChainData,
                baseFee: data.baseFee,
                priorityFee: data.priorityFee,
                gasPrice: data.gasPrice,
                history: [...history.slice(-59), newPoint],
                candlestickData,
              },
            },
          };
        });
      },

      updateCandlestickData: (chain, candles) => {
        set((state) => ({
          chains: {
            ...state.chains,
            [chain]: {
              ...state.chains[chain],
              candlestickData: candles,
            },
          },
        }));
      },

      setUsdPrice: (price) => set({ usdPrice: price }),
      setTxValue: (value) => set({ txValue: value }),
      setMode: (mode) => set({ mode }),
      updateSimulatedCost: (chain, cost) =>
        set((state) => ({
          simulatedCosts: {
            ...state.simulatedCosts,
            [chain]: cost,
          },
        })),
    }),
    {
      name: "gas-store", // key in localStorage
      partialize: (state) => ({
        chains: {
          ethereum: state.chains.ethereum ?? {
            baseFee: 0,
            priorityFee: 0,
            gasPrice: 0,
            history: [],
            candlestickData: [],
          },
          polygon: state.chains.polygon ?? {
            baseFee: 0,
            priorityFee: 0,
            gasPrice: 0,
            history: [],
            candlestickData: [],
          },
          arbitrum: state.chains.arbitrum ?? {
            baseFee: 0,
            priorityFee: 0,
            gasPrice: 0,
            history: [],
            candlestickData: [],
          },
        },
        simulatedCosts: state.simulatedCosts,
        usdPrice: state.usdPrice,
        txValue: state.txValue,
        mode: state.mode,
      }),
    }
  )
);
