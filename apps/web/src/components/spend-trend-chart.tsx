"use client";

import { formatUsd } from "@/lib/format";

interface TrendPoint {
  readonly period: string;
  readonly amountMinorUnits: number;
}

/**
 * A dependency-free bar chart for the total spend trend. Kept intentionally
 * simple (no charting library) so the demo has zero client-side surface area
 * beyond plain SVG/DOM — every bar height is derived directly from the props.
 */
export function SpendTrendChart({ points }: { points: readonly TrendPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-zinc-500">No spend data available.</p>;
  }

  const max = Math.max(...points.map((p) => p.amountMinorUnits));

  return (
    <div className="flex h-56 items-end gap-2">
      {points.map((point) => {
        const heightPercent = max > 0 ? (point.amountMinorUnits / max) * 100 : 0;
        return (
          <div key={point.period} className="group flex flex-1 flex-col items-center gap-2">
            <div className="relative flex h-44 w-full items-end">
              <div
                className="w-full rounded-t-md bg-emerald-500 transition-colors group-hover:bg-emerald-600"
                style={{ height: `${Math.max(heightPercent, 2)}%` }}
                title={`${point.period}: ${formatUsd(point.amountMinorUnits)}`}
              />
            </div>
            <span className="text-[10px] text-zinc-500">{point.period.slice(5)}</span>
          </div>
        );
      })}
    </div>
  );
}
