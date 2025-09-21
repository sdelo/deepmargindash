import type { FC } from "react";
import type { PoolOverview } from "../types";
import { utilizationPct } from "../../../data/synthetic/pools";

type Props = { pool: PoolOverview };

function toPercent(value: bigint) {
  return Number(value) / 100; // 100 = basis points with 2 decimals
}

export const YieldCurve: FC<Props> = ({ pool }) => {
  const ic = pool.protocolConfig.fields.interest_config.fields;
  const mc = pool.protocolConfig.fields.margin_pool_config.fields;

  const utilPct = utilizationPct(
    pool.state.fields.supply,
    pool.state.fields.borrow
  ); // 0..100
  const u = utilPct / 100; // 0..1

  const baseRate = toPercent(ic.base_rate); // %
  const baseSlope = toPercent(ic.base_slope); // % per utilization
  const optimalPct = toPercent(ic.optimal_utilization); // % (e.g., 70)
  const optimalU = optimalPct / 100; // 0..1
  const excessSlope = toPercent(ic.excess_slope); // % per utilization over optimal
  const spreadPct = toPercent(mc.protocol_spread); // %

  const borrowApr =
    u <= optimalU
      ? baseRate + baseSlope * u
      : baseRate + baseSlope * optimalU + excessSlope * (u - optimalU);
  const supplyApr = borrowApr * u * (1 - spreadPct / 100);

  // Simple SVG curve (piecewise linear) from 0..1 utilization mapped to width
  const width = 760;
  const height = 260;
  const left = 60;
  const right = width - 20;
  const bottom = height - 20;
  const top = 20;

  function xAt(t: number) {
    return left + (right - left) * t;
  }
  function yAt(apr: number) {
    // scale APR to y; assume max ~ 40%
    const max = Math.max(20, borrowApr * 1.6);
    const norm = Math.min(apr, max) / max; // 0..1
    return bottom - (bottom - top) * norm;
  }

  const points: string[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const apr =
      t <= optimalU
        ? baseRate + baseSlope * t
        : baseRate + baseSlope * optimalU + excessSlope * (t - optimalU);
    points.push(`${xAt(t)},${yAt(apr)}`);
  }

  return (
    <div className="relative card-surface card-ring glow-amber glow-cyan text-white">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Yield & Interest
        </h2>
        <div className="text-xs text-cyan-100/80">
          From <span className="text-amber-300">InterestConfig</span> &{" "}
          <span className="text-amber-300">State</span>
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
            {supplyApr.toFixed(1)}
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
            {borrowApr.toFixed(1)}
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
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[260px]">
          {/* Axes */}
          <line
            x1={left}
            y1={bottom}
            x2={right}
            y2={bottom}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          <line
            x1={left}
            y1={top}
            x2={left}
            y2={bottom}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          {/* Optimal vertical */}
          <line
            x1={xAt(optimalU)}
            y1={top}
            x2={xAt(optimalU)}
            y2={bottom}
            stroke="#fde68a"
            strokeOpacity={0.8}
            strokeWidth="2"
          />
          {/* Curve */}
          <polyline
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            points={points.join(" ")}
          />
          {/* Current point */}
          <circle cx={xAt(u)} cy={yAt(borrowApr)} r="5" fill="#67e8f9" />
        </svg>
        <div className="text-[11px] text-cyan-100/60 mt-2">
          base_rate, base_slope →{" "}
          <span className="text-amber-300">optimal_utilization</span> →
          excess_slope
        </div>
      </div>

      {/* Params */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">base_rate</div>
          <div className="text-lg font-bold text-amber-300">
            {baseRate.toFixed(1)}%
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">base_slope</div>
          <div className="text-lg font-bold text-amber-300">
            {baseSlope.toFixed(1)}%
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">
            optimal_utilization
          </div>
          <div className="text-lg font-bold text-amber-300">
            {optimalPct.toFixed(0)}%
          </div>
        </div>
        <div
          className="rounded-2xl p-4 bg-white/5 border"
          style={{
            borderColor:
              "color-mix(in oklab, var(--color-amber-400) 20%, transparent)",
          }}
        >
          <div className="text-xs text-cyan-100/80 mb-1">excess_slope</div>
          <div className="text-lg font-bold text-amber-300">
            {excessSlope.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="text-[11px] text-cyan-100/60 mt-4 leading-relaxed">
        Borrow APR(u) = base_rate + base_slope·u for u ≤ optimal; then base_rate
        + base_slope·optimal + excess_slope·(u − optimal). Supply APR ≈ Borrow
        APR · utilization · (1 − protocol_spread).
      </div>
    </div>
  );
};

export default YieldCurve;
