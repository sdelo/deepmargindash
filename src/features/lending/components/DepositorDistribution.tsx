import type { FC } from "react";
import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import ChartTooltip from "../../shared/components/ChartTooltip";
import { depositorByPool } from "../../../data/synthetic/metrics";

type Props = { poolId: string };

const colorToClass: Record<string, string> = {
  cyan: "bg-cyan-300",
  amber: "bg-amber-300",
  teal: "bg-cyan-400",
  emerald: "bg-emerald-400",
  purple: "bg-indigo-400",
  lavender: "bg-indigo-300",
};

export const DepositorDistribution: FC<Props> = ({ poolId }) => {
  const d = depositorByPool[poolId];
  if (!d) return null;

  const pieData = React.useMemo(
    () =>
      d.topSuppliers.map((s) => ({
        name: s.address,
        value: s.sharePct,
        color: s.color,
      })),
    [d.topSuppliers]
  );

  const colorMap: Record<string, string> = {
    cyan: "var(--color-cyan-300)",
    amber: "var(--color-amber-400)",
    teal: "var(--color-cyan-400)",
    emerald: "var(--color-emerald-400)",
    purple: "var(--color-indigo-400)",
    lavender: "var(--color-indigo-300)",
  };

  function darken(hex: string, amount = 0.35) {
    // hex -> darker hex by multiplying channel
    const m = hex.replace("#", "");
    const num = parseInt(m, 16);
    const r = Math.max(
      0,
      Math.min(255, Math.floor(((num >> 16) & 0xff) * (1 - amount)))
    );
    const g = Math.max(
      0,
      Math.min(255, Math.floor(((num >> 8) & 0xff) * (1 - amount)))
    );
    const b = Math.max(
      0,
      Math.min(255, Math.floor((num & 0xff) * (1 - amount)))
    );
    const toHex = (v: number) => v.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  return (
    <div className="relative card-surface border border-white/10 text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Depositor Distribution
        </h2>
        <span className="text-xs text-cyan-100/80">Synthetic</span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Unique Depositors</div>
          <div className="text-3xl font-extrabold">{d.unique_count}</div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">Top 10 Share</div>
          <div className="text-3xl font-extrabold flex items-baseline gap-1">
            <span>{d.top10_share}</span>
            <span className="text-sm">%</span>
          </div>
          <div className="text-[10px] text-cyan-100/60">
            Sum of top 10 suppliers / total
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border relative overflow-hidden"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-2">
            Concentration Risk
          </div>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-300 via-amber-300 to-rose-300"
              style={{ width: "72%" }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] text-cyan-100/60 mt-1">
            <span>Low</span>
            <span>Med</span>
            <span>High</span>
          </div>
          <div className="text-[11px] text-amber-300 mt-2">
            Gini: <span>{d.gini}</span> · HHI: <span>{d.hhi}</span>
          </div>
          <span className="pointer-events-none absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-amber-300/15 blur-2xl"></span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div
          className="rounded-2xl p-5 bg-white/5 border relative overflow-hidden"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-cyan-100/90">
              Top Suppliers — Share of Pool
            </div>
            <div className="text-[11px] text-cyan-100/70">
              Top N = {d.topSuppliers.length}
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {pieData.map((entry, index) => {
                    const end = colorMap[entry.color];
                    const start = darken(end, 0.45);
                    return (
                      <linearGradient
                        id={`dd-grad-${index}`}
                        key={`dd-grad-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={start} />
                        <stop offset="100%" stopColor={end} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#dd-grad-${index})`}
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={
                    <ChartTooltip
                      labelFormatter={() => null}
                      valueFormatter={(v) => `${Number(v).toFixed(1)}%`}
                    />
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-xl text-cyan-100/90">
                Top {pieData.length} ={" "}
                <span className="text-amber-300 font-semibold">100%</span>
              </div>
            </div>
          </div>
        </div>

        <div
          className="rounded-2xl p-5 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-cyan-100/90">Top Suppliers</div>
            <div className="text-[11px] text-cyan-100/70">masked addresses</div>
          </div>
          <div className="space-y-3">
            {d.topSuppliers.map((s) => (
              <div key={s.address} className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${colorToClass[s.color]}`}
                ></div>
                <div className="text-sm grow">{s.address}</div>
                <div className="text-sm text-amber-300 font-semibold">
                  {s.sharePct.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-[11px] text-cyan-100/70">
            Remainder grouped as "Others".
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositorDistribution;
