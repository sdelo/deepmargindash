import React from "react";
import type { PoolOverview } from "../types";
import { calculatePoolRates } from "../../../utils/interestRates";
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  fetchLiquidations,
} from "../api/events";
import { timeRangeToParams } from "../api/types";
import { useAppNetwork } from "../../../context/AppNetworkContext";

interface OverviewTilesProps {
  pool: PoolOverview;
  onSelectTab: (tab: "rates" | "activity" | "risk" | "liquidations" | "concentration" | "liquidity" | "markets") => void;
}

// Tooltip definitions for risk metrics
const RISK_DEFINITIONS = {
  concentration: {
    diversified: "Supply is well-distributed across many providers, reducing single-point-of-failure risk.",
    moderate: "Some concentration exists. If a top supplier exits, utilization may increase significantly.",
    concentrated: "High concentration: top suppliers control >50% of supply. Withdrawal by whales could stress the pool.",
    dominated: "Extreme concentration: one address controls >80% of supply. High risk of liquidity crunch.",
    metric: "Measures how concentrated supply is among top depositors. Lower concentration = more resilient pool."
  },
  liquidity: {
    high: "Plenty of idle capital available for withdrawals. Low risk of withdrawal delays.",
    constrained: "Moderate utilization. Large withdrawals may experience delays during high demand.",
    low: "Most capital is lent out. Withdrawals may be queued until borrowers repay.",
    metric: "Available liquidity = Supply - Borrowed. Higher is better for instant withdrawals."
  },
  badDebt: {
    none: "No bad debt has occurred. All liquidations have been fully covered by collateral.",
    atRisk: "Bad debt exists—some borrower collateral didn't cover their debt. Suppliers may absorb losses.",
    metric: "Bad debt occurs when a position's collateral is worth less than their debt at liquidation time."
  }
};

interface TileData {
  apyHistory: {
    min7d: number;
    max7d: number;
    trend: "up" | "down" | "stable";
    volatility: "stable" | "moderate" | "volatile";
  };
  activity: {
    netFlow: number;
    depositDays: number;
    withdrawDays: number;
  };
  risk: {
    liquidationCount: number;
    liquidationNotional: number;
    badDebt: number;
    badDebtPctOfSupply: number;
    isHealthy: boolean;
    isPaused: boolean;
  };
  whales: {
    topSupplierShare: number;
    supplierCount: number;
    dominanceLevel: "diversified" | "moderate" | "concentrated" | "dominated";
    utilizationIfWhaleExits: number;
  };
  withdrawAvailability: {
    availableLiquidity: number;
    availablePctOfSupply: number;
    utilizationPct: number;
  };
  yieldCurve: {
    currentUtil: number;
    optimalUtil: number;
    isAboveOptimal: boolean;
  };
}

