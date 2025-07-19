"use client";

import { useEffect } from "react";
import { ethers } from "ethers";
import { useGasStore } from "@/store/useGasStore";

const ABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
];
const UNISWAP_V3_ETH_USDC_POOL = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";
const SWAP_TOPIC =
  "0xd78ad95fa46c994b6551d0da85fc275fe61300544c2a57f8dfd61956b5e0b8c8";

export function useEthUsdFeed() {
  const setUsdPrice = useGasStore((state) => state.setUsdPrice); // ✅ update function
  const fallback = useGasStore.getState().usdPrice; // ✅ last known price

  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(
      "https://eth-mainnet.g.alchemy.com/v2/j-1npzNkKB1jxiuaR6alA"
    );
    const iface = new ethers.Interface(ABI);

    const fetchLatestSwap = async () => {
      const latestBlock = await provider.getBlockNumber();
      let logs: ethers.Log[] = [];

      for (let i = 0; i < 5; i++) {
        const toBlock = latestBlock - i * 500;
        const fromBlock = toBlock - 499;

        try {
          const chunkLogs = await provider.getLogs({
            address: UNISWAP_V3_ETH_USDC_POOL,
            topics: [SWAP_TOPIC],
            fromBlock,
            toBlock,
          });

          if (chunkLogs.length > 0) {
            logs = chunkLogs;
            break;
          }
        } catch (err) {
          console.error("Error fetching logs:", err);
        }
      }

      if (logs.length > 0) {
        try {
          const parsed = iface.parseLog(logs[logs.length - 1]);
          const sqrtPriceX96 = parsed?.args?.sqrtPriceX96 as bigint;
          const price = (sqrtPriceX96 ** 2n * 10n ** 12n) / 2n ** 192n;
          const usd = Number(price) / 1e6;

          setUsdPrice(usd); // ✅ update Zustand store
          console.log(`ETH/USD updated: $${usd.toFixed(2)}`);
        } catch (err) {
          console.warn("Failed to parse swap, using fallback");
          setUsdPrice(fallback);
        }
      } else {
        console.warn("No Swap logs found, using fallback");
        setUsdPrice(fallback);
      }
    };

    fetchLatestSwap();
    const interval = setInterval(fetchLatestSwap, 60000);
    return () => clearInterval(interval);
  }, [setUsdPrice]);
}
