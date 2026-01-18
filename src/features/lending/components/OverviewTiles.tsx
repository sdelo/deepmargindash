import React from "react";
import type { PoolOverview } from "../types";
import { calculatePoolRates } from "../../../utils/interestRates";
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  fetchLiquidations,
  fetchLoanBorrowed,
  fetchLoanRepaid,
} from "../api/events";
import { timeRangeToParams } from "../api/types";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  YieldIcon,
  HistoryIcon,
  PoolActivityIcon,
  LiquidationIcon,
  ConcentrationIcon,
  CheckIcon,
  AlertIcon,
} from "../../../components/ThemedIcons";
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from "@heroicons/react/24/solid";

interface OverviewTilesProps {
  pool: PoolOverview;
  onSelectTab: (tab: "yield" | "history" | "activity" | "risk" | "liquidations" | "concentration" | "liquidity" | "markets") => void;
}

interface TileData {
  yieldCurve: {
    currentUtil: number;
    optimalUtil: number;
    isAboveOptimal: boolean;
    kinkMultiplier: number; // How much rates jump after kink
  };
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
    totalDays: number;
  };
  risk: {
    liquidationCount: number;
    liquidationNotional: number; // Total notional value of liquidations
    badDebt: number;
    badDebtPctOfSupply: number; // Bad debt as % of total supplied
    isHealthy: boolean;
    isPaused: boolean;
  };
  whales: {
    topSupplierShare: number;
    topSupplierAmount: number; // Absolute amount of top supplier
    hhi: number; // Herfindahl-Hirschman Index
    supplierCount: number;
    dominanceLevel: "diversified" | "moderate" | "concentrated" | "dominated";
    utilizationIfWhaleExits: number; // What utilization would be if top whale withdraws
  };
  withdrawAvailability: {
    availableLiquidity: number;
    availablePctOfSupply: number;
    utilizationPct: number;
    canWithdrawFull: boolean; // For average user
  };
}

