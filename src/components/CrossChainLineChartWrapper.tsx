'use client'

import { Time, LineData } from 'lightweight-charts'
import { useGasStore, GasPoint } from '@/store/useGasStore'
import CrossChainLineChart from './CrossChainLineChart'

function convertHistoryToLineData(history: GasPoint[]): LineData<Time>[] {
  return history.map((point) => ({
    time: (point.timestamp / 1000) as Time, // cast to Time
    value: point.baseFee,
  }))
}


export default function CrossChainLineChartWrapper() {
  const { chains } = useGasStore()

  const ethData = convertHistoryToLineData(chains.ethereum.history)
  const polygonData = convertHistoryToLineData(chains.polygon.history)
  const arbitrumData = convertHistoryToLineData(chains.arbitrum.history)

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">
        🔁 Cross-Chain Gas Fee Comparison (Base Fee in Gwei)
      </h2>
      <CrossChainLineChart
        data={{
          ethereum: ethData,
          polygon: polygonData,
          arbitrum: arbitrumData,
        }}
      />
    </div>
  )
}
