import React from "react";
import {
  useAtRiskPositions,
  type AtRiskPosition,
} from "../../../hooks/useAtRiskPositions";
import { ChartIcon, AlertIcon } from "../../../components/ThemedIcons";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import type { PoolOverview } from "../types";

interface PoolRiskOutlookProps {
  pool: PoolOverview;
  onSelectTab?: (tab: string) => void;
}

interface SimulationResult {
  priceChange: number;
  liquidatableCount: number;
  totalDebtAtRiskUsd: number;
}

/**
 * Calculate collateral and debt values from position
 */
function getPositionValues(position: AtRiskPosition) {
  const collateralUsd = position.baseAssetUsd + position.quoteAssetUsd;
  const debtUsd = position.baseDebtUsd + position.quoteDebtUsd;
  return { collateralUsd, debtUsd };
}

/**
 * Simulate what happens to positions if prices change
 * Returns TOTAL counts/values at that price level (not deltas)
 */
function simulatePositionsWithPriceChange(
  positions: AtRiskPosition[],
  basePriceChangePct: number
): SimulationResult {
  let liquidatableCount = 0;
  let totalDebtAtRiskUsd = 0;

  positions.forEach((position) => {
    const basePriceMultiplier = 1 + basePriceChangePct / 100;

    // Recalculate values with new price
    const newBaseAssetUsd = position.baseAssetUsd * basePriceMultiplier;
    const newQuoteAssetUsd = position.quoteAssetUsd;
    const newBaseDebtUsd = position.baseDebtUsd * basePriceMultiplier;
    const newQuoteDebtUsd = position.quoteDebtUsd;

    const newCollateralUsd = newBaseAssetUsd + newQuoteAssetUsd;
    const newDebtUsd = newBaseDebtUsd + newQuoteDebtUsd;

    const newRiskRatio = newDebtUsd > 0 ? newCollateralUsd / newDebtUsd : 999;
    const isNowLiquidatable = newRiskRatio <= position.liquidationThreshold;

    if (isNowLiquidatable) {
      liquidatableCount++;
      totalDebtAtRiskUsd += newDebtUsd;
    }
  });

  return {
    priceChange: basePriceChangePct,
    liquidatableCount,
    totalDebtAtRiskUsd,
  };
}