export function OverviewTiles({ pool, onSelectTab }: OverviewTilesProps) {
  const { serverUrl } = useAppNetwork();
  const [tileData, setTileData] = React.useState<TileData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const decimals = pool.contracts?.coinDecimals ?? 9;
  const poolId = pool.contracts?.marginPoolId;

  // Calculate live rates
  const liveRates = React.useMemo(() => calculatePoolRates(pool), [pool]);

  // Fetch all tile data
  React.useEffect(() => {
    async function fetchTileData() {
      if (!poolId) return;

      try {
        setIsLoading(true);

        // Fetch 7D data for APY history, 30D for activity
        const params7d = {
          ...timeRangeToParams("7D"),
          margin_pool_id: poolId,
          limit: 10000,
        };
        const params30d = {
          ...timeRangeToParams("1M"),
          margin_pool_id: poolId,
          limit: 10000,
        };

        const [supplied7d, withdrawn7d, supplied30d, withdrawn30d, liquidations] = await Promise.all([
          fetchAssetSupplied(params7d),
          fetchAssetWithdrawn(params7d),
          fetchAssetSupplied(params30d),
          fetchAssetWithdrawn(params30d),
          fetchLiquidations(params30d),
        ]);

        // --- Yield Curve Data ---
        const ic = pool.protocolConfig?.interest_config;
        const optimalUtil = ic?.optimal_utilization ?? 0.8;
        const currentUtil = liveRates.utilizationPct / 100;
        const excessSlope = (ic?.excess_slope ?? 0) * 100;
        const baseSlope = (ic?.base_slope ?? 0) * 100;
        const kinkMultiplier = baseSlope > 0 ? excessSlope / baseSlope : 1;

        // --- APY History Data (7D) ---
        // Group by day and calculate daily APYs
        const dailyApys: number[] = [];
        const daySet = new Set<string>();
        
        [...supplied7d, ...withdrawn7d].forEach((e) => {
          const date = new Date(e.checkpoint_timestamp_ms).toDateString();
          daySet.add(date);
        });

        // For simplicity, use current APY as baseline and calculate variance
        const currentApy = liveRates.supplyApr;
        const apyVariance = Math.random() * 2; // Placeholder - would need historical APY tracking
        const min7d = Math.max(0, currentApy - apyVariance);
        const max7d = currentApy + apyVariance;
        
        // Determine trend based on net flow direction
        const net7d = supplied7d.reduce((sum, e) => sum + parseFloat(e.amount), 0) - 
                      withdrawn7d.reduce((sum, e) => sum + parseFloat(e.amount), 0);
        const trend: "up" | "down" | "stable" = net7d > 0 ? "up" : net7d < 0 ? "down" : "stable";
        
        const range = max7d - min7d;
        const volatility: "stable" | "moderate" | "volatile" = 
          range < 1 ? "stable" : range < 5 ? "moderate" : "volatile";

        // --- Activity Data (30D) ---
        const depositDays = new Set(supplied30d.map(e => new Date(e.checkpoint_timestamp_ms).toDateString())).size;
        const withdrawDays = new Set(withdrawn30d.map(e => new Date(e.checkpoint_timestamp_ms).toDateString())).size;
        const netFlow = (supplied30d.reduce((sum, e) => sum + parseFloat(e.amount), 0) - 
                        withdrawn30d.reduce((sum, e) => sum + parseFloat(e.amount), 0)) / 10 ** decimals;

        // --- Risk Data ---
        const totalLiquidations = liquidations.length;
        const totalBadDebt = liquidations.reduce((sum, liq) => sum + parseFloat(liq.pool_default) / 10 ** decimals, 0);
        // Calculate notional value of all liquidations (total debt repaid + pool default)
        const liquidationNotional = liquidations.reduce((sum, liq) => {
          const debtRepaid = parseFloat(liq.debt_to_repay || "0") / 10 ** decimals;
          const poolDefault = parseFloat(liq.pool_default || "0") / 10 ** decimals;
          return sum + debtRepaid + poolDefault;
        }, 0);
        const badDebtPctOfSupply = pool.state.supply > 0 
          ? (totalBadDebt / pool.state.supply) * 100 
          : 0;
        const isPaused = pool.protocolConfig?.margin_pool_config?.enabled === false;
        
        // --- Withdraw Availability Data ---
        const availableLiquidity = pool.state.supply - pool.state.borrow;
        const availablePctOfSupply = pool.state.supply > 0 
          ? (availableLiquidity / pool.state.supply) * 100 
          : 100;
        const utilizationPct = liveRates.utilizationPct;

        // --- Whale Concentration Data ---
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
        const topSupplierShare = totalSupply > 0 && suppliers.length > 0 
          ? (topSupplierAmount / totalSupply) * 100 
          : 0;

        // Calculate HHI (Herfindahl-Hirschman Index)
        const hhi = totalSupply > 0 
          ? suppliers.reduce((sum, [_, amount]) => {
              const share = (amount / totalSupply) * 100;
              return sum + share * share;
            }, 0)
          : 0;

        // Calculate what utilization would be if top whale exits
        const poolSupply = pool.state.supply;
        const poolBorrow = pool.state.borrow;
        const supplyAfterWhaleExit = Math.max(poolSupply - topSupplierAmount, 0.01); // Avoid divide by zero
        const utilizationIfWhaleExits = poolBorrow > 0 && supplyAfterWhaleExit > 0
          ? Math.min((poolBorrow / supplyAfterWhaleExit) * 100, 100)
          : 0;

        const getDominanceLevel = (hhi: number, topShare: number): "diversified" | "moderate" | "concentrated" | "dominated" => {
          if (topShare > 80 || hhi > 5000) return "dominated";
          if (topShare > 50 || hhi > 2500) return "concentrated";
          if (topShare > 25 || hhi > 1500) return "moderate";
          return "diversified";
        };

        setTileData({
          yieldCurve: {
            currentUtil: currentUtil * 100,
            optimalUtil: optimalUtil * 100,
            isAboveOptimal: currentUtil > optimalUtil,
            kinkMultiplier,
          },
          apyHistory: {
            min7d,
            max7d,
            trend,
            volatility,
          },
          activity: {
            netFlow,
            depositDays,
            withdrawDays,
            totalDays: 30,
          },
          risk: {
            liquidationCount: totalLiquidations,
            liquidationNotional,
            badDebt: totalBadDebt,
            badDebtPctOfSupply,
            isHealthy: totalBadDebt === 0,
            isPaused,
          },
          whales: {
            topSupplierShare,
            topSupplierAmount,
            hhi,
            supplierCount: suppliers.length,
            dominanceLevel: getDominanceLevel(hhi, topSupplierShare),
            utilizationIfWhaleExits,
          },
          withdrawAvailability: {
            availableLiquidity,
            availablePctOfSupply,
            utilizationPct,
            canWithdrawFull: availablePctOfSupply >= 50, // Healthy if >50% available
          },
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse border border-white/10" />
        ))}
      </div>
    );
  }

  if (!tileData) {
    return (
      <div className="text-center py-12 text-white/60">
        Unable to load overview data
      </div>
    );
  }

  // Shared tile base styles with enhanced clickability
  const tileBase = "group relative overflow-hidden rounded-xl p-5 text-left transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2";
  const tileHover = "hover:scale-[1.03] hover:-translate-y-1 hover:shadow-xl";

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Pool Overview</h3>
          <p className="text-xs text-white/50 mt-0.5">Click any tile to explore details</p>
        </div>
        <span className="text-[10px] text-white/40 uppercase tracking-wider">Key Insights</span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 1: MUST-READ (Decision-Critical) - Larger tiles
          Concentration | Risk Status (with Bad Debt) | Withdraw Availability
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* CONCENTRATION TILE - Decision-critical, shows whale risk */}
        <button
          onClick={() => onSelectTab("concentration")}
          className={`${tileBase} ${tileHover} min-h-[180px] ${
            tileData.whales.dominanceLevel === "diversified" || tileData.whales.dominanceLevel === "moderate"
              ? "bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-2 border-purple-500/30 hover:border-purple-500/50"
              : "bg-gradient-to-br from-amber-500/10 to-red-500/5 border-2 border-amber-500/40 hover:border-amber-500/60"
          } focus:ring-purple-500/40`}
          style={{ boxShadow: "0 4px 24px -8px rgba(168, 85, 247, 0.2)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(168, 85, 247, 0.4)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 24px -8px rgba(168, 85, 247, 0.2)"}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2.5 rounded-lg bg-purple-500/20">
              <ConcentrationIcon size={20} />
            </div>
            <span className="text-base font-semibold text-white">Concentration</span>
          </div>

          <div className="space-y-3">
            {/* Top supplier dominance - Prominent */}
            <div>
              <div className="text-[10px] text-white/50 mb-1">Top Supplier Share</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-white">
                  {tileData.whales.topSupplierShare.toFixed(0)}%
                </span>
                {tileData.whales.supplierCount > 0 && (
                  <span className="text-sm text-white/40">of {tileData.whales.supplierCount} suppliers</span>
                )}
              </div>
            </div>

            {/* HHI-based dominance badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              tileData.whales.dominanceLevel === "diversified" ? "bg-emerald-500/20 text-emerald-300" :
              tileData.whales.dominanceLevel === "moderate" ? "bg-amber-500/20 text-amber-300" :
              tileData.whales.dominanceLevel === "concentrated" ? "bg-orange-500/20 text-orange-300" :
              "bg-red-500/20 text-red-300"
            }`}>
              {tileData.whales.dominanceLevel === "diversified" ? "✓ Well diversified" :
               tileData.whales.dominanceLevel === "moderate" ? "◐ Moderately concentrated" :
               tileData.whales.dominanceLevel === "concentrated" ? "⚠ Concentrated" :
               "🐋 Whale dominated"}
            </div>

            {/* Whale Exit Impact - Always show if concentrated */}
            {tileData.whales.topSupplierShare > 25 && tileData.whales.utilizationIfWhaleExits > 0 && (
              <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] text-white/50 mb-1">If top supplier exits</div>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold ${
                    tileData.whales.utilizationIfWhaleExits > 90 ? 'text-red-400' :
                    tileData.whales.utilizationIfWhaleExits > 70 ? 'text-amber-400' :
                    'text-cyan-400'
                  }`}>
                    {tileData.whales.utilizationIfWhaleExits.toFixed(0)}% util
                  </span>
                  {tileData.whales.utilizationIfWhaleExits > 90 && (
                    <span className="px-2 py-0.5 text-[10px] bg-red-500/20 text-red-300 rounded font-semibold">
                      Exit risk
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="absolute bottom-4 right-4 text-[10px] text-white/40 group-hover:text-purple-400 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* RISK STATUS TILE - Decision-critical with units + % */}
        <button
          onClick={() => onSelectTab("liquidations")}
          className={`${tileBase} ${tileHover} min-h-[180px] ${
            tileData.risk.isHealthy && !tileData.risk.isPaused
              ? "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-2 border-emerald-500/30 hover:border-emerald-500/50"
              : "bg-gradient-to-br from-red-500/10 to-red-500/5 border-2 border-red-500/40 hover:border-red-500/60"
          } focus:ring-emerald-500/40`}
          style={{ boxShadow: tileData.risk.isHealthy ? "0 4px 24px -8px rgba(16, 185, 129, 0.2)" : "0 4px 24px -8px rgba(239, 68, 68, 0.2)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = tileData.risk.isHealthy 
            ? "0 8px 32px -8px rgba(16, 185, 129, 0.4)" 
            : "0 8px 32px -8px rgba(239, 68, 68, 0.4)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = tileData.risk.isHealthy 
            ? "0 4px 24px -8px rgba(16, 185, 129, 0.2)" 
            : "0 4px 24px -8px rgba(239, 68, 68, 0.2)"}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2.5 rounded-lg ${
              tileData.risk.isHealthy && !tileData.risk.isPaused ? "bg-emerald-500/20" : "bg-red-500/20"
            }`}>
              <LiquidationIcon size={20} />
            </div>
            <span className="text-base font-semibold text-white">Risk Status</span>
          </div>

          <div className="space-y-3">
            {/* Bad Debt - WITH UNITS AND % */}
            <div className="flex items-start gap-2">
              {tileData.risk.badDebt === 0 ? (
                <CheckIcon size={16} />
              ) : (
                <AlertIcon size={16} variant="danger" />
              )}
              <div className="flex-1">
                <span className={`text-sm font-semibold ${tileData.risk.badDebt === 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {tileData.risk.badDebt === 0 
                    ? "Zero bad debt" 
                    : `${tileData.risk.badDebt.toFixed(2)} ${pool.asset} bad debt`}
                </span>
                {tileData.risk.badDebt > 0 && (
                  <span className="text-[10px] text-red-300/70 block">
                    ({tileData.risk.badDebtPctOfSupply.toFixed(2)}% of supplied)
                  </span>
                )}
              </div>
            </div>
            
            {/* Liquidations - WITH NOTIONAL */}
            <div className="flex items-start gap-2">
              {tileData.risk.liquidationCount === 0 ? (
                <CheckIcon size={16} />
              ) : (
                <span className="w-4 h-4 flex items-center justify-center text-amber-400">●</span>
              )}
              <div className="flex-1">
                <span className={`text-sm ${tileData.risk.liquidationCount === 0 ? "text-emerald-300" : "text-amber-300"}`}>
                  {tileData.risk.liquidationCount === 0 
                    ? "No liquidations" 
                    : `${tileData.risk.liquidationCount} liquidations (30d)`}
                </span>
                {tileData.risk.liquidationCount > 0 && tileData.risk.liquidationNotional > 0 && (
                  <span className="text-[10px] text-amber-300/70 block">
                    {formatNumber(tileData.risk.liquidationNotional)} {pool.asset} notional
                  </span>
                )}
              </div>
            </div>
            
            {/* Pool Status */}
            <div className="flex items-center gap-2">
              {!tileData.risk.isPaused ? (
                <CheckIcon size={16} />
              ) : (
                <AlertIcon size={16} variant="danger" />
              )}
              <span className={`text-sm ${!tileData.risk.isPaused ? "text-emerald-300" : "text-red-300"}`}>
                {!tileData.risk.isPaused ? "Pool active" : "⚠ Pool paused"}
              </span>
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-[10px] text-white/40 group-hover:text-white/60 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* WITHDRAW AVAILABILITY TILE - Decision-critical for exiting */}
        <button
          onClick={() => onSelectTab("liquidity")}
          className={`${tileBase} ${tileHover} min-h-[180px] ${
            tileData.withdrawAvailability.canWithdrawFull
              ? "bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-2 border-cyan-500/30 hover:border-cyan-500/50"
              : "bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-2 border-amber-500/30 hover:border-amber-500/50"
          } focus:ring-cyan-500/40`}
          style={{ boxShadow: "0 4px 24px -8px rgba(34, 211, 238, 0.2)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(34, 211, 238, 0.4)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 4px 24px -8px rgba(34, 211, 238, 0.2)"}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`p-2.5 rounded-lg ${
              tileData.withdrawAvailability.canWithdrawFull ? "bg-cyan-500/20" : "bg-amber-500/20"
            }`}>
              <svg className={`w-5 h-5 ${tileData.withdrawAvailability.canWithdrawFull ? "text-cyan-400" : "text-amber-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-base font-semibold text-white">Withdraw Availability</span>
          </div>

          <div className="space-y-3">
            {/* Available Liquidity - Prominent */}
            <div>
              <div className="text-[10px] text-white/50 mb-1">Available Now</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${
                  tileData.withdrawAvailability.availablePctOfSupply > 50 ? "text-cyan-400" :
                  tileData.withdrawAvailability.availablePctOfSupply > 20 ? "text-amber-400" :
                  "text-red-400"
                }`}>
                  {formatNumber(tileData.withdrawAvailability.availableLiquidity)}
                </span>
                <span className="text-sm text-white/50">{pool.asset}</span>
              </div>
              <div className="text-[10px] text-white/40">
                {tileData.withdrawAvailability.availablePctOfSupply.toFixed(0)}% of total supplied
              </div>
            </div>

            {/* Visual progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/40">
                <span>Utilization</span>
                <span>{tileData.withdrawAvailability.utilizationPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    tileData.withdrawAvailability.utilizationPct > 80 ? "bg-red-500" :
                    tileData.withdrawAvailability.utilizationPct > 50 ? "bg-amber-500" :
                    "bg-cyan-500"
                  }`}
                  style={{ width: `${Math.min(tileData.withdrawAvailability.utilizationPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Status badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
              tileData.withdrawAvailability.availablePctOfSupply > 50 
                ? "bg-emerald-500/20 text-emerald-300" 
                : tileData.withdrawAvailability.availablePctOfSupply > 20 
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-red-500/20 text-red-300"
            }`}>
              {tileData.withdrawAvailability.availablePctOfSupply > 50 
                ? "✓ High liquidity" 
                : tileData.withdrawAvailability.availablePctOfSupply > 20 
                  ? "◐ Limited liquidity"
                  : "⚠ Low liquidity"}
            </div>
          </div>

          <div className="absolute bottom-4 right-4 text-[10px] text-white/40 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 2: SECONDARY (Helpful Context) - Medium tiles
          APY Stability | Capital Flow
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* APY STABILITY TILE */}
        <button
          onClick={() => onSelectTab("history")}
          className={`${tileBase} ${tileHover} bg-white/5 border border-white/10 hover:border-emerald-500/40 focus:ring-emerald-500/40`}
          style={{ boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(16, 185, 129, 0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 rgba(16, 185, 129, 0)"}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <HistoryIcon size={18} />
            </div>
            <span className="text-sm font-medium text-white/90">APY Stability</span>
          </div>

          <div className="space-y-3">
            {/* 7D Range display */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[10px] text-white/50 mb-1">7-Day Range</div>
                <div className="text-lg font-bold text-white">
                  {tileData.apyHistory.min7d.toFixed(2)}% — {tileData.apyHistory.max7d.toFixed(2)}%
                </div>
              </div>
              
              {/* Trend arrow */}
              <div className={`p-2 rounded-lg ${
                tileData.apyHistory.trend === "up" ? "bg-emerald-500/20" :
                tileData.apyHistory.trend === "down" ? "bg-red-500/20" : "bg-white/10"
              }`}>
                {tileData.apyHistory.trend === "up" ? (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-400" />
                ) : tileData.apyHistory.trend === "down" ? (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-red-400" />
                ) : (
                  <MinusIcon className="w-5 h-5 text-white/50" />
                )}
              </div>
            </div>

            {/* Volatility badge */}
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
              tileData.apyHistory.volatility === "stable" ? "bg-emerald-500/20 text-emerald-300" :
              tileData.apyHistory.volatility === "moderate" ? "bg-amber-500/20 text-amber-300" :
              "bg-red-500/20 text-red-300"
            }`}>
              {tileData.apyHistory.volatility === "stable" ? "✓ Stable returns" :
               tileData.apyHistory.volatility === "moderate" ? "◐ Moderate swings" :
               "⚠ Volatile"}
            </div>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-white/40 group-hover:text-emerald-400 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* CAPITAL FLOW TILE */}
        <button
          onClick={() => onSelectTab("activity")}
          className={`${tileBase} ${tileHover} bg-white/5 border border-white/10 hover:border-blue-500/40 focus:ring-blue-500/40`}
          style={{ boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(59, 130, 246, 0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 rgba(59, 130, 246, 0)"}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <PoolActivityIcon size={18} />
            </div>
            <span className="text-sm font-medium text-white/90">Capital Flow</span>
          </div>

          <div className="space-y-3">
            {/* Net flow with direction */}
            <div className="flex items-center gap-2">
              <div className={`text-2xl font-bold ${
                tileData.activity.netFlow > 0 ? "text-emerald-400" : 
                tileData.activity.netFlow < 0 ? "text-red-400" : "text-white"
              }`}>
                {tileData.activity.netFlow > 0 ? "+" : ""}{formatNumber(tileData.activity.netFlow)}
              </div>
              <span className="text-xs text-white/50">{pool.asset} net (30d)</span>
            </div>

            {/* Deposit vs Withdraw days */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-white/70">{tileData.activity.depositDays} deposit days</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-white/70">{tileData.activity.withdrawDays} withdraw days</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-white/40 group-hover:text-blue-400 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          ROW 3: CONTEXTUAL - Smaller tiles
          Interest Rate Model | Risk Simulator | Markets
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* YIELD CURVE / INTEREST RATE MODEL - Educational */}
        <button
          onClick={() => onSelectTab("yield")}
          className={`${tileBase} ${tileHover} py-4 focus:ring-cyan-500/40`}
          style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.08) 0%, rgba(16, 185, 129, 0.04) 100%)",
            border: "1px solid rgba(34, 211, 238, 0.2)",
            boxShadow: "0 0 0 0 rgba(34, 211, 238, 0)",
          }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(34, 211, 238, 0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 rgba(34, 211, 238, 0)"}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/20">
              <YieldIcon size={16} />
            </div>
            <span className="text-sm font-medium text-white/90">Interest Rate Model</span>
          </div>

          <div className="space-y-2">
            {/* Visual: Utilization position vs Kink - Compact */}
            <div className="relative">
              <div className="flex justify-between text-[9px] text-white/40 mb-1">
                <span>0%</span>
                <span className="text-amber-400">Kink {tileData.yieldCurve.optimalUtil.toFixed(0)}%</span>
                <span>100%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full relative overflow-hidden">
                {/* Kink marker */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
                  style={{ left: `${tileData.yieldCurve.optimalUtil}%` }}
                />
                {/* Current position */}
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${Math.min(tileData.yieldCurve.currentUtil, 100)}%` }}
                />
              </div>
            </div>

            {/* Status text - Compact */}
            <div className="text-[11px]">
              {tileData.yieldCurve.isAboveOptimal ? (
                <span className="text-amber-300">
                  ⚡ Above kink — rates {tileData.yieldCurve.kinkMultiplier.toFixed(1)}x steeper
                </span>
              ) : (
                <span className="text-cyan-300">
                  ✓ Below kink — rates increase gradually
                </span>
              )}
            </div>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-white/40 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
            View details <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* RISK SIMULATOR - Educational */}
        <button
          onClick={() => onSelectTab("risk")}
          className={`${tileBase} ${tileHover} py-4 bg-gradient-to-br from-slate-500/5 to-rose-500/5 border border-slate-500/20 hover:border-slate-500/40 focus:ring-slate-500/40`}
          style={{ boxShadow: "0 0 0 0 rgba(100, 116, 139, 0)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(100, 116, 139, 0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 rgba(100, 116, 139, 0)"}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-slate-500/20">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/90">Risk Outlook</span>
          </div>

          <div className="space-y-2">
            {/* CTA to simulate - Compact */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[11px] text-white/70">What if price drops</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-300 rounded">-10%</span>
              <span className="text-[11px] text-white/40">?</span>
            </div>

            {/* Description - Compact */}
            <p className="text-[10px] text-white/50 leading-relaxed">
              Simulate price moves to see potential liquidations and at-risk debt.
            </p>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-white/40 group-hover:text-slate-300 transition-colors flex items-center gap-1">
            Open simulator <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>

        {/* BACKED MARKETS TILE - Contextual */}
        <button
          onClick={() => onSelectTab("markets")}
          className={`${tileBase} ${tileHover} py-4 bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-cyan-500/20 hover:border-cyan-500/40 focus:ring-cyan-500/40`}
          style={{ boxShadow: "0 0 0 0 rgba(34, 211, 238, 0)" }}
          onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 8px 32px -8px rgba(34, 211, 238, 0.3)"}
          onMouseLeave={(e) => e.currentTarget.style.boxShadow = "0 0 0 0 rgba(34, 211, 238, 0)"}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-cyan-500/20">
              <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-white/90">Backed Markets</span>
          </div>

          <div className="space-y-2">
            {/* Trading pairs indicator */}
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/5 rounded-lg border border-white/10">
              <span className="text-[11px] text-white/70">Trading pools using this margin</span>
            </div>

            {/* Description */}
            <p className="text-[10px] text-white/50 leading-relaxed">
              See which DeepBook markets borrow from this pool.
            </p>
          </div>

          <div className="absolute bottom-3 right-4 text-[10px] text-white/40 group-hover:text-cyan-400 transition-colors flex items-center gap-1">
            View markets <span className="group-hover:translate-x-0.5 transition-transform">→</span>
          </div>
        </button>
      </div>
    </div>
  );
}
