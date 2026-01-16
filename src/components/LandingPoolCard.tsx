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
  const utilization = utilizationPct(pool.state.supply, pool.state.borrow);

  return (
    <div className="card-surface hover:border-white/20 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <img
            src={getIcon(pool.asset)}
            alt={`${pool.asset} logo`}
            className="w-10 h-10 rounded-full"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{pool.asset}</h3>
            <p className="text-sm text-white/50">Margin Pool</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-teal-400">
            {Number(pool.ui.aprSupplyPct).toFixed(2)}%
          </div>
          <p className="text-xs text-white/50">APY</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-white/50 mb-1">Total Deposited</p>
          <p className="text-lg font-semibold text-white">
            ${formatNumber(supply)}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50 mb-1">Utilization</p>
          <p className="text-lg font-semibold text-white">{utilization}%</p>
        </div>
      </div>

      {/* Utilization Bar */}
      <div className="mb-6">
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Number(utilization))}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <Link
        to="/pools"
        className="btn-secondary w-full text-center block hover:bg-white/10"
      >
        View Pool
      </Link>
    </div>
  );
}