function formatUsd(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  if (value < 1 && value > 0) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(0)}`;
}

/**
 * Get proper HF distribution buckets that align with liquidation threshold
 */
function getRiskDistribution(
  positions: AtRiskPosition[],
  liquidationThreshold: number
): Array<{
  label: string;
  minRatio: number;
  maxRatio: number;
  count: number;
  totalDebtUsd: number;
  color: string;
  isLiquidatable: boolean;
}> {
  // Create buckets relative to the actual liquidation threshold
  const buckets = [
    {
      label: `< ${liquidationThreshold.toFixed(2)}`,
      minRatio: 0,
      maxRatio: liquidationThreshold,
      count: 0,
      totalDebtUsd: 0,
      color: "#f43f5e", // Rose-500 - Liquidatable
      isLiquidatable: true,
    },
    {
      label: `${liquidationThreshold.toFixed(2)}–${(liquidationThreshold * 1.05).toFixed(2)}`,
      minRatio: liquidationThreshold,
      maxRatio: liquidationThreshold * 1.05,
      count: 0,
      totalDebtUsd: 0,
      color: "#fb923c", // Orange-400 - Critical
      isLiquidatable: false,
    },
    {
      label: `${(liquidationThreshold * 1.05).toFixed(2)}–${(liquidationThreshold * 1.15).toFixed(2)}`,
      minRatio: liquidationThreshold * 1.05,
      maxRatio: liquidationThreshold * 1.15,
      count: 0,
      totalDebtUsd: 0,
      color: "#fbbf24", // Amber-400 - Warning
      isLiquidatable: false,
    },
    {
      label: `${(liquidationThreshold * 1.15).toFixed(2)}–${(liquidationThreshold * 1.4).toFixed(2)}`,
      minRatio: liquidationThreshold * 1.15,
      maxRatio: liquidationThreshold * 1.4,
      count: 0,
      totalDebtUsd: 0,
      color: "#2dd4bf", // Teal-400 - Safe
      isLiquidatable: false,
    },
    {
      label: `${(liquidationThreshold * 1.4).toFixed(2)}+`,
      minRatio: liquidationThreshold * 1.4,
      maxRatio: Infinity,
      count: 0,
      totalDebtUsd: 0,
      color: "#22d3ee", // Cyan-400 - Very Safe
      isLiquidatable: false,
    },
  ];

  positions.forEach((position) => {
    const bucket = buckets.find(
      (b) => position.riskRatio >= b.minRatio && position.riskRatio < b.maxRatio
    );
    if (bucket) {
      bucket.count++;
      bucket.totalDebtUsd += position.totalDebtUsd;
    }
  });

  return buckets;
}

/**
 * Determine pool health verdict
 */
function getPoolVerdict(
  liquidatableCount: number,
  liquidatableDebtUsd: number,
  distanceToFirstLiq: number | null,
  totalPositions: number
): {
  verdict: "robust" | "watch" | "fragile";
  label: string;
  reason: string;
} {
  if (liquidatableCount > 0) {
    return {
      verdict: "fragile",
      label: "Fragile",
      reason: `${liquidatableCount} position${liquidatableCount > 1 ? "s" : ""} can be liquidated now (${formatUsd(liquidatableDebtUsd)} debt)`,
    };
  }

  if (totalPositions === 0) {
    return {
      verdict: "robust",
      label: "Robust",
      reason: "No open positions - zero counterparty risk",
    };
  }

  if (distanceToFirstLiq !== null && Math.abs(distanceToFirstLiq) < 5) {
    return {
      verdict: "fragile",
      label: "Fragile",
      reason: `First liquidation at just ${Math.abs(distanceToFirstLiq).toFixed(1)}% price move`,
    };
  }

  if (distanceToFirstLiq !== null && Math.abs(distanceToFirstLiq) < 15) {
    return {
      verdict: "watch",
      label: "Watch",
      reason: `First liquidation at ${Math.abs(distanceToFirstLiq).toFixed(1)}% price move`,
    };
  }

  return {
    verdict: "robust",
    label: "Robust",
    reason: "All positions well-collateralized",
  };
}

/**
 * Calculate distance to first liquidation
 */
function calculateDistanceToFirstLiquidation(
  positions: AtRiskPosition[]
): { priceDrop: number | null; priceIncrease: number | null } {
  let closestDropPct: number | null = null;
  let closestIncreasePct: number | null = null;

  positions.forEach((position) => {
    if (position.isLiquidatable) return;

    const { collateralUsd, debtUsd } = getPositionValues(position);
    if (debtUsd === 0) return;

    const netBaseExposure = position.baseAssetUsd - position.baseDebtUsd;

    if (Math.abs(netBaseExposure) > 0.01) {
      const targetCollateral = position.liquidationThreshold * debtUsd;
      const changeNeeded = (targetCollateral - collateralUsd) / netBaseExposure;
      const pctChange = changeNeeded * 100;

      if (pctChange < 0 && (closestDropPct === null || pctChange > closestDropPct)) {
        closestDropPct = pctChange;
      } else if (pctChange > 0 && (closestIncreasePct === null || pctChange < closestIncreasePct)) {
        closestIncreasePct = pctChange;
      }
    }
  });

  return { priceDrop: closestDropPct, priceIncrease: closestIncreasePct };
}

/**
 * Pool-specific forward-looking risk outlook
 */
export function PoolRiskOutlook({ pool, onSelectTab }: PoolRiskOutlookProps) {
  const [priceChangePct, setPriceChangePct] = React.useState(0);

  const baseMarginPoolId = pool.contracts?.marginPoolId;

  const {
    positions: allPositions,
    isLoading,
    error,
    lastUpdated,
  } = useAtRiskPositions();

  // Filter positions for this pool
  const poolPositions = React.useMemo(() => {
    if (!baseMarginPoolId) return allPositions;
    return allPositions.filter(
      (p) =>
        p.baseMarginPoolId === baseMarginPoolId ||
        p.quoteMarginPoolId === baseMarginPoolId
    );
  }, [allPositions, baseMarginPoolId]);

  // Get actual liquidation threshold from positions (or default)
  const liquidationThreshold = poolPositions[0]?.liquidationThreshold ?? 1.05;

  // Calculate current state from actual position data (not simulation)
  const currentState = React.useMemo(() => {
    const liquidatable = poolPositions.filter((p) => p.isLiquidatable);
    return {
      liquidatableCount: liquidatable.length,
      totalDebtAtRiskUsd: liquidatable.reduce((sum, p) => sum + p.totalDebtUsd, 0),
    };
  }, [poolPositions]);

  // Risk distribution using actual threshold
  const riskDistribution = React.useMemo(
    () => getRiskDistribution(poolPositions, liquidationThreshold),
    [poolPositions, liquidationThreshold]
  );

  // Calculate distance to first liquidation
  const distanceToLiquidation = React.useMemo(
    () => calculateDistanceToFirstLiquidation(poolPositions),
    [poolPositions]
  );

  // Simulated state at selected price change
  const simulatedState = React.useMemo(
    () => simulatePositionsWithPriceChange(poolPositions, priceChangePct),
    [poolPositions, priceChangePct]
  );

  // All scenarios for the chart
  const scenarios = React.useMemo(() => {
    const changes = [-20, -15, -10, -5, 0, 5, 10];
    return changes.map((change) =>
      simulatePositionsWithPriceChange(poolPositions, change)
    );
  }, [poolPositions]);

  const totalPositions = poolPositions.length;

  // Get verdict
  const closestMove =
    distanceToLiquidation.priceDrop !== null
      ? distanceToLiquidation.priceDrop
      : distanceToLiquidation.priceIncrease;

  const verdict = React.useMemo(
    () =>
      getPoolVerdict(
        currentState.liquidatableCount,
        currentState.totalDebtAtRiskUsd,
        closestMove,
        totalPositions
      ),
    [currentState, closestMove, totalPositions]
  );

  // Get top liquidatable positions for quick view
  const topLiquidatable = React.useMemo(
    () =>
      poolPositions
        .filter((p) => p.isLiquidatable)
        .sort((a, b) => b.totalDebtUsd - a.totalDebtUsd)
        .slice(0, 3),
    [poolPositions]
  );

  if (isLoading && poolPositions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="bg-white/5 rounded-lg border border-white/10 p-3 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-1/3 mb-2" />
          <div className="h-16 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-center">
        <p className="text-rose-400 text-xs">
          Error loading risk data: {error.message}
        </p>
      </div>
    );
  }

  // Calculate change from current state
  const liquidatableDelta = simulatedState.liquidatableCount - currentState.liquidatableCount;

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════════
          RISK SUMMARY STRIP
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className={`rounded-xl px-4 py-3 backdrop-blur-sm ${
          verdict.verdict === "robust"
            ? "bg-emerald-500/10 border border-emerald-500/20"
            : verdict.verdict === "watch"
              ? "bg-amber-500/10 border border-amber-500/20"
              : "bg-rose-500/10 border border-rose-500/20"
        }`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left: Status + Reason */}
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg ${
                verdict.verdict === "robust"
                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/40"
                  : verdict.verdict === "watch"
                    ? "bg-amber-500/30 text-amber-300 border border-amber-400/40"
                    : "bg-rose-500/30 text-rose-300 border border-rose-400/40"
              }`}
            >
              {verdict.label}
            </span>
            <span className="text-sm text-white/80">{verdict.reason}</span>
          </div>

          {/* Right: CTA */}
          {currentState.liquidatableCount > 0 && onSelectTab && (
            <button
              onClick={() => onSelectTab("liquidations")}
              className="px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg border border-cyan-400/30 transition-all"
            >
              View positions →
            </button>
          )}
        </div>

        {/* Key metrics row */}
        <div className="flex items-center gap-6 mt-3 pt-3 border-t border-white/10 text-xs">
          <div>
            <span className="text-white/50">Positions</span>
            <span className="ml-2 font-semibold text-white">{totalPositions}</span>
          </div>
          <div>
            <span className="text-white/50">Liquidatable</span>
            <span
              className={`ml-2 font-semibold ${currentState.liquidatableCount > 0 ? "text-rose-400" : "text-emerald-400"}`}
            >
              {currentState.liquidatableCount}
            </span>
          </div>
          <div>
            <span className="text-white/50">Debt at risk</span>
            <span
              className={`ml-2 font-semibold ${currentState.totalDebtAtRiskUsd > 0 ? "text-rose-400" : "text-white"}`}
            >
              {formatUsd(currentState.totalDebtAtRiskUsd)}
            </span>
          </div>
          {distanceToLiquidation.priceDrop !== null && currentState.liquidatableCount === 0 && (
            <div>
              <span className="text-white/50">First liq at</span>
              <span className="ml-2 font-semibold text-amber-400">
                {Math.abs(distanceToLiquidation.priceDrop).toFixed(1)}% drop
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          LIQUIDATABLE POSITIONS QUICK VIEW (if any)
      ═══════════════════════════════════════════════════════════════════════ */}
      {topLiquidatable.length > 0 && (
        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Liquidatable Now
          </h3>
          <div className="space-y-2">
            {topLiquidatable.map((pos) => (
              <div
                key={pos.marginManagerId}
                className="flex items-center justify-between text-xs bg-black/20 rounded-lg px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <code className="text-white/60 font-mono">
                    {pos.marginManagerId.slice(0, 8)}…
                  </code>
                  <span className="text-rose-400">
                    HF {pos.riskRatio.toFixed(3)}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-white/70">
                    Debt: <span className="text-white font-medium">{formatUsd(pos.totalDebtUsd)}</span>
                  </span>
                  <span className="text-emerald-400">
                    Reward: ~{formatUsd(pos.estimatedRewardUsd)}
                  </span>
                </div>
              </div>
            ))}
            {currentState.liquidatableCount > 3 && (
              <p className="text-xs text-white/40 text-center pt-1">
                +{currentState.liquidatableCount - 3} more positions
              </p>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TWO-COLUMN GRID
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: HEALTH FACTOR DISTRIBUTION */}
        <div className="bg-slate-800/50 border border-cyan-400/10 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                <ChartIcon size={16} className="text-cyan-400" />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Health Factor Distribution
              </h3>
              <div className="relative group">
                <QuestionMarkCircleIcon className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help" />
                <div className="absolute left-0 bottom-full mb-1 w-56 p-2 bg-slate-900 border border-cyan-400/20 rounded-lg text-[11px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                  Health Factor = Collateral / Debt. Below {liquidationThreshold.toFixed(2)} = liquidatable.
                </div>
              </div>
            </div>
            <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
              Threshold: {liquidationThreshold.toFixed(2)}
            </span>
          </div>

          {totalPositions === 0 ? (
            <div className="text-center py-6 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
              <div className="text-emerald-400 text-sm font-semibold">
                ✓ No Active Borrowers
              </div>
              <p className="text-xs text-white/50 mt-1">No counterparty risk</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {riskDistribution.map((bucket, idx) => {
                const maxBucketCount = Math.max(
                  ...riskDistribution.map((b) => b.count),
                  1
                );
                const widthPct = bucket.count > 0 ? (bucket.count / maxBucketCount) * 100 : 0;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 text-xs ${bucket.count === 0 ? "opacity-40" : ""}`}
                  >
                    <span
                      className={`w-20 text-right font-mono ${bucket.isLiquidatable ? "text-rose-400 font-semibold" : "text-white/50"}`}
                    >
                      {bucket.label}
                    </span>
                    <div className="flex-1 h-2.5 bg-black/30 rounded-full overflow-hidden">
                      {bucket.count > 0 && (
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.max(widthPct, 4)}%`,
                            backgroundColor: bucket.color,
                            boxShadow: `0 0 8px ${bucket.color}40`,
                          }}
                        />
                      )}
                    </div>
                    <span
                      className={`w-8 text-right font-semibold ${bucket.isLiquidatable && bucket.count > 0 ? "text-rose-400" : "text-white/70"}`}
                    >
                      {bucket.count}
                    </span>
                    {bucket.count > 0 && (
                      <span className="w-16 text-right text-white/40">
                        {formatUsd(bucket.totalDebtUsd)}
                      </span>
                    )}
                  </div>
                );
              })}
              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 mt-2 border-t border-white/5 text-[10px] text-white/40">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" /> Liquidatable
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> At risk
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" /> Safe
                </span>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: PRICE SHOCK SIMULATOR */}
        {totalPositions > 0 ? (
          <div className="bg-slate-800/50 border border-amber-400/10 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-500/20 rounded-lg">
                  <AlertIcon size={16} variant="warning" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  Price Shock Simulator
                </h3>
                <div className="relative group">
                  <QuestionMarkCircleIcon className="w-4 h-4 text-white/40 hover:text-white/60 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-1 w-56 p-2 bg-slate-900 border border-amber-400/20 rounded-lg text-[11px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                    Simulates how {pool.asset} price changes affect liquidations.
                    Negative = {pool.asset} drops, positive = {pool.asset} rises.
                  </div>
                </div>
              </div>
              <span className="text-xs text-white/50 bg-white/5 px-2 py-0.5 rounded">
                {pool.asset} price Δ
              </span>
            </div>

            {/* Price change selector */}
            <div className="flex items-center justify-center gap-1 mb-3">
              {[-20, -15, -10, -5, 0, 5, 10].map((change) => (
                <button
                  key={change}
                  onClick={() => setPriceChangePct(change)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    priceChangePct === change
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-900 shadow-lg shadow-cyan-500/25"
                      : change < 0
                        ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/20"
                        : change > 0
                          ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20"
                          : "bg-white/10 text-white/70 hover:bg-white/15 border border-white/20"
                  }`}
                >
                  {change > 0 ? "+" : ""}
                  {change}%
                </button>
              ))}
            </div>

            {/* Result display */}
            <div className="bg-black/30 rounded-lg px-4 py-3 mb-3 border border-white/5">
              <div className="text-center mb-2">
                <span className="text-xs text-white/50">
                  If {pool.asset} {priceChangePct >= 0 ? "rises" : "drops"}{" "}
                  <span className="font-semibold text-white">
                    {Math.abs(priceChangePct)}%
                  </span>
                  :
                </span>
              </div>
              <div className="flex items-center justify-center gap-6">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${simulatedState.liquidatableCount > currentState.liquidatableCount ? "text-rose-400" : simulatedState.liquidatableCount > 0 ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {simulatedState.liquidatableCount}
                  </div>
                  <div className="text-[10px] text-white/50">
                    liquidatable
                    {liquidatableDelta !== 0 && (
                      <span
                        className={`ml-1 ${liquidatableDelta > 0 ? "text-rose-400" : "text-emerald-400"}`}
                      >
                        ({liquidatableDelta > 0 ? "+" : ""}
                        {liquidatableDelta} vs now)
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${simulatedState.totalDebtAtRiskUsd > currentState.totalDebtAtRiskUsd ? "text-rose-400" : "text-white"}`}
                  >
                    {formatUsd(simulatedState.totalDebtAtRiskUsd)}
                  </div>
                  <div className="text-[10px] text-white/50">debt at risk</div>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-24">
              {/* Y-axis label */}
              <div className="absolute left-0 top-0 bottom-4 w-8 flex flex-col justify-between text-[9px] text-white/40 font-mono text-right pr-1">
                <span>{Math.max(...scenarios.map((s) => s.liquidatableCount))}</span>
                <span className="text-[8px]">liq</span>
                <span>0</span>
              </div>

              <div className="ml-9 h-full relative">
                {/* Grid */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/5" />
                <div className="absolute inset-x-0 bottom-5 h-px bg-white/10" />

                {/* 0% reference line */}
                <div
                  className="absolute bottom-5 top-0"
                  style={{ left: `${(4 / 6) * 100}%` }}
                >
                  <div className="w-px h-full bg-cyan-400/40" />
                  <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400">
                    now
                  </span>
                </div>

                {/* Chart area */}
                <div className="relative w-full" style={{ height: "calc(100% - 20px)" }}>
                  <svg
                    className="absolute inset-0 w-full h-full overflow-visible"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {(() => {
                      const maxCount = Math.max(
                        ...scenarios.map((s) => s.liquidatableCount),
                        1
                      );
                      const points = scenarios.map((s, i) => {
                        const x = (i / (scenarios.length - 1)) * 100;
                        const y = 100 - (s.liquidatableCount / maxCount) * 100;
                        return { x, y };
                      });

                      const pathD = points
                        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                        .join(" ");

                      return (
                        <>
                          <defs>
                            <linearGradient
                              id="lineGradientRisk"
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="0%"
                            >
                              <stop offset="0%" stopColor="#f43f5e" />
                              <stop offset="60%" stopColor="#f43f5e" />
                              <stop offset="70%" stopColor="#64748b" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                          </defs>
                          <path
                            d={pathD}
                            fill="none"
                            stroke="url(#lineGradientRisk)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            style={{
                              filter: "drop-shadow(0 0 4px rgba(244,63,94,0.3))",
                            }}
                          />
                        </>
                      );
                    })()}
                  </svg>

                  {/* Dots */}
                  {(() => {
                    const maxCount = Math.max(
                      ...scenarios.map((s) => s.liquidatableCount),
                      1
                    );
                    return scenarios.map((scenario, i) => {
                      const xPct = (i / (scenarios.length - 1)) * 100;
                      const yPct = 100 - (scenario.liquidatableCount / maxCount) * 100;
                      const isSelected = scenario.priceChange === priceChangePct;

                      return (
                        <div
                          key={i}
                          className="absolute"
                          style={{
                            left: `${xPct}%`,
                            top: `${yPct}%`,
                            transform: "translate(-50%, -50%)",
                          }}
                        >
                          {isSelected && (
                            <span
                              className="absolute left-1/2 -translate-x-1/2 text-cyan-300 font-bold text-[11px] whitespace-nowrap"
                              style={{ bottom: "100%", marginBottom: 4 }}
                            >
                              {scenario.liquidatableCount}
                            </span>
                          )}
                          <button
                            onClick={() => setPriceChangePct(scenario.priceChange)}
                            className={`rounded-full transition-all ${
                              isSelected
                                ? "w-3 h-3 bg-cyan-400 ring-2 ring-cyan-400/50"
                                : scenario.priceChange < 0
                                  ? "w-2.5 h-2.5 bg-rose-400/60 hover:bg-rose-400"
                                  : scenario.priceChange > 0
                                    ? "w-2.5 h-2.5 bg-emerald-400/60 hover:bg-emerald-400"
                                    : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"
                            }`}
                            style={{
                              boxShadow: isSelected
                                ? "0 0 8px rgba(34,211,238,0.5)"
                                : undefined,
                            }}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-[9px] text-white/40 mt-1">
                  <span className="text-rose-400/70">-20%</span>
                  <span className="text-emerald-400/70">+10%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 flex items-center justify-center backdrop-blur-sm">
            <div className="text-center py-6">
              <div className="p-2 bg-white/5 rounded-lg inline-block mb-2">
                <AlertIcon size={20} variant="warning" />
              </div>
              <div className="text-sm text-white/50 font-medium">
                Price Shock Simulator
              </div>
              <p className="text-xs text-white/30 mt-1">
                Available when positions exist
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SUMMARY - Context-aware, not boilerplate
      ═══════════════════════════════════════════════════════════════════════ */}
      {totalPositions > 0 && (
        <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
          <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
            Risk Assessment
          </h4>
          <div className="text-sm text-white/70">
            {currentState.liquidatableCount > 0 ? (
              <p>
                <span className="text-rose-400 font-semibold">Immediate action needed:</span>{" "}
                {currentState.liquidatableCount} position{currentState.liquidatableCount > 1 ? "s" : ""}{" "}
                with {formatUsd(currentState.totalDebtAtRiskUsd)} debt can be liquidated now.
                Suppliers face bad debt risk if liquidations fail.
              </p>
            ) : distanceToLiquidation.priceDrop !== null &&
              Math.abs(distanceToLiquidation.priceDrop) < 10 ? (
              <p>
                <span className="text-amber-400 font-semibold">Monitor closely:</span>{" "}
                A {Math.abs(distanceToLiquidation.priceDrop).toFixed(1)}% {pool.asset} drop
                would trigger the first liquidation. Current market volatility may pose risk.
              </p>
            ) : (
              <p>
                <span className="text-emerald-400 font-semibold">Well-collateralized:</span>{" "}
                All positions have healthy collateral ratios.
                {distanceToLiquidation.priceDrop !== null && (
                  <> First liquidation requires a {Math.abs(distanceToLiquidation.priceDrop).toFixed(0)}%+ price move.</>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <p className="text-[10px] text-white/25 text-center">
        Updated{" "}
        {lastUpdated?.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }) || "—"}
      </p>
    </div>
  );
}
