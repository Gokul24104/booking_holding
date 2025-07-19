import { useEffect } from "react";
import {
  WebSocketProvider,
  JsonRpcProvider,
  formatUnits,
  Provider,
} from "ethers";
import { useGasStore } from "../store/useGasStore";

type Chain = "ethereum" | "polygon" | "arbitrum";

const RPCS: Record<Chain, string> = {
  ethereum: "wss://mainnet.infura.io/ws/v3/64c5c4fd9487432bb6be33ae45fe6300",
  polygon: "https://polygon-mainnet.infura.io/v3/93727e51c27c4f0a96a80507f2bed9c1",
  arbitrum: "wss://arb-mainnet.g.alchemy.com/v2/GoWn1sSDa01QBMXTXnjlL",
};

export default function useGasFeed() {
  const updateChainData = useGasStore((state) => state.updateChainData);

  useEffect(() => {
    const providers: Partial<Record<Chain, Provider>> = {};

    (["ethereum", "polygon", "arbitrum"] as Chain[]).forEach((chain) => {
      const rpcUrl = RPCS[chain];
      const provider = rpcUrl.startsWith("wss")
        ? new WebSocketProvider(rpcUrl)
        : new JsonRpcProvider(rpcUrl);

      providers[chain] = provider;

      provider.on("block", async (blockNumber: number) => {
        try {
          let baseFeeGwei = 0;
          let priorityFeeGwei = 0;

          const block = await provider.getBlock(blockNumber);
          if (!block) return;

          if (chain === "polygon") {
            const fallback = new JsonRpcProvider(rpcUrl);
            const gasPrice = await fallback.send("eth_gasPrice", []);
            baseFeeGwei = parseFloat(formatUnits(BigInt(gasPrice), "gwei"));
            priorityFeeGwei = 0;
          } else {
            if (block.baseFeePerGas) {
              baseFeeGwei = parseFloat(formatUnits(block.baseFeePerGas, "gwei"));
              priorityFeeGwei = baseFeeGwei; // Estimate for now
            }
          }

          updateChainData(chain, {
            baseFee: baseFeeGwei,
            priorityFee: priorityFeeGwei,
          });
        } catch (err) {
          console.error(`[${chain}] Error fetching gas data:`, err);
        }
      });

      // Only attach WS error listeners if it's a WebSocketProvider
      if (provider instanceof WebSocketProvider && provider.websocket) {
        const socket = provider.websocket as WebSocket;

        socket.onerror = (e: Event) => {
          console.error(`[${chain}] WebSocket error:`, e);
        };

        socket.onclose = (e: CloseEvent) => {
          console.warn(`[${chain}] WebSocket closed:`, e.code);
        };
      }
    });

    return () => {
      (["ethereum", "polygon", "arbitrum"] as Chain[]).forEach((chain) => {
        const provider = providers[chain];
        if (provider && "removeAllListeners" in provider) {
          provider.removeAllListeners();
          if ("destroy" in provider && typeof provider.destroy === "function") {
            (provider as WebSocketProvider).destroy();
          }
        }
      });
    };
  }, [updateChainData]);
}
