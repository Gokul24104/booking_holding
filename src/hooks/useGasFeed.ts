import { useEffect } from "react";
import {
  JsonRpcProvider,
  WebSocketProvider,
  formatUnits,
  FeeData,
} from "ethers";
import { useGasStore } from "@/store/useGasStore";
import { UTCTimestamp, CandlestickData } from "lightweight-charts";

type Chain = "ethereum" | "polygon" | "arbitrum";

const RPCS: Record<Chain, string> = {
  ethereum: "https://mainnet.infura.io/v3/64c5c4fd9487432bb6be33ae45fe6300",
  polygon:"https://polygon-mainnet.infura.io/v3/93727e51c27c4f0a96a80507f2bed9c1",
  arbitrum: "https://arb-mainnet.g.alchemy.com/v2/GoWn1sSDa01QBMXTXnjlL",
};

export default function useGasFeed() {
  const updateChainData = useGasStore((state) => state.updateChainData);
  const updateCandlestickData = useGasStore.getState().updateCandlestickData;

  useEffect(() => {
    const providers: Partial<
      Record<Chain, JsonRpcProvider | WebSocketProvider>
    > = {};
    const intervals: Record<Chain, NodeJS.Timeout> = {} as any;

    const setupChain = (chain: Chain) => {
      const rpc = RPCS[chain];
      const provider = rpc.startsWith("wss")
        ? new WebSocketProvider(rpc)
        : new JsonRpcProvider(rpc);

      providers[chain] = provider;

      const fetchGas = async () => {
        try {
          const feeData: FeeData = await provider.getFeeData();
          const block = await provider.getBlock("latest");

          let baseFee = 0;
          let priorityFee = 0;
          let totalGasPrice = 0;

          if (chain === "ethereum") {
            const rawBaseFee = block?.baseFeePerGas ?? 0n;
            const rawMaxFee = feeData.maxFeePerGas ?? 0n;
            const rawPriority = rawMaxFee - rawBaseFee;

            baseFee = parseFloat(formatUnits(rawBaseFee, "gwei"));
            priorityFee = parseFloat(formatUnits(rawPriority, "gwei"));
            totalGasPrice = parseFloat(formatUnits(rawMaxFee, "gwei"));
          } else if (chain === "polygon") {
            const rawGasPrice = feeData.gasPrice ?? 0n;
            totalGasPrice = parseFloat(formatUnits(rawGasPrice, "gwei"));
            baseFee = totalGasPrice;
            priorityFee = 0;
          } else if (chain === "arbitrum") {
            const rawGasPrice = feeData.gasPrice ?? 0n;
            totalGasPrice = parseFloat(formatUnits(rawGasPrice, "gwei"));
            baseFee = totalGasPrice;
            priorityFee = 0;
          }

          updateChainData(chain, {
            baseFee,
            priorityFee,
            gasPrice: totalGasPrice,
          });

          // Candlestick logic...
          const now = Date.now();
          const roundedTimestamp =
            Math.floor(now / (15 * 60 * 1000)) * (15 * 60 * 1000);
          const time = Math.floor(roundedTimestamp / 1000) as UTCTimestamp;

          const state = useGasStore.getState();
          const candles = state.chains[chain].candlestickData;
          const last = candles[candles.length - 1];

          let updatedCandles: CandlestickData[] = [];

          if (!last || last.time !== time) {
            updatedCandles = [
              ...candles,
              {
                time,
                open: totalGasPrice,
                high: totalGasPrice,
                low: totalGasPrice,
                close: totalGasPrice,
              },
            ];
          } else {
            const updated = { ...last };
            updated.high = Math.max(updated.high, totalGasPrice);
            updated.low = Math.min(updated.low, totalGasPrice);
            updated.close = totalGasPrice;
            updatedCandles = [...candles.slice(0, -1), updated];
          }

          if (updatedCandles.length > 100) {
            updatedCandles = updatedCandles.slice(updatedCandles.length - 100);
          }

          updateCandlestickData(chain, updatedCandles);

          console.log(
            `[${chain}] base: ${baseFee} Gwei, priority: ${priorityFee} Gwei, total: ${totalGasPrice} Gwei`
          );
        } catch (err) {
          console.error(`[${chain}] Gas Fetch Error:`, err);
        }
      };

      fetchGas();
      intervals[chain] = setInterval(fetchGas, 15_000);
    };

    (["ethereum", "polygon", "arbitrum"] as Chain[]).forEach(setupChain);

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, []);
}
