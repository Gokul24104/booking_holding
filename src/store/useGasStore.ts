import { create } from 'zustand'
import { CandlestickData, UTCTimestamp } from 'lightweight-charts'

type Chain = 'ethereum' | 'polygon' | 'arbitrum'

export interface GasPoint {
  timestamp: number
  baseFee: number
  priorityFee: number
}

interface ChainGasData {
  baseFee: number
  priorityFee: number
  history: GasPoint[]
}

interface GasStoreState {
  mode: 'live' | 'simulation'
  chains: Record<Chain, ChainGasData>
  usdPrice: number
  txValue: number
  updateChainData: (chain: Chain, data: { baseFee: number; priorityFee: number }) => void
  setUsdPrice: (price: number) => void
  setTxValue: (value: number) => void
  setMode: (mode: 'live' | 'simulation') => void
}

export const useGasStore = create<GasStoreState>((set, get) => ({
  mode: 'live',
  usdPrice: 0,
  txValue: 0,
  chains: {
    ethereum: { baseFee: 0, priorityFee: 0, history: [] },
    polygon: { baseFee: 0, priorityFee: 0, history: [] },
    arbitrum: { baseFee: 0, priorityFee: 0, history: [] },
  },
  updateChainData: (chain, data) => {
    const prev = get().chains[chain]
    const now = Date.now()
    const newPoint: GasPoint = {
      timestamp: now,
      baseFee: data.baseFee,
      priorityFee: data.priorityFee,
    }

    set((state) => ({
      chains: {
        ...state.chains,
        [chain]: {
          ...data,
          history: [...prev.history.slice(-59), newPoint], // keep last 60 entries
        },
      },
    }))
  },
  setUsdPrice: (price) => set({ usdPrice: price }),
  setTxValue: (value) => set({ txValue: value }),
  setMode: (mode) => set({ mode }),
}))

// ✅ Utility to convert gas history to 15-minute OHLC candles
export function getCandles(
  history: GasPoint[],
  intervalMs: number = 15 * 60 * 1000
): CandlestickData[] {
  const candles: CandlestickData[] = []

  if (!history.length) return candles

  let startTime = Math.floor(history[0].timestamp / intervalMs) * intervalMs
  let bucket: GasPoint[] = []

  for (const point of history) {
    const bucketStart = Math.floor(point.timestamp / intervalMs) * intervalMs

    if (bucketStart !== startTime) {
      const ohlc = convertToOHLC(bucket, startTime)
      if (ohlc) candles.push(ohlc)
      bucket = []
      startTime = bucketStart
    }

    bucket.push(point)
  }

  const last = convertToOHLC(bucket, startTime)
  if (last) candles.push(last)

  return candles
}

function convertToOHLC(points: GasPoint[], time: number): CandlestickData | null {
  if (!points.length) return null

  const open = points[0].baseFee
  const close = points[points.length - 1].baseFee
  const high = Math.max(...points.map((p) => p.baseFee))
  const low = Math.min(...points.map((p) => p.baseFee))

  return {
    time: Math.floor(time / 1000) as UTCTimestamp,
    open,
    high,
    low,
    close,
  }
}
