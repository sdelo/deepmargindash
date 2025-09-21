import type { FC } from "react";
import type { PoolOverview } from "../types";
import { formatNumber, utilizationPct } from "../../../data/synthetic/pools";

type Props = {
  pools: PoolOverview[];
  onDepositClick?: (poolId: string) => void;
};

export const PoolCards: FC<Props> = ({ pools, onDepositClick }) => {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {pools.map((p) => (
        <div
          key={p.id}
          className="relative card-surface card-ring glow-amber glow-cyan"
        >
          <div className="flex items-center justify-between text-indigo-100/90">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
              <a
                href="#"
                className="text-cyan-200 underline decoration-cyan-400/40 text-sm"
              >
                {p.id}
              </a>
            </div>
            <div className="text-xs text-cyan-100/80">
              Asset: <span className="text-amber-300">{p.asset}</span>
            </div>
          </div>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent my-4"></div>

          <div className="grid grid-cols-4 gap-4">
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-xs text-indigo-200/80 tracking-wide">
                Supply (TVL)
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-white whitespace-nowrap leading-tight tabular-nums">
                {formatNumber(p.state.fields.supply)}
              </div>
            </div>
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-xs text-indigo-200/80 tracking-wide">
                Borrow
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-white whitespace-nowrap leading-tight tabular-nums">
                {formatNumber(p.state.fields.borrow)}
              </div>
            </div>
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-xs text-indigo-200/80 tracking-wide">
                Utilization
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-cyan-300 whitespace-nowrap leading-tight tabular-nums">
                {utilizationPct(p.state.fields.supply, p.state.fields.borrow)}%
              </div>
            </div>
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-xs text-indigo-200/80 tracking-wide">
                Supply APR
              </div>
              <div className="text-xl md:text-2xl font-extrabold text-amber-300 whitespace-nowrap leading-tight tabular-nums">
                {p.ui.aprSupplyPct}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-[11px] text-cyan-100/80">Depositors</div>
              <div className="text-lg font-semibold">
                {formatNumber(p.ui.depositors)}
              </div>
            </div>
            <div
              className="rounded-2xl p-3 bg-white/5 border"
              style={{
                borderColor:
                  "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
              }}
            >
              <div className="text-[11px] text-cyan-100/80 mb-1">Pool Age</div>
              <div className="text-lg font-semibold">{p.ui.ageDays} days</div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between">
            <div className="text-[12px] text-cyan-100/80">
              Linked DeepBook pool:{" "}
              <a
                href="#"
                className="text-cyan-200 underline decoration-cyan-400/40"
              >
                {p.ui.deepbookPoolId}
              </a>
            </div>
            <div className="flex gap-2">
              <button className="pill">View Pool</button>
              <button className="pill" onClick={() => onDepositClick?.(p.id)}>
                Deposit
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PoolCards;
