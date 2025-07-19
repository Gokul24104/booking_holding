'use client'

import { useEffect, useRef } from 'react'
import {
  createChart,
  LineData,
  IChartApi,
} from 'lightweight-charts'

interface Props {
  data: {
    ethereum: LineData[]
    polygon: LineData[]
    arbitrum: LineData[]
  }
}

export default function CrossChainLineChart({ data }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 300,
      layout: {
        background: { color: '#18181b' },
        textColor: '#e4e4e7',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      timeScale: {
        borderColor: '#485c7b',
      },
    })

    chartRef.current = chart

    const ethSeries = chart.addLineSeries({ color: '#00bcd4', lineWidth: 2 })
    ethSeries.setData(data.ethereum)

    const polygonSeries = chart.addLineSeries({ color: '#8bc34a', lineWidth: 2 })
    polygonSeries.setData(data.polygon)

    const arbSeries = chart.addLineSeries({ color: '#ff9800', lineWidth: 2 })
    arbSeries.setData(data.arbitrum)

    return () => chart.remove()
  }, [data])

  return <div ref={chartContainerRef} className="w-full h-[300px] mt-8" />
}
