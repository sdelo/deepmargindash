import type { FC } from "react";
import { feesByPool } from "../../../data/synthetic/metrics";

type Props = { poolId: string };

export const ProtocolFees: FC<Props> = ({ poolId }) => {
  const f = feesByPool[poolId];
  if (!f) return null;
  return (
    <div className="relative card-surface card-ring glow-amber glow-cyan text-white">
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
            Bars = Fees · Stacked Bars = Liquidations · Line = Cumulative Fees
          </div>
        </div>
        <svg viewBox="0 0 840 340" className="w-full h-[300px]">
          <line
            x1="60"
            y1="300"
            x2="800"
            y2="300"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="40"
            x2="60"
            y2="300"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          {f.dailyFees.map((d, idx) => (
            <rect
              key={idx}
              x={80 + idx * 30}
              y={300 - d.amount * 2}
              width="18"
              height={d.amount * 2}
              fill="#fbbf24"
              fillOpacity="0.55"
            />
          ))}
          {f.liquidations.map((l, idx) => (
            <g key={idx}>
              <rect
                x={200 + l.t * 60}
                y={260}
                width="18"
                height={l.pool_reward}
                fill="#fbbf24"
              />
              <rect
                x={200 + l.t * 60}
                y={260 - l.pool_default}
                width="18"
                height={l.pool_default}
                fill="#fb7185"
              />
            </g>
          ))}
        </svg>
        <div className="flex items-center gap-6 mt-3 text-[12px] text-cyan-100/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-300 inline-block rounded-sm"></span>{" "}
            Pool Reward
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-rose-400 inline-block rounded-sm"></span>{" "}
            Pool Default
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-300/60 inline-block"></span> Daily
            Fees
          </div>
        </div>
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
