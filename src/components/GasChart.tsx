"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type CandlestickData,
  type IChartApi,
  type ISeriesApi,
} from "lightweight-charts";
import { useGasStore } from "@/store/useGasStore";

interface GasChartProps {
  chain: "ethereum" | "polygon" | "arbitrum";
}

export default function GasChart({ chain }: GasChartProps) {
  const data = useGasStore(
    (state) => state.chains[chain]?.candlestickData ?? []
  );

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 320,
      layout: {
        background: { color: "#18181b" },
        textColor: "#e4e4e7",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      timeScale: {
        borderColor: "#3f3f46",
        timeVisible: true,
        secondsVisible: false,
        tickMarkFormatter: (time: number) => {
          const date = new Date(time * 1000);
          return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
        },
      },

      rightPriceScale: {
        borderColor: "#3f3f46",
      },
      crosshair: {
        mode: 1,
      },
    });

    chartRef.current = chart;

    const series = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    seriesRef.current = series;
    series.setData(data);

    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "1000";
    tooltip.style.background = "#27272a";
    tooltip.style.color = "#e4e4e7";
    tooltip.style.padding = "6px 10px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.pointerEvents = "none";
    tooltip.style.fontSize = "12px";
    tooltip.style.display = "none";
    container.appendChild(tooltip);
    tooltipRef.current = tooltip;

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData.size) {
        tooltip.style.display = "none";
        return;
      }

      const point = param.point;
      const candle = param.seriesData.get(series) as
        | CandlestickData
        | undefined;

      if (!candle) {
        tooltip.style.display = "none";
        return;
      }

      const { open, high, low, close } = candle;

      // Convert time to readable format (assume UNIX timestamp in seconds)
      const timestamp =
        typeof param.time === "number"
          ? new Date(param.time * 1000)
          : new Date((param.time as any).timestamp * 1000);

      const formattedTime = timestamp.toLocaleString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        day: "numeric",
        month: "short",
      });

      tooltip.innerHTML = `
  <strong>Time</strong>: ${formattedTime}<br/>
  <strong>OHLC</strong><br/>
  Open: ${open}<br/>
  High: ${high}<br/>
  Low: ${low}<br/>
  Close: ${close}
`;

      tooltip.style.display = "block";
      tooltip.style.left = `${(point?.x ?? 0) + 10}px`;
      tooltip.style.top = `${(point?.y ?? 0) + 10}px`;
    });

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [data]);

  // Update chart data when Zustand store changes
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return (
    <div className="w-full flex justify-center mt-6 mb-16 px-4">
      <div
        ref={chartContainerRef}
        className="w-full max-w-3xl rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg relative"
        style={{ height: 320 }}
      />
    </div>
  );
}
