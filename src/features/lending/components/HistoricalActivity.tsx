import type { FC } from "react";
import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { historicalByPool } from "../../../data/synthetic/metrics";

type Props = { poolId: string };

export const HistoricalActivity: FC<Props> = ({ poolId }) => {
  const data = historicalByPool[poolId];
  if (!data) return null;

  type RangeKey = "1W" | "1M" | "3M" | "YTD";
  const [range, setRange] = React.useState<RangeKey>("1M");

  const { filteredPoints, startIndex, filteredRateChanges } =
    React.useMemo(() => {
      const total = data.points.length;
      const windowSize = (rk: RangeKey) => {
        switch (rk) {
          case "1W":
            return Math.min(6, total);
          case "1M":
            return Math.min(12, total);
          case "3M":
            return total;
          case "YTD":
            return total;
        }
      };
      const count = windowSize(range);
      const start = Math.max(0, total - count);
      const pts = data.points.slice(start);
      const rc = data.rateChanges.filter((r) => r.t >= start);
      return {
        filteredPoints: pts,
        startIndex: start,
        filteredRateChanges: rc,
      };
    }, [data.points, data.rateChanges, range]);

  return (
    <div className="relative card-surface border border-white/10 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
            Historical Pool Activity
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cyan-100/80">Range</span>
          <div className="rounded-xl bg-white/10 border border-cyan-300/30 overflow-hidden">
            {(["1W", "1M", "3M", "YTD"] as RangeKey[]).map((rk) => (
              <button
                key={rk}
                onClick={() => setRange(rk)}
                className={`px-3 py-1 ${
                  range === rk
                    ? "bg-gradient-to-r from-cyan-400/20 to-blue-600/20 text-white border-l border-cyan-300/30"
                    : "text-cyan-100/80 hover:text-white"
                }`}
              >
                {rk}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

      <div
        className="rounded-2xl p-5 bg-white/5 border"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={filteredPoints.map((point, idx) => ({
              time: `T${startIndex + idx}`,
              supply: point.supply,
              borrow: point.borrow,
            }))}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradSupply" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="gradBorrow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.15)"
            />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.8)",
                border: "1px solid rgba(255,255,255,0.2)",
                borderRadius: "8px",
                color: "white",
              }}
            />
            <Area
              type="monotone"
              dataKey="supply"
              stroke="var(--color-cyan-300)"
              strokeWidth={2}
              fill="url(#gradSupply)"
              name="Supply"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="borrow"
              stroke="var(--color-amber-400)"
              strokeWidth={2}
              fill="url(#gradBorrow)"
              name="Borrow"
              dot={false}
            />

            {/* Rate change vertical markers */}
            {filteredRateChanges.map((r, i) => (
              <ReferenceLine
                key={`rc-${i}`}
                x={`T${r.t}`}
                stroke="var(--color-rose-400)"
                strokeOpacity={0.9}
                strokeWidth={2}
              />
            ))}

            <Legend
              align="left"
              verticalAlign="top"
              iconType="plainline"
              wrapperStyle={{
                color: "rgba(255,255,255,0.85)",
                paddingBottom: 12,
              }}
              payload={[
                { value: "Supply", type: "line", id: "s", color: "#22d3ee" },
                { value: "Borrow", type: "line", id: "b", color: "#fbbf24" },
                {
                  value: "Rate Change",
                  type: "square",
                  id: "r",
                  color: "#f472b6",
                },
              ]}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-[11px] text-cyan-100/70 leading-relaxed">
        Supply & Borrow series aggregate{" "}
        <span className="text-amber-300">AssetSupplied</span> and{" "}
        <span className="text-amber-300">AssetWithdrawn</span> over time.
        Vertical markers denote{" "}
        <span className="text-amber-300">InterestParamsUpdated</span> (rate
        config changes).
      </div>
    </div>
  );
};

export default HistoricalActivity;
