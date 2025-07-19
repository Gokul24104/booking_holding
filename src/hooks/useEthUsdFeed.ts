import { useEffect } from "react";
import { WebSocketProvider, Contract } from "ethers";
import { useGasStore } from "../store/useGasStore";

// Uniswap V3 ETH/USDC pool (0.3%)
const POOL_ADDRESS = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";
const POOL_ABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

// ✅ Use WSS for live updates
const provider = new WebSocketProvider(
  "wss://mainnet.infura.io/ws/v3/64c5c4fd9487432bb6be33ae45fe6300"
);

export default function useEthUsdFeed() {
  const setUsdPrice = useGasStore((s) => s.setUsdPrice);

  useEffect(() => {
    const pool = new Contract(POOL_ADDRESS, POOL_ABI, provider);

    function priceFrom(sqrtPriceX96: bigint): number {
      const numerator = sqrtPriceX96 * sqrtPriceX96;
      const denominator = 2n ** 192n;

      // This will give price * 1e6 (because USDC has 6 decimals)
      const rawPrice = numerator / denominator;

      // Convert from rawPrice (1e6 scaled) to float
      return Number(rawPrice) / 1e6;
    }

    // 1️⃣ Initial slot0 price
    pool
      .slot0()
      .then((slot: any) => {
        const price = priceFrom(BigInt(slot.sqrtPriceX96));
        console.log("✅ Initial ETH/USD from slot0():", price);
        setUsdPrice(price);
      })
      .catch((err) => {
        console.error("❌ slot0() fetch failed:", err);
      });

    // 2️⃣ Real-time Swap events
    const onSwap = (
      _sender: string,
      _recipient: string,
      _amt0: any,
      _amt1: any,
      sqrtPriceX96: bigint
    ) => {
      const livePrice = priceFrom(sqrtPriceX96);
      console.log("🔁 Live ETH/USD from Swap event:", livePrice);
      setUsdPrice(livePrice);
    };

    pool.on("Swap", onSwap);

    // 3️⃣ Poll fallback every 10s
    const interval = setInterval(async () => {
      try {
        const slot = await pool.slot0();
        const price = priceFrom(BigInt(slot.sqrtPriceX96));
        console.log("⏱️ Polled ETH/USD from slot0():", price);
        setUsdPrice(price);
      } catch (err) {
        console.error("❌ Polling slot0() failed:", err);
      }
    }, 10_000);

    return () => {
      pool.off("Swap", onSwap);
      clearInterval(interval);
      provider.destroy();
    };
  }, [setUsdPrice]);
}
