import type { FC } from "react";
import React from "react";
import { feesByPool } from "../../../data/synthetic/metrics";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import ChartTooltip from "../../shared/components/ChartTooltip";

type Props = { poolId: string };

export const ProtocolFees: FC<Props> = ({ poolId }) => {
  const f = feesByPool[poolId];
  if (!f) return null;

  // Build a single aligned time series
  const maxT = Math.max(
    ...f.dailyFees.map((d) => d.t),
    ...f.liquidations.map((l) => l.t)
  );
  const series = Array.from({ length: maxT + 1 }, (_, t) => {
    const daily = f.dailyFees.find((d) => d.t === t)?.amount ?? 0;
    const liq = f.liquidations.find((l) => l.t === t);
    return {
      t,
      label: `T${t}`,
      protocol_fees: daily,
      liq_reward: liq?.pool_reward ?? 0,
      liq_default: liq?.pool_default ?? 0,
    };
  });
  // cumulative line = protocol fees + liquidations + defaults
  let running = 0;
  const chartData = series.map((pt) => {
    running += pt.protocol_fees + pt.liq_reward + pt.liq_default;
    return { ...pt, cumulative: running };
  });
  return (
    <div className="relative card-surface border border-white/10 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Protocol Fees & Liquidations
        </h2>
        <span className="text-xs text-cyan-100/80">Synthetic</span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Cumulative Fees</div>
          <div className="text-3xl font-extrabold">
            <span>{f.total.toLocaleString()}</span>{" "}
            <span className="text-sm text-cyan-100/70">units</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">
            since pool inception
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">24h Fees</div>
          <div className="text-2xl font-bold">
            <span>{f.last_24h.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">rolling 24h</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">7d Fees</div>
          <div className="text-2xl font-bold">
            <span>{f.last_7d.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">rolling 7d</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border relative overflow-hidden"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Liquidations (cumulative)
          </div>
          <div className="text-2xl font-bold flex items-baseline gap-1">
            <span>
              {(f.liq_pool_reward + f.liq_pool_default).toLocaleString()}
            </span>
            <span className="text-sm">events</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">
            linked to MarginPools
          </div>
          <span className="pointer-events-none absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-amber-300/15 blur-xl"></span>
        </div>
      </div>

      <div
        className="rounded-2xl p-5 bg-white/5 border relative overflow-hidden"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-cyan-100/90">
            Fees & Liquidations Over Time
          </div>
          <div className="text-[11px] text-cyan-100/70">
            Stack: Protocol Fees + Liquidations + Defaults · Line: Cumulative
            Fees
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.15)"
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={
                <ChartTooltip
                  labelFormatter={(l) => (
                    <span className="text-cyan-100/90">{l}</span>
                  )}
                  valueFormatter={(v, n) =>
                    n === "cumulative"
                      ? `${Number(v).toLocaleString()}`
                      : `${Number(v).toLocaleString()}`
                  }
                />
              }
            />
            {/* Stacked bars order: 1) protocol fees 2) liquidation reward 3) defaults */}
            <Bar
              dataKey="protocol_fees"
              stackId="a"
              fill="var(--color-amber-400)"
              opacity={0.7}
              name="Protocol Fees"
              yAxisId="left"
            />
            <Bar
              dataKey="liq_reward"
              stackId="a"
              fill="var(--color-amber-300)"
              name="Liquidations"
              yAxisId="left"
            />
            <Bar
              dataKey="liq_default"
              stackId="a"
              fill="var(--color-rose-400)"
              name="Defaults"
              yAxisId="left"
            />
            <Line
              type="monotone"
              dataKey="cumulative"
              stroke="var(--color-cyan-300)"
              strokeWidth={2.5}
              dot={false}
              name="Cumulative"
              yAxisId="right"
            />
            <Legend wrapperStyle={{ color: "rgba(255,255,255,0.85)" }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-5 mt-6">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Spread Fees</div>
          <div className="text-xl font-bold text-amber-300">
            <span>{f.spread.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">
            from protocol_spread
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Liquidation Fees (Pool Reward)
          </div>
          <div className="text-xl font-bold text-amber-300">
            <span>{f.liq_pool_reward.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">sum of pool_reward</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            Defaults (Pool Loss)
          </div>
          <div className="text-xl font-bold text-rose-300">
            <span>{f.liq_pool_default.toLocaleString()}</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">
            cumulative pool_default
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtocolFees;
