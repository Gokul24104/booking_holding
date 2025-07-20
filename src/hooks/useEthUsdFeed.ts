// hooks/useEthUsdFeed.ts
import { useEffect } from "react";
import { WebSocketProvider, Contract } from "ethers";
import { useGasStore } from "../store/useGasStore"; // Ensure path is correct

// Uniswap V3 ETH/USDC pool (0.3%)
const POOL_ADDRESS = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640"; // This is WETH/USDC
const POOL_ABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
  "function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)",
];

// Token decimals for the WETH/USDC pool
const WETH_DECIMALS = 18; // Token1
const USDC_DECIMALS = 6;  // Token0

export default function useEthUsdFeed() {
  const setUsdPrice = useGasStore((s) => s.setUsdPrice);

  useEffect(() => {
    // IMPORTANT: Move provider initialization inside useEffect
    const provider = new WebSocketProvider(
      process.env.NEXT_PUBLIC_ETH_RPC_WSS_UNISWAP || "wss://mainnet.infura.io/ws/v3/YOUR_INFURA_PROJECT_ID"
    );
    const pool = new Contract(POOL_ADDRESS, POOL_ABI, provider);

    // Corrected price calculation function for WETH/USDC
    function priceFrom(sqrtPriceX96: bigint): number {
      // The price `P` stored in Uniswap V3 is `P = (sqrtPriceX96 / (2^96))^2`.
      // This `P` represents the ratio of `amount_token1 / amount_token0` in terms of their *smallest units*.
      // For this pool (0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640):
      // Token0 is USDC (6 decimals)
      // Token1 is WETH (18 decimals)
      // We want price of 1 WETH in USD (USDC). So, `price = USDC_amount / WETH_amount`.
      // This is `token0_value / token1_value`.

      // The `P` from Uniswap is `(amount_WETH_smallest_unit / amount_USDC_smallest_unit)`.
      // So, `(sqrtPriceX96 / 2^96)^2` gives `WETH_raw / USDC_raw`.
      // We want `USDC_raw / WETH_raw`. So we need the reciprocal of `P`.
      // `inverted_P = 1 / P = (2^192) / (sqrtPriceX96^2)`

      // Then, we need to adjust for the token decimals to get the human-readable price:
      // `final_price = inverted_P * (10^decimals_token1 / 10^decimals_token0)`
      // `final_price = ((2^192) / (sqrtPriceX96^2)) * (10^WETH_DECIMALS / 10^USDC_DECIMALS)`

      const Q192 = 2n ** 192n;
      const sqrtPriceX96Squared = sqrtPriceX96 * sqrtPriceX96;

      if (sqrtPriceX96Squared === 0n) return 0; // Prevent division by zero

      const termNumerator = Q192 * (10n ** BigInt(WETH_DECIMALS));
      const termDenominator = sqrtPriceX96Squared * (10n ** BigInt(USDC_DECIMALS));

      // To maintain precision for BigInt division, multiply by a large factor before division
      const precisionFactor = 1_000_000_000_000_000_000n; // 1e18 for sufficient precision

      const ethUsdPriceBigInt = (termNumerator * precisionFactor) / termDenominator;

      return Number(ethUsdPriceBigInt) / Number(precisionFactor);
    }

    // 1️⃣ Initial slot0 price
    pool
      .slot0()
      .then((slot: any) => {
        const price = priceFrom(BigInt(slot.sqrtPriceX96));
        console.log("✅ Initial ETH/USD from slot0():", price);
        if (!isNaN(price) && price > 0) { // Basic validation
          setUsdPrice(price);
        }
      })
      .catch((err) => {
        console.error("❌ slot0() fetch failed:", err);
      });

    // 2️⃣ Real-time Swap events
    const onSwap = (
      _sender: string,
      _recipient: string,
      _amount0: bigint,
      _amount1: bigint,
      sqrtPriceX96: bigint
    ) => {
      const livePrice = priceFrom(sqrtPriceX96);
      console.log("🔁 Live ETH/USD from Swap event:", livePrice);
      if (!isNaN(livePrice) && livePrice > 0) { // Basic validation
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
        if (!isNaN(price) && price > 0) { // Basic validation
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