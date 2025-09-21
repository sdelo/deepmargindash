import type { FC } from "react";
import { historicalByPool } from "../../../data/synthetic/metrics";

type Props = { poolId: string };

export const HistoricalActivity: FC<Props> = ({ poolId }) => {
  const data = historicalByPool[poolId];
  if (!data) return null;

  return (
    <div className="relative card-surface card-ring glow-amber glow-cyan text-white">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 drop-shadow">
          Historical Pool Activity
        </h2>
        <span className="text-xs text-cyan-100/80">Mocked series</span>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

      <div
        className="rounded-2xl p-5 bg-white/5 border"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <svg viewBox="0 0 800 300" className="w-full h-[260px]">
          <line
            x1="60"
            y1="260"
            x2="780"
            y2="260"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="40"
            x2="60"
            y2="260"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
          />

          {data.rateChanges.map((r, i) => (
            <g key={i}>
              <line
                x1={60 + r.t * 60}
                y1="40"
                x2={60 + r.t * 60}
                y2="260"
                stroke="rgba(253,164,175,0.6)"
                strokeWidth="2"
              />
              <circle
                cx={60 + r.t * 60}
                cy="60"
                r="4"
                fill="rgba(253,164,175,0.9)"
              />
            </g>
          ))}

          <defs>
            <linearGradient id="gradSupply" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="gradBorrow" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {(() => {
            const points = data.points
              .map((p) => `${60 + p.t * 60},${p.supply}`)
              .join(" ");
            return (
              <polyline
                fill="none"
                stroke="#22d3ee"
                strokeWidth="2.5"
                points={points}
              />
            );
          })()}

          {(() => {
            const points = data.points
              .map((p) => `${60 + p.t * 60},${p.borrow}`)
              .join(" ");
            return (
              <polyline
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2.5"
                points={points}
              />
            );
          })()}
        </svg>
      </div>
    </div>
  );
};

export default HistoricalActivity;
