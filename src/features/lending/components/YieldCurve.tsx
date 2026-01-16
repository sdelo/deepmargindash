import type { FC } from "react";
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
} from "recharts";
import { ClockIcon } from "@heroicons/react/24/outline";
import type { PoolOverview } from "../types";
import { calculatePoolRates } from "../../../utils/interestRates";

type Props = { 
  pool: PoolOverview;
  onShowHistory?: () => void;
};

export const YieldCurve: FC<Props> = ({ pool, onShowHistory }) => {
  // Basic error handling for malformed data
  const componentId = Math.random().toString(36).substr(2, 9);
  console.log(`[${componentId}] YieldCurve rendering with pool:`, pool);
  if (
    !pool?.protocolConfig?.interest_config ||
    !pool?.protocolConfig?.margin_pool_config ||
    !pool?.state
  ) {
    return (
      <div className="relative card-surface border border-white/10 text-white">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
            Yield & Interest
          </h2>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent my-4"></div>
        <div className="text-center py-8 text-red-400">
          Error: Invalid pool data structure
        </div>
      </div>
    );
  }

  const ic = pool.protocolConfig.interest_config;
  const mc = pool.protocolConfig.margin_pool_config;

  // Use the shared calculation utility for consistent rates
  const { utilizationPct: utilPct, borrowApr, supplyApr } = calculatePoolRates(pool);
  const u = utilPct / 100; // 0..1 for chart calculations

  // Config values are in decimal format (0.15 = 15%), convert to percentages for display
  const baseRatePct = ic.base_rate * 100;
  const baseSlopePct = ic.base_slope * 100;
  const optimalU = ic.optimal_utilization; // Keep as decimal for chart calculations
  const optimalUPct = ic.optimal_utilization * 100;
  const excessSlopePct = ic.excess_slope * 100;
  // Note: spreadPct = mc.protocol_spread * 100 is used in supply APR calculation in interestRates.ts

  // Debug logging
  console.log(`[${componentId}] YieldCurve rates:`, {
    utilPct: utilPct.toFixed(2) + "%",
    supplyApr: supplyApr.toFixed(2) + "%",
    borrowApr: borrowApr.toFixed(2) + "%",
    baseRate: baseRatePct.toFixed(1) + "%",
    baseSlope: baseSlopePct.toFixed(1) + "%",
    optimalUtilization: optimalUPct.toFixed(0) + "%",
    excessSlope: excessSlopePct.toFixed(1) + "%",
  });

  // Build data points to draw the piecewise linear curve in Recharts
  // APR values should be in percentage form for the chart
  const steps = 16;
  const curveData = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps; // utilization as decimal (0-1)
    // Calculate borrow APR using the same formula as interestRates.ts
    // baseRatePct, baseSlopePct, excessSlopePct are already in percentage form
    const apr =
      t <= optimalU
        ? baseRatePct + baseSlopePct * t
        : baseRatePct + baseSlopePct * optimalU + excessSlopePct * (t - optimalU);
    return { u: Math.round(t * 100), apr };
  });

  return (
    <div className="relative card-surface border border-white/10 text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Yield & Interest
        </h2>
        <div className="flex items-center space-x-4">
          {onShowHistory && (
            <button
              onClick={onShowHistory}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/30 hover:bg-amber-500/30 hover:border-amber-400/50 transition-all text-xs font-medium text-amber-300"
            >
              <ClockIcon className="w-4 h-4" />
              <span>Rate History</span>
            </button>
          )}
          <div className="text-xs text-cyan-100/80">
            From <span className="text-amber-300">InterestConfig</span> &{" "}
            <span className="text-amber-300">State</span>
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent my-4"></div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-sm text-cyan-100/80">Supply APR</div>
          <div className="text-3xl font-extrabold">
            {supplyApr < 0.1 ? supplyApr.toFixed(2) : supplyApr.toFixed(1)}
            <span className="text-xl">%</span>
          </div>
          <div className="text-[11px] text-cyan-100/60">
            what suppliers earn
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-sm text-cyan-100/80">Borrow APR</div>
          <div className="text-3xl font-extrabold">
            {borrowApr < 0.1 ? borrowApr.toFixed(2) : borrowApr.toFixed(1)}
            <span className="text-xl">%</span>
          </div>
          <div className="text-[11px] text-cyan-100/60">what borrowers pay</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-sm text-cyan-100/80">Utilization</div>
          <div className="text-3xl font-extrabold">
            {utilPct.toFixed(1)}
            <span className="text-xl">%</span>
          </div>
          <div className="text-[11px] text-cyan-100/60">borrow / supply</div>
        </div>
      </div>

      {/* Curve */}
      <div
        className="rounded-2xl p-5 bg-white/5 border relative overflow-hidden"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="text-cyan-100/80 mb-3">Utilization Curve</div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart
            data={curveData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.15)"
            />
            <XAxis
              dataKey="u"
              type="number"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `${Math.round(v)}%`}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${(value as number).toFixed(2)}%`, "APR"]}
              labelFormatter={(label) => `Utilization ${label}%`}
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "white",
              }}
            />
            <ReferenceLine
              x={Math.round(optimalU * 100)}
              stroke="var(--color-amber-300)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="apr"
              stroke="var(--color-cyan-300)"
              strokeWidth={2.5}
              dot={false}
            />
            <ReferenceLine
              x={Math.round(u * 100)}
              stroke="var(--color-cyan-200)"
              strokeDasharray="4 4"
            />
            <ReferenceDot
              x={Math.round(u * 100)}
              y={borrowApr}
              r={4}
              fill="var(--color-cyan-300)"
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="text-[11px] text-cyan-100/60 mt-2">
          Base Rate, Base Slope →{" "}
          <span className="text-amber-300">Optimal Utilization</span> →
          Excess Slope
        </div>
      </div>

      {/* Params */}
      <div className="grid grid-cols-4 gap-3 mt-4">
        <div
          className="rounded-xl p-3 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Base Rate</div>
          <div className="text-lg font-bold text-amber-300">
            {baseRatePct.toFixed(1)}%
          </div>
        </div>
        <div
          className="rounded-xl p-3 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Base Slope</div>
          <div className="text-lg font-bold text-amber-300">
            {baseSlopePct.toFixed(1)}%
          </div>
        </div>
        <div
          className="rounded-xl p-3 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Optimal Util.
          </div>
          <div className="text-lg font-bold text-amber-300">
            {optimalUPct.toFixed(0)}%
          </div>
        </div>
        <div
          className="rounded-xl p-3 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Excess Slope</div>
          <div className="text-lg font-bold text-amber-300">
            {excessSlopePct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Formula - Hidden behind info icon */}
      <div className="mt-4 flex items-center gap-2 text-[11px] text-cyan-100/40">
        <span>Interest calculation formula</span>
        <div className="relative group">
          <button
            type="button"
            className="w-4 h-4 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[10px] text-white/50 hover:text-white/70 transition-all cursor-help"
            aria-label="View formula"
          >
            ?
          </button>
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-[11px] text-white/90 bg-slate-900 border border-white/20 rounded-lg shadow-xl w-72 leading-relaxed opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
            <div className="font-semibold text-amber-300 mb-1">Borrow APR Formula:</div>
            <div className="font-mono text-[10px] mb-2">
              APR(u) = base_rate + base_slope × u
              <span className="text-white/50"> (when u ≤ optimal)</span>
            </div>
            <div className="font-mono text-[10px] mb-2">
              APR(u) = base_rate + base_slope × optimal + excess_slope × (u − optimal)
              <span className="text-white/50"> (when u &gt; optimal)</span>
            </div>
            <div className="font-semibold text-amber-300 mt-2 mb-1">Supply APR:</div>
            <div className="font-mono text-[10px]">
              = Borrow APR × utilization × (1 − spread)
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldCurve;
