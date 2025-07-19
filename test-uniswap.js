const { ethers } = require("ethers");

const ABI = [
  "event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)",
];

const UNISWAP_V3_ETH_USDC_POOL = "0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640";
const SWAP_TOPIC =
  "0xd78ad95fa46c994b6551d0da85fc275fe61300544c2a57f8dfd61956b5e0b8c8";

async function checkRandomBlocks(numChecks = 300, range = 120000) {
  const provider = new ethers.JsonRpcProvider(
    "https://eth-mainnet.g.alchemy.com/v2/j-1npzNkKB1jxiuaR6alA"
  );
  const iface = new ethers.Interface(ABI);

  const latestBlock = await provider.getBlockNumber();

  for (let i = 0; i < numChecks; i++) {
    const randomBlock = latestBlock - Math.floor(Math.random() * range);
    console.log(`🔍 Checking block: ${randomBlock}`);
    try {
      const logs = await provider.getLogs({
        address: UNISWAP_V3_ETH_USDC_POOL,
        topics: [SWAP_TOPIC],
        fromBlock: randomBlock,
        toBlock: randomBlock,
      });

      if (logs.length > 0) {
        const parsed = iface.parseLog(logs[logs.length - 1]);
        if (parsed) {
          const sqrtPriceX96 = parsed.args.sqrtPriceX96;
          const price = (sqrtPriceX96 ** 2n * 10n ** 12n) / 2n ** 192n;
          const usd = Number(price) / 1e6;
          console.log(`✅ Found swap in block ${randomBlock}`);
          console.log(`💰 ETH/USD Price from Uniswap V3: $${usd.toFixed(2)}`);
          return; // ✅ Exit the function immediately
        }
      } else {
        console.log("⛔ No swap events found.");
      }
    } catch (err) {
      console.error("❌ Error fetching logs:", err);
    }
  }

  console.log("❗ Completed all checks without finding a swap event.");
}

checkRandomBlocks();
