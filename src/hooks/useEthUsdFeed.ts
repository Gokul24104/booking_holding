import { useEffect } from "react";
import { WebSocketProvider, Contract } from "ethers";
import { useGasStore } from "../store/useGasStore";

// Uniswap V3 ETH/USDC pool (0.3%)
const POOL_ADDRESS = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"; // WETH/USDC
const POOL_ABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

const WETH_DECIMALS = 18;
const USDC_DECIMALS = 6;

export default function useEthUsdFeed() {
  const setUsdPrice = useGasStore((s) => s.setUsdPrice);

  useEffect(() => {
    const WSS_URL =
      process.env.NEXT_PUBLIC_ETH_RPC_WSS_UNISWAP ||
      "wss://mainnet.infura.io/ws/v3/64c5c4fd9487432bb6be33ae45fe6300";

    const provider = new WebSocketProvider(WSS_URL);

    const pool = new Contract(POOL_ADDRESS, POOL_ABI, provider);

    function priceFrom(sqrtPriceX96: bigint): number {
      const Q192 = 2n ** 192n;
      const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96;

      if (sqrtPriceX96Squared === 0n) return 0;

      const termNumerator = Q192 * (10n ** BigInt(WETH_DECIMALS));
      const termDenominator = sqrtPriceX96Squared * (10n ** BigInt(USDC_DECIMALS));
      const precisionFactor = 1_000_000_000_000_000_000n;

      const ethUsdPriceBigInt = (termNumerator * precisionFactor) / termDenominator;

      return Number(ethUsdPriceBigInt) / Number(precisionFactor);
    }

    // 1️⃣ Initial price from slot0
    pool
      .slot0()
      .then((slot: any) => {
        const price = priceFrom(BigInt(slot.sqrtPriceX96));
        console.log("✅ Initial ETH/USD from slot0():", price);
        if (!isNaN(price) && price > 0) {
          setUsdPrice(price);
        }
      })
      .catch((err) => {
        console.error("❌ slot0() fetch failed:", err);
      });

    // 2️⃣ Listen for Swap events
    const onSwap = (
      _sender: string,
      _recipient: string,
      _amount0: bigint,
      _amount1: bigint,
      sqrtPriceX96: bigint
    ) => {
      const livePrice = priceFrom(sqrtPriceX96);
      console.log("🔁 Live ETH/USD from Swap event:", livePrice);
      if (!isNaN(livePrice) && livePrice > 0) {
        setUsdPrice(livePrice);
      }
    };

    pool.on("Swap", onSwap);

    // 3️⃣ Poll fallback every 10s
    const interval = setInterval(async () => {
      try {
        const slot = await pool.slot0();
        const price = priceFrom(BigInt(slot.sqrtPriceX96));
        console.log("⏱️ Polled ETH/USD from slot0():", price);
        if (!isNaN(price) && price > 0) {
          setUsdPrice(price);
        }
      } catch (err) {
        console.error("❌ Polling slot0() failed:", err);
      }
    }, 10_000);

    return () => {
      pool.off("Swap", onSwap);
      clearInterval(interval);
    };
  }, [setUsdPrice]);
}
