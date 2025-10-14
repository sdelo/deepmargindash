import React from "react";
import { Link } from "react-router-dom";
import type { PoolOverview } from "../features/lending/types";
import { formatNumber, utilizationPct } from "../data/synthetic/pools";

interface LandingPoolCardProps {
  pool: PoolOverview;
}

const ICONS: Record<string, string> = {
  SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
  DBUSDC:
    "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
};

export function LandingPoolCard({ pool }: LandingPoolCardProps) {
  const getIcon = (asset: string) => ICONS[asset] || "";
  const supply = Number(pool.state.supply);
  const borrow = Number(pool.state.borrow);
  const utilization = utilizationPct(pool.state.supply, pool.state.borrow);
  const supplyCap = Number(pool.protocolConfig.margin_pool_config.supply_cap);
  const capPct = Math.min(
    100,
    Math.round((supply / Math.max(1, supplyCap)) * 100)
  );

  return (
    <div className="card-surface card-ring glow-amber glow-cyan p-6 hover:scale-105 transition-all duration-300 animate-gentle-float">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={getIcon(pool.asset)}
            alt={`${pool.asset} logo`}
            className="w-8 h-8 rounded"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{pool.asset}</h3>
            <p className="text-sm text-indigo-200/80">Margin Pool</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-amber-300 animate-counter">
            {Number(pool.ui.aprSupplyPct).toFixed(2)}%
          </div>
          <p className="text-xs text-indigo-200/80">APY</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-indigo-200/80 mb-1">Total Value Locked</p>
          <p className="text-lg font-semibold text-cyan-300">
            ${formatNumber(supply)}
          </p>
        </div>
        <div>
          <p className="text-xs text-indigo-200/80 mb-1">Utilization</p>
          <p className="text-lg font-semibold text-white">{utilization}%</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-indigo-200/80 mb-1">
          <span>Pool Capacity</span>
          <span>{capPct}%</span>
        </div>
        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-300 to-indigo-400 transition-all duration-500"
            style={{ width: `${capPct}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex justify-between text-sm text-indigo-200/80 mb-6">
        <span>{formatNumber(pool.ui.depositors)} depositors</span>
        <span>Live Pool</span>
      </div>

      {/* CTA */}
      <Link
        to="/pools"
        className="btn-primary w-full text-center py-3 font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
      >
        Deposit {pool.asset}
      </Link>
    </div>
  );
}
