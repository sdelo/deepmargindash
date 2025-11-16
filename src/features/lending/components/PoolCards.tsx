import type { FC } from "react";
import type { PoolOverview } from "../types";
import { formatNumber, utilizationPct } from "../../../data/synthetic/pools";
import { Tooltip } from "../../../components/Tooltip";

type Props = {
  pools: PoolOverview[];
  onDepositClick?: (poolId: string) => void;
  selectedPoolId?: string;
  onSelectPool?: (poolId: string) => void;
  onAdminAuditClick?: (poolId: string) => void;
};

export const PoolCards: FC<Props> = ({
  pools,
  onDepositClick,
  selectedPoolId,
  onSelectPool,
  onAdminAuditClick,
}) => {
  const ICONS: Record<string, string> = {
    SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
    DBUSDC:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  };
  const getIcon = (asset: string) => ICONS[asset] || "";
  const p = pools.find((x) => x.id === selectedPoolId) ?? pools[0]!;
  const supplyCap = Number(p.protocolConfig.margin_pool_config.supply_cap);
  const supply = Number(p.state.supply);
  const capPct = Math.min(
    100,
    Math.round((supply / Math.max(1, supplyCap)) * 100)
  );

  return (
    <div className="space-y-4 relative">
      <div className="relative card-surface card-ring glow-amber glow-cyan animate-pulse-glow h-full">
        <div className="flex items-center justify-between text-indigo-100/90 mb-4">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
            <span className="inline-flex items-center gap-2 text-sm">
              <img
                src={getIcon(p.asset)}
                alt={`${p.asset} logo`}
                className="w-4 h-4 rounded"
              />
              <span className="text-cyan-200 font-semibold">
                {p.asset} Margin Pool
              </span>
            </span>
          </div>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-400/40 to-transparent my-3"></div>

        <div className="grid grid-cols-2 gap-4 content-start">
          <div
            className="rounded-2xl p-3 bg-white/5 border flex flex-col justify-between min-h-[120px]"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
            }}
          >
            <div className="text-xs text-indigo-200/80 tracking-wide flex items-center gap-1">
              <span>Supply (TVL)</span>
              <Tooltip content="Total assets supplied to the pool.">
                <span className="cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="text-lg md:text-xl lg:text-2xl font-extrabold text-white leading-tight tabular-nums">
              {formatNumber(p.state.supply)}
            </div>
            <div className="text-[11px] text-indigo-200/70 mt-1">
              {formatNumber(supply)} / {formatNumber(supplyCap)} max
            </div>
            <div className="h-1 mt-2 w-full bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400/60"
                style={{ width: `${capPct}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl p-3 bg-white/5 border flex flex-col justify-between min-h-[120px]"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
            }}
          >
            <div className="text-xs text-indigo-200/80 tracking-wide flex items-center gap-1">
              <span>Borrow</span>
              <Tooltip content="Total assets borrowed from the pool.">
                <span className="cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="text-lg md:text-xl lg:text-2xl font-extrabold text-white leading-tight tabular-nums">
              {formatNumber(p.state.borrow)}
            </div>
            <div className="h-1" />
          </div>

          <div
            className="rounded-2xl p-3 bg-white/5 border flex flex-col justify-between min-h-[120px]"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
            }}
          >
            <div className="text-xs text-indigo-200/80 tracking-wide flex items-center gap-1">
              <span>Utilization</span>
              <Tooltip content="Borrow / Supply, indicates pool usage.">
                <span className="cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="text-lg md:text-xl lg:text-2xl font-extrabold text-cyan-300 leading-tight tabular-nums">
              {p.state.supply > 0
                ? ((p.state.borrow / p.state.supply) * 100).toFixed(2)
                : "0.00"}
              %
            </div>
            <div className="h-1" />
          </div>

          <div
            className="rounded-2xl p-3 bg-white/5 border flex flex-col justify-between min-h-[120px]"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
            }}
          >
            <div className="text-xs text-indigo-200/80 tracking-wide flex items-center gap-1">
              <span>Supply APR</span>
              <Tooltip content="Current annualized supply rate.">
                <span className="cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="text-lg md:text-xl lg:text-2xl font-extrabold text-amber-300 leading-tight tabular-nums">
              {Number(p.ui.aprSupplyPct).toFixed(2)}%
            </div>
            <div className="h-1" />
          </div>
        </div>

        <div className="mt-4">
          <div
            className="rounded-2xl p-3 bg-white/5 border"
            style={{
              borderColor:
                "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
            }}
          >
            <div className="text-[11px] text-cyan-100/80 flex items-center gap-1">
              <span>Depositors</span>
              <Tooltip content="Number of unique addresses supplying.">
                <span className="cursor-help">ⓘ</span>
              </Tooltip>
            </div>
            <div className="text-base md:text-lg font-semibold">
              {formatNumber(p.ui.depositors)}
            </div>
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
          <div className="flex items-center gap-4">
            <button
              onClick={() => onAdminAuditClick?.(p.id)}
              className="text-sm text-cyan-200 hover:text-white underline decoration-cyan-400/40"
            >
              Admin audit
            </button>
            <button className="pill" onClick={() => onDepositClick?.(p.id)}>
              Deposit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolCards;