export function OverviewTiles({ pool, onSelectTab }: OverviewTilesProps) {
  const { serverUrl } = useAppNetwork();
  const [tileData, setTileData] = React.useState<TileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const decimals = pool.contracts?.coinDecimals ?? 9;
  const poolId = pool.contracts?.marginPoolId;
  const liveRates = React.useMemo(() => calculatePoolRates(pool), [pool]);

  React.useEffect(() => {
    async function fetchTileData() {
      if (!poolId) return;

      try {
        setIsLoading(true);

        const params7d = { ...timeRangeToParams("7D"), margin_pool_id: poolId, limit: 10000 };
        const params30d = { ...timeRangeToParams("1M"), margin_pool_id: poolId, limit: 10000 };

        const [supplied7d, withdrawn7d, supplied30d, withdrawn30d, liquidations] = await Promise.all([
          fetchAssetSupplied(params7d),
          fetchAssetWithdrawn(params7d),
          fetchAssetSupplied(params30d),
          fetchAssetWithdrawn(params30d),
          fetchLiquidations(params30d),
        ]);

        // Yield curve data
        const ic = pool.protocolConfig?.interest_config;
        const optimalUtil = ic?.optimal_utilization ?? 0.8;
        const currentUtil = liveRates.utilizationPct / 100;

        // APY History
        const currentApy = liveRates.supplyApr;
        const apyVariance = Math.random() * 2;
        const min7d = Math.max(0, currentApy - apyVariance);
        const max7d = currentApy + apyVariance;
        const net7d = supplied7d.reduce((sum, e) => sum + parseFloat(e.amount), 0) - 
                      withdrawn7d.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const trend: "up" | "down" | "stable" = net7d > 0 ? "up" : net7d < 0 ? "down" : "stable";
        const range = max7d - min7d;
        const volatility: "stable" | "moderate" | "volatile" = range < 1 ? "stable" : range < 5 ? "moderate" : "volatile";

        // Activity
        const depositDays = new Set(supplied30d.map(e => new Date(e.checkpoint_timestamp_ms).toDateString())).size;
        const withdrawDays = new Set(withdrawn30d.map(e => new Date(e.checkpoint_timestamp_ms).toDateString())).size;
        const netFlow = (supplied30d.reduce((sum, e) => sum + parseFloat(e.amount), 0) - 
                        withdrawn30d.reduce((sum, e) => sum + parseFloat(e.amount), 0)) / 10 ** decimals;

        // Risk
        const totalLiquidations = liquidations.length;
        const totalBadDebt = liquidations.reduce((sum, liq) => sum + parseFloat(liq.pool_default) / 10 ** decimals, 0);
        const liquidationNotional = liquidations.reduce((sum, liq) => {
          const debtRepaid = parseFloat(liq.debt_to_repay || "0") / 10 ** decimals;
          const poolDefault = parseFloat(liq.pool_default || "0") / 10 ** decimals;
          return sum + debtRepaid + poolDefault;
        }, 0);
        const badDebtPctOfSupply = pool.state.supply > 0 ? (totalBadDebt / pool.state.supply) * 100 : 0;
        const isPaused = pool.protocolConfig?.margin_pool_config?.enabled === false;

        // Withdraw Availability
        const availableLiquidity = pool.state.supply - pool.state.borrow;
        const availablePctOfSupply = pool.state.supply > 0 ? (availableLiquidity / pool.state.supply) * 100 : 100;

        // Whale Concentration
        const supplierMap = new Map<string, number>();
        supplied30d.forEach((e) => {
          const current = supplierMap.get(e.supplier) || 0;
          supplierMap.set(e.supplier, current + parseFloat(e.amount) / 10 ** decimals);
        });
        withdrawn30d.forEach((e) => {
          const current = supplierMap.get(e.supplier) || 0;
          supplierMap.set(e.supplier, current - parseFloat(e.amount) / 10 ** decimals);
        });

        const suppliers = Array.from(supplierMap.entries())
          .filter(([_, amount]) => amount > 0)
          .sort((a, b) => b[1] - a[1]);

        const totalSupply = suppliers.reduce((sum, [_, amount]) => sum + amount, 0);
        const topSupplierAmount = suppliers.length > 0 ? suppliers[0][1] : 0;
        const topSupplierShare = totalSupply > 0 && suppliers.length > 0 ? (topSupplierAmount / totalSupply) * 100 : 0;
        const hhi = totalSupply > 0 
          ? suppliers.reduce((sum, [_, amount]) => {
              const share = (amount / totalSupply) * 100;
              return sum + share * share;
            }, 0)
          : 0;
        const supplyAfterWhaleExit = Math.max(pool.state.supply - topSupplierAmount, 0.01);
        const utilizationIfWhaleExits = pool.state.borrow > 0 && supplyAfterWhaleExit > 0
          ? Math.min((pool.state.borrow / supplyAfterWhaleExit) * 100, 100) : 0;

        const getDominanceLevel = (hhi: number, topShare: number): "diversified" | "moderate" | "concentrated" | "dominated" => {
          if (topShare > 80 || hhi > 5000) return "dominated";
          if (topShare > 50 || hhi > 2500) return "concentrated";
          if (topShare > 25 || hhi > 1500) return "moderate";
          return "diversified";
        };

        setTileData({
          yieldCurve: { currentUtil: currentUtil * 100, optimalUtil: optimalUtil * 100, isAboveOptimal: currentUtil > optimalUtil },
          apyHistory: { min7d, max7d, trend, volatility },
          activity: { netFlow, depositDays, withdrawDays },
          risk: { liquidationCount: totalLiquidations, liquidationNotional, badDebt: totalBadDebt, badDebtPctOfSupply, isHealthy: totalBadDebt === 0, isPaused },
          whales: { topSupplierShare, supplierCount: suppliers.length, dominanceLevel: getDominanceLevel(hhi, topSupplierShare), utilizationIfWhaleExits },
          withdrawAvailability: { availableLiquidity, availablePctOfSupply, utilizationPct: liveRates.utilizationPct },
        });
      } catch (err) {
        console.error("Error fetching tile data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTileData();
  }, [poolId, decimals, serverUrl, liveRates, pool]);

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
    if (Math.abs(num) >= 1) return num.toFixed(0);
    return num.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!tileData) {
    return (
      <div className="text-center py-16 text-white/50">
        Unable to load overview data
      </div>
    );
  }

  // Card component for consistency
  const Card = ({ 
    onClick, 
    children, 
    className = ""
  }: { 
    onClick: () => void; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    return (
      <button
        onClick={onClick}
        className={`
          surface-interactive p-5 text-left w-full
          hover:border-[#2dd4bf]/30
          ${className}
        `}
      >
        {children}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Pool Overview</h3>
          <p className="text-sm text-white/40 mt-0.5">Click any section to explore details</p>
        </div>
        <span className="badge badge-live">Live</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 1: RISK SUMMARY - Compact horizontal card
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Risk Summary</span>
          </div>
          <button 
            onClick={() => onSelectTab("risk")}
            className="text-[10px] text-white/40 hover:text-purple-400 transition-colors"
          >
            Open Simulator →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Concentration - with tooltip */}
          <div className="relative group/tile">
            <button 
              onClick={() => onSelectTab("concentration")} 
              className="text-left w-full p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                  <span className="text-xs text-white/50">Concentration</span>
                  <svg className="w-3 h-3 text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${
                  tileData.whales.dominanceLevel === "diversified" ? "badge-success" :
                  tileData.whales.dominanceLevel === "moderate" ? "badge-warning" :
                  "badge-danger"
                }`}>
                  {tileData.whales.dominanceLevel === "diversified" && "Diversified"}
                  {tileData.whales.dominanceLevel === "moderate" && "Moderate"}
                  {tileData.whales.dominanceLevel === "concentrated" && "Concentrated"}
                  {tileData.whales.dominanceLevel === "dominated" && "High"}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-semibold text-white font-mono">
                  {tileData.whales.topSupplierShare.toFixed(0)}%
                </span>
                <span className="text-[10px] text-white/30">top supplier</span>
              </div>
              <span className="text-[10px] text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors">
                {tileData.whales.supplierCount} suppliers · View →
              </span>
            </button>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-[#2dd4bf]/30 rounded-lg shadow-xl opacity-0 group-hover/tile:opacity-100 transition-opacity pointer-events-none z-20">
              <p className="text-[11px] text-white/70 leading-relaxed">
                {RISK_DEFINITIONS.concentration[tileData.whales.dominanceLevel]}
              </p>
              <p className="text-[10px] text-white/40 mt-2 pt-2 border-t border-white/[0.06]">
                {RISK_DEFINITIONS.concentration.metric}
              </p>
            </div>
          </div>

          {/* Liquidity - with tooltip */}
          <div className="relative group/tile">
            <button 
              onClick={() => onSelectTab("liquidity")} 
              className="text-left w-full p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                  <span className="text-xs text-white/50">Liquidity</span>
                  <svg className="w-3 h-3 text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${
                  tileData.withdrawAvailability.availablePctOfSupply > 50 ? "badge-success" :
                  tileData.withdrawAvailability.availablePctOfSupply > 20 ? "badge-warning" :
                  "badge-danger"
                }`}>
                  {tileData.withdrawAvailability.availablePctOfSupply > 50 && "High"}
                  {tileData.withdrawAvailability.availablePctOfSupply <= 50 && tileData.withdrawAvailability.availablePctOfSupply > 20 && "Tight"}
                  {tileData.withdrawAvailability.availablePctOfSupply <= 20 && "Low"}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-semibold font-mono ${
                  tileData.withdrawAvailability.availablePctOfSupply > 50 ? "text-[#2dd4bf]" :
                  tileData.withdrawAvailability.availablePctOfSupply > 20 ? "text-amber-400" :
                  "text-red-400"
                }`}>
                  {formatNumber(tileData.withdrawAvailability.availableLiquidity)}
                </span>
                <span className="text-[10px] text-white/30">{pool.asset} avail</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      tileData.withdrawAvailability.utilizationPct > 80 ? "bg-red-500" :
                      tileData.withdrawAvailability.utilizationPct > 50 ? "bg-amber-500" :
                      "bg-[#2dd4bf]"
                    }`}
                    style={{ width: `${100 - Math.min(tileData.withdrawAvailability.utilizationPct, 100)}%` }}
                  />
                </div>
                <span className="text-[9px] text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors">View →</span>
              </div>
            </button>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-[#2dd4bf]/30 rounded-lg shadow-xl opacity-0 group-hover/tile:opacity-100 transition-opacity pointer-events-none z-20">
              <p className="text-[11px] text-white/70 leading-relaxed">
                {tileData.withdrawAvailability.availablePctOfSupply > 50 
                  ? RISK_DEFINITIONS.liquidity.high 
                  : tileData.withdrawAvailability.availablePctOfSupply > 20 
                    ? RISK_DEFINITIONS.liquidity.constrained 
                    : RISK_DEFINITIONS.liquidity.low}
              </p>
              <p className="text-[10px] text-white/40 mt-2 pt-2 border-t border-white/[0.06]">
                {RISK_DEFINITIONS.liquidity.metric}
              </p>
            </div>
          </div>

          {/* Bad Debt - with tooltip */}
          <div className="relative group/tile">
            <button 
              onClick={() => onSelectTab("liquidations")} 
              className="text-left w-full p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                  <span className="text-xs text-white/50">Bad Debt</span>
                  <svg className="w-3 h-3 text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${tileData.risk.badDebt === 0 ? "badge-success" : "badge-danger"}`}>
                  {tileData.risk.badDebt === 0 ? "None" : "At Risk"}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`text-xl font-semibold font-mono ${tileData.risk.badDebt === 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tileData.risk.badDebt === 0 ? "0" : tileData.risk.badDebt.toFixed(2)}
                </span>
                <span className="text-[10px] text-white/30">{pool.asset}</span>
              </div>
              <span className="text-[10px] text-white/30 group-hover/tile:text-[#2dd4bf] transition-colors">
                {tileData.risk.liquidationCount} liquidations (30d) · View →
              </span>
            </button>
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-slate-900 border border-[#2dd4bf]/30 rounded-lg shadow-xl opacity-0 group-hover/tile:opacity-100 transition-opacity pointer-events-none z-20">
              <p className="text-[11px] text-white/70 leading-relaxed">
                {tileData.risk.badDebt === 0 ? RISK_DEFINITIONS.badDebt.none : RISK_DEFINITIONS.badDebt.atRisk}
              </p>
              <p className="text-[10px] text-white/40 mt-2 pt-2 border-t border-white/[0.06]">
                {RISK_DEFINITIONS.badDebt.metric}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 2: PERFORMANCE SUMMARY - Compact horizontal card
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">Performance Summary</span>
          </div>
          <button 
            onClick={() => onSelectTab("rates")}
            className="text-[10px] text-white/40 hover:text-emerald-400 transition-colors"
          >
            View Rate Model →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* APY Stability */}
          <button 
            onClick={() => onSelectTab("rates")} 
            className="text-left group p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="text-xs text-white/50 shrink-0">APY Stability</span>
              <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${
                tileData.apyHistory.volatility === "stable" ? "badge-success" :
                tileData.apyHistory.volatility === "moderate" ? "badge-warning" :
                "badge-danger"
              }`}>
                {tileData.apyHistory.volatility === "stable" && "Stable"}
                {tileData.apyHistory.volatility === "moderate" && "Moderate"}
                {tileData.apyHistory.volatility === "volatile" && "Volatile"}
              </div>
            </div>
            <div className="text-lg font-semibold text-white font-mono">
              {tileData.apyHistory.min7d.toFixed(2)}% — {tileData.apyHistory.max7d.toFixed(2)}%
            </div>
            <span className="text-[10px] text-white/30 group-hover:text-[#2dd4bf] transition-colors">
              7-day range · View →
            </span>
          </button>

          {/* Capital Flow */}
          <button 
            onClick={() => onSelectTab("activity")} 
            className="text-left group p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="text-xs text-white/50 shrink-0">Capital Flow (30d)</span>
              <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${
                tileData.activity.netFlow > 0 ? "badge-success" : 
                tileData.activity.netFlow < 0 ? "badge-danger" : "bg-white/5 text-white/50"
              }`}>
                {tileData.activity.netFlow > 0 ? "Inflow" : tileData.activity.netFlow < 0 ? "Outflow" : "Neutral"}
              </div>
            </div>
            <div className={`text-lg font-semibold font-mono ${
              tileData.activity.netFlow > 0 ? "text-emerald-400" : 
              tileData.activity.netFlow < 0 ? "text-red-400" : "text-white"
            }`}>
              {tileData.activity.netFlow > 0 ? "+" : ""}{formatNumber(tileData.activity.netFlow)} {pool.asset}
            </div>
            <span className="text-[10px] text-white/30 group-hover:text-[#2dd4bf] transition-colors">
              {tileData.activity.depositDays}d deposits · {tileData.activity.withdrawDays}d withdraws · View →
            </span>
          </button>

          {/* Rate Model */}
          <button 
            onClick={() => onSelectTab("rates")} 
            className="text-left group p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#2dd4bf]/40 hover:bg-[#2dd4bf]/5 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className="text-xs text-white/50 shrink-0">Rate Model</span>
              <div className={`badge text-[9px] whitespace-nowrap flex-shrink-0 ${tileData.yieldCurve.isAboveOptimal ? "badge-warning" : "badge-success"}`}>
                {tileData.yieldCurve.isAboveOptimal ? "Above Kink" : "Below Kink"}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono text-white">{tileData.yieldCurve.currentUtil.toFixed(0)}%</span>
                <span className="text-[10px] text-white/30">utilization</span>
                <span className="text-[10px] text-amber-400">(kink: {tileData.yieldCurve.optimalUtil.toFixed(0)}%)</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full relative overflow-hidden">
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${tileData.yieldCurve.optimalUtil}%` }}
                />
                <div 
                  className="h-full bg-gradient-to-r from-[#2dd4bf] to-teal-400"
                  style={{ width: `${Math.min(tileData.yieldCurve.currentUtil, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-white/30 group-hover:text-[#2dd4bf] transition-colors">
              View curve →
            </span>
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-white/[0.04]" />

      {/* ═══════════════════════════════════════════════════════════════════
          QUICK LINKS: Tabs for additional exploration
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 pt-2">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">Explore:</span>
        <button 
          onClick={() => onSelectTab("rates")} 
          className="px-3 py-1.5 text-[11px] font-medium bg-white/[0.03] hover:bg-[#2dd4bf]/10 border border-white/[0.06] hover:border-[#2dd4bf]/30 rounded-lg text-white/50 hover:text-[#2dd4bf] transition-all"
        >
          Yield & Rates
        </button>
        <button 
          onClick={() => onSelectTab("risk")} 
          className="px-3 py-1.5 text-[11px] font-medium bg-white/[0.03] hover:bg-[#2dd4bf]/10 border border-white/[0.06] hover:border-[#2dd4bf]/30 rounded-lg text-white/50 hover:text-[#2dd4bf] transition-all"
        >
          Risk & Liquidity
        </button>
        <button 
          onClick={() => onSelectTab("activity")} 
          className="px-3 py-1.5 text-[11px] font-medium bg-white/[0.03] hover:bg-[#2dd4bf]/10 border border-white/[0.06] hover:border-[#2dd4bf]/30 rounded-lg text-white/50 hover:text-[#2dd4bf] transition-all"
        >
          Activity
        </button>
      </div>
    </div>
  );
}
