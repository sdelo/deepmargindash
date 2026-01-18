import React from 'react';
import { useAtRiskPositions, useRiskDistribution } from '../../../hooks/useAtRiskPositions';
import { ChartIcon, AlertIcon } from '../../../components/ThemedIcons';
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import type { PoolOverview } from '../types';

interface PoolRiskOutlookProps {
  pool: PoolOverview;
  onSelectTab?: (tab: string) => void;
}

interface SimulationResult {
  priceChange: number;
  newLiquidatableCount: number;
  newAtRiskCount: number;
  totalNewDebtAtRiskUsd: number;
  positionsAffected: number;
}

/**
 * Calculate what price change would trigger the first liquidation
 */
function calculateDistanceToFirstLiquidation(
  positions: ReturnType<typeof useAtRiskPositions>['positions']
): { priceDrop: number | null; priceIncrease: number | null } {
  let closestDropPct: number | null = null;
  let closestIncreasePct: number | null = null;

  positions.forEach(position => {
    if (position.isLiquidatable) return;

    const threshold = position.liquidationThreshold;
    const collateral = position.collateralValueUsd;
    const debt = position.debtValueUsd;
    
    if (debt === 0) return;

    const netBaseExposure = position.baseAssetUsd - position.baseDebtUsd;

    if (Math.abs(netBaseExposure) > 0.01) {
      const targetCollateral = threshold * debt;
      const changeNeeded = (targetCollateral - collateral) / netBaseExposure;
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
 * Simulate what happens to positions if prices change
 */
function simulatePositionsWithPriceChange(
  positions: ReturnType<typeof useAtRiskPositions>['positions'],
  basePriceChangePct: number
): SimulationResult {
  let newLiquidatableCount = 0;
  let newAtRiskCount = 0;
  let totalNewDebtAtRiskUsd = 0;
  let positionsAffected = 0;

  positions.forEach(position => {
    const basePriceMultiplier = 1 + (basePriceChangePct / 100);
    
    const newBaseAssetUsd = position.baseAssetUsd * basePriceMultiplier;
    const newQuoteAssetUsd = position.quoteAssetUsd;
    const newBaseDebtUsd = position.baseDebtUsd * basePriceMultiplier;
    const newQuoteDebtUsd = position.quoteDebtUsd;
    
    const newCollateralValueUsd = newBaseAssetUsd + newQuoteAssetUsd;
    const newDebtValueUsd = newBaseDebtUsd + newQuoteDebtUsd;
    
    const newRiskRatio = newDebtValueUsd > 0 
      ? newCollateralValueUsd / newDebtValueUsd 
      : 999;
    
    const wasLiquidatable = position.isLiquidatable;
    const isNowLiquidatable = newRiskRatio <= position.liquidationThreshold;
    
    if (!wasLiquidatable && isNowLiquidatable) {
      positionsAffected++;
    }
    
    if (isNowLiquidatable) {
      newLiquidatableCount++;
      totalNewDebtAtRiskUsd += newDebtValueUsd;
    }
    
    const atRiskThreshold = position.liquidationThreshold * 1.2;
    if (newRiskRatio <= atRiskThreshold) {
      newAtRiskCount++;
    }
  });

  return {
    priceChange: basePriceChangePct,
    newLiquidatableCount,
    newAtRiskCount,
    totalNewDebtAtRiskUsd,
    positionsAffected,
  };
}

function formatUsd(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * Determine pool health verdict based on risk metrics
 */
function getPoolVerdict(
  distanceToLiquidation: { priceDrop: number | null; priceIncrease: number | null },
  liquidatableCount: number,
  atRiskCount: number,
  totalPositions: number
): { verdict: 'robust' | 'watch' | 'fragile'; label: string } {
  if (liquidatableCount > 0) {
    return { verdict: 'fragile', label: 'Fragile' };
  }

  if (totalPositions === 0) {
    return { verdict: 'robust', label: 'Robust' };
  }

  const closestDrop = distanceToLiquidation.priceDrop;
  const closestIncrease = distanceToLiquidation.priceIncrease;
  const closestMove = Math.min(
    closestDrop ? Math.abs(closestDrop) : 999,
    closestIncrease ? Math.abs(closestIncrease) : 999
  );

  if (closestMove < 5) {
    return { verdict: 'fragile', label: 'Fragile' };
  }

  if (closestMove < 15 || atRiskCount > totalPositions * 0.3) {
    return { verdict: 'watch', label: 'Watch' };
  }

  return { verdict: 'robust', label: 'Robust' };
}

/**
 * Pool-specific forward-looking risk outlook
 */
export function PoolRiskOutlook({ pool, onSelectTab }: PoolRiskOutlookProps) {
  const [priceChangePct, setPriceChangePct] = React.useState(-10);
  const [showShortExplainer, setShowShortExplainer] = React.useState(false);
  const [showInsights, setShowInsights] = React.useState(false);
  
  const baseMarginPoolId = pool.contracts?.marginPoolId;
  
  const {
    positions: allPositions,
    isLoading,
    error,
    lastUpdated,
  } = useAtRiskPositions();
  
  const poolPositions = React.useMemo(() => {
    if (!baseMarginPoolId) return allPositions;
    return allPositions.filter(p => 
      p.baseMarginPoolId === baseMarginPoolId || 
      p.quoteMarginPoolId === baseMarginPoolId
    );
  }, [allPositions, baseMarginPoolId]);
  
  // Use raw distribution for HF buckets
  const riskDistribution = useRiskDistribution(poolPositions);
  
  const distanceToLiquidation = React.useMemo(() => 
    calculateDistanceToFirstLiquidation(poolPositions),
    [poolPositions]
  );
  
  // CANONICAL: Use simulation at 0% as the single source of truth
  const currentState = React.useMemo(() => 
    simulatePositionsWithPriceChange(poolPositions, 0),
    [poolPositions]
  );
  
  const simulatedState = React.useMemo(() =>
    simulatePositionsWithPriceChange(poolPositions, priceChangePct),
    [poolPositions, priceChangePct]
  );

  const scenarios = React.useMemo(() => {
    const changes = [-20, -15, -10, -5, 0, 5, 10];
    return changes.map(change => simulatePositionsWithPriceChange(poolPositions, change));
  }, [poolPositions]);
  
  const totalPositions = poolPositions.length;
  
  // Canonical metrics from currentState
  const liquidatableNow = currentState.newLiquidatableCount;
  const criticalCount = currentState.newAtRiskCount - liquidatableNow; // positions near threshold but not liquidatable
  const debtAtRisk = currentState.totalNewDebtAtRiskUsd;
  
  const verdict = React.useMemo(() => 
    getPoolVerdict(distanceToLiquidation, liquidatableNow, currentState.newAtRiskCount, totalPositions),
    [distanceToLiquidation, liquidatableNow, currentState.newAtRiskCount, totalPositions]
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
        <p className="text-rose-400 text-xs">Error loading risk data: {error.message}</p>
      </div>
    );
  }

  // Deltas for price shock display
  const liquidatableDelta = simulatedState.newLiquidatableCount - liquidatableNow;
  const debtDelta = simulatedState.totalNewDebtAtRiskUsd - debtAtRisk;

  return (
    <div className="space-y-3">
      {/* ═══════════════════════════════════════════════════════════════════════
          RISK SUMMARY STRIP - Compact, denser padding
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="surface-tier-1 rounded-lg px-3 py-2 flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Status pill + quick summary */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
            verdict.verdict === 'robust' 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : verdict.verdict === 'watch'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {verdict.label}
          </span>
          {liquidatableNow > 0 ? (
            <span className="text-xs text-white/70">
              <span className="font-semibold text-rose-400">{liquidatableNow}</span> liquidatable now
            </span>
          ) : totalPositions > 0 && distanceToLiquidation.priceDrop !== null ? (
            <span className="text-xs text-white/60">
              First liq at <span className="font-medium text-white">{Math.abs(distanceToLiquidation.priceDrop).toFixed(0)}%</span>
            </span>
          ) : null}
        </div>

        {/* Center: Inline KPIs */}
        <div className="flex items-center gap-3 text-[10px] text-white/50">
          <span>
            Positions: <span className="font-medium text-white">{totalPositions}</span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Liquidatable: <span className={`font-medium ${liquidatableNow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{liquidatableNow}</span>
          </span>
          <span className="text-white/20">·</span>
          <span>
            Debt at risk: <span className="font-medium text-white">{formatUsd(debtAtRisk)}</span>
          </span>
        </div>

        {/* Right: CTA */}
        {liquidatableNow > 0 && onSelectTab && (
          <button
            onClick={() => onSelectTab('liquidations')}
            className="px-2 py-1 text-[10px] font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded transition-colors"
          >
            View positions →
          </button>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TWO-COLUMN GRID - Reduced gap
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        
        {/* LEFT: HEALTH FACTOR DISTRIBUTION */}
        <div className="surface-tier-1 rounded-lg p-3">
          {/* Header with tooltip */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ChartIcon size={14} className="text-cyan-400" />
              <h3 className="text-xs font-semibold text-white">Health Factor Distribution</h3>
              <div className="relative group">
                <QuestionMarkCircleIcon className="w-3.5 h-3.5 text-white/30 hover:text-white/50 cursor-help" />
                <div className="absolute left-0 bottom-full mb-1 w-40 p-2 bg-slate-800 border border-white/10 rounded text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Lower HF = closer to liquidation. HF &lt; 1.0 is liquidatable.
                </div>
              </div>
            </div>
            <span className="text-[10px] text-white/40">{totalPositions} positions</span>
          </div>

          {totalPositions === 0 ? (
            <div className="text-center py-4">
              <div className="text-emerald-400 text-xs font-medium">✓ No Active Borrowers</div>
              <p className="text-[10px] text-white/40 mt-0.5">No counterparty risk</p>
            </div>
          ) : (
            <>
              {/* Inline stats - using CANONICAL values */}
              <div className="flex items-center gap-3 text-[10px] mb-2 pb-2 border-b border-white/[0.03]">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${liquidatableNow > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  <span className="text-white/50">Liquidatable:</span>
                  <span className={`font-medium ${liquidatableNow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>{liquidatableNow}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-white/50">Critical:</span>
                  <span className="font-medium text-amber-400">{criticalCount}</span>
                </span>
              </div>

              {/* Histogram - only show non-zero buckets */}
              <div className="space-y-1">
                {riskDistribution.map((bucket, idx) => {
                  if (bucket.count === 0) return null;
                  
                  const maxBucketCount = Math.max(...riskDistribution.map(b => b.count), 1);
                  const widthPct = (bucket.count / maxBucketCount) * 100;
                  
                  return (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px]">
                      <span className="w-12 text-white/40 font-mono text-right">{bucket.label}</span>
                      <div className="flex-1 h-2 bg-white/[0.03] rounded-sm overflow-hidden">
                        <div 
                          className="h-full rounded-sm transition-all" 
                          style={{ 
                            width: `${widthPct}%`,
                            backgroundColor: bucket.color,
                            minWidth: '4px'
                          }} 
                        />
                      </div>
                      <span className="w-4 text-right text-white/60 font-medium">{bucket.count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: PRICE SHOCK */}
        {totalPositions > 0 ? (
          <div className="surface-tier-1 rounded-lg p-3">
            {/* Header with info icon tooltip */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <AlertIcon size={14} variant="warning" />
                <h3 className="text-xs font-semibold text-white">Price Shock</h3>
                <div className="relative group">
                  <QuestionMarkCircleIcon className="w-3.5 h-3.5 text-white/30 hover:text-white/50 cursor-help" />
                  <div className="absolute left-0 bottom-full mb-1 w-44 p-2 bg-slate-800 border border-white/10 rounded text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    Price ↑ hurts shorts and {pool.asset} borrowers. Both directions can trigger liquidations.
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-white/40">
                {pool.asset} price Δ
              </span>
            </div>

            {/* Short explainer - toggled by state */}
            {showShortExplainer && (
              <div className="mb-2 p-2 bg-cyan-500/10 rounded text-[10px] text-white/60 border border-cyan-500/20">
                <span className="font-medium text-cyan-300">💡</span> Price increases hurt short positions and {pool.asset} borrowers.
              </div>
            )}

            {/* Price shock pills - tighter */}
            <div className="flex items-center justify-center gap-0.5 mb-2">
              {[-20, -15, -10, -5, 0, 5, 10].map(change => (
                <button
                  key={change}
                  onClick={() => setPriceChangePct(change)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-semibold transition-all ${
                    priceChangePct === change
                      ? 'bg-cyan-500 text-slate-900'
                      : change < 0 
                        ? 'bg-rose-500/10 text-rose-300/70 hover:bg-rose-500/20'
                        : change > 0 
                          ? 'bg-emerald-500/10 text-emerald-300/70 hover:bg-emerald-500/20'
                          : 'bg-white/10 text-white/40 hover:bg-white/20'
                  }`}
                >
                  {change > 0 ? '+' : ''}{change}%
                </button>
              ))}
            </div>

            {/* Single-line result with delta always shown */}
            <div className="bg-white/[0.03] rounded px-2 py-1.5 mb-2">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-white/40">
                  At <span className="font-medium text-white">{priceChangePct > 0 ? '+' : ''}{priceChangePct}%</span>:
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="text-white/50">Liq</span>
                    <span className={`font-bold ${simulatedState.newLiquidatableCount > liquidatableNow ? 'text-rose-400' : 'text-white'}`}>
                      {simulatedState.newLiquidatableCount}
                    </span>
                    <span className={`text-[9px] ${liquidatableDelta > 0 ? 'text-rose-400' : liquidatableDelta < 0 ? 'text-emerald-400' : 'text-white/30'}`}>
                      ({liquidatableDelta >= 0 ? '+' : ''}{liquidatableDelta})
                    </span>
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="flex items-center gap-1">
                    <span className="text-white/50">Debt</span>
                    <span className={`font-bold ${simulatedState.totalNewDebtAtRiskUsd > debtAtRisk ? 'text-amber-400' : 'text-white'}`}>
                      {formatUsd(simulatedState.totalNewDebtAtRiskUsd)}
                    </span>
                    {debtDelta !== 0 && (
                      <span className={`text-[9px] ${debtDelta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ({debtDelta >= 0 ? '+' : ''}{formatUsd(debtDelta)})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Compact line chart */}
            <div className="relative h-14">
              <div className="absolute left-0 top-0 bottom-3 w-5 flex flex-col justify-between text-[8px] text-white/25">
                <span>{Math.max(...scenarios.map(s => s.newLiquidatableCount))}</span>
                <span>0</span>
              </div>
              
              <div className="ml-6 h-full relative">
                {/* Lighter grid lines */}
                <div className="absolute inset-x-0 top-0 h-px bg-white/[0.03]" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/[0.03]" />
                <div className="absolute inset-x-0 bottom-3 h-px bg-white/[0.06]" />
                
                {/* Zero reference */}
                <div className="absolute bottom-3 h-11" style={{ left: 'calc((4/6) * 100%)' }}>
                  <div className="w-px h-full bg-white/10" />
                </div>

                <svg className="w-full h-11 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {(() => {
                    const maxCount = Math.max(...scenarios.map(s => s.newLiquidatableCount), 1);
                    const points = scenarios.map((s, i) => {
                      const x = (i / (scenarios.length - 1)) * 100;
                      const y = 100 - (s.newLiquidatableCount / maxCount) * 100;
                      return { x, y, scenario: s };
                    });
                    
                    const pathD = points.map((p, i) => 
                      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                    ).join(' ');

                    return (
                      <>
                        <path
                          d={pathD}
                          fill="none"
                          stroke="url(#lineGradientRisk)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                        
                        <defs>
                          <linearGradient id="lineGradientRisk" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#f43f5e" />
                            <stop offset="60%" stopColor="#f43f5e" />
                            <stop offset="70%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>

                        {points.map((p, i) => {
                          const isSelected = scenarios[i].priceChange === priceChangePct;
                          return (
                            <g key={i}>
                              <circle
                                cx={p.x}
                                cy={p.y}
                                r={isSelected ? 5 : 3}
                                className={`cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'fill-cyan-400 stroke-cyan-400/50' 
                                    : p.scenario.priceChange < 0 
                                      ? 'fill-rose-400/50 hover:fill-rose-400' 
                                      : p.scenario.priceChange > 0
                                        ? 'fill-emerald-400/50 hover:fill-emerald-400'
                                        : 'fill-white/30 hover:fill-white/60'
                                }`}
                                strokeWidth={isSelected ? 2 : 0}
                                onClick={() => setPriceChangePct(p.scenario.priceChange)}
                              />
                              {isSelected && (
                                <text
                                  x={p.x}
                                  y={Math.max(p.y - 12, 8)}
                                  textAnchor="middle"
                                  className="fill-cyan-300 font-semibold"
                                  style={{ fontSize: '10px' }}
                                >
                                  {p.scenario.newLiquidatableCount}
                                </text>
                              )}
                            </g>
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>

                <div className="flex justify-between text-[8px] text-white/30 mt-0.5">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+10%</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-tier-1 rounded-lg p-3 flex items-center justify-center">
            <div className="text-center py-3">
              <div className="text-xs text-white/40">Price Shock</div>
              <p className="text-[10px] text-white/25">Available when positions exist</p>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          WHAT THIS TELLS YOU - Collapsible, compact
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="surface-tier-1 rounded-lg overflow-hidden">
        <button
          onClick={() => setShowInsights(!showInsights)}
          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
        >
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">
            What This Tells You
          </span>
          <svg 
            className={`w-3.5 h-3.5 text-white/30 transition-transform ${showInsights ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showInsights && (
          <div className="px-3 pb-3 pt-0.5 border-t border-white/[0.03]">
            <ul className="space-y-1.5 text-[10px] text-white/50">
              <li className="flex gap-1.5">
                <span className="text-white/25">•</span>
                <span>
                  <span className="text-white/70 font-medium">Bad Debt:</span>{' '}
                  {liquidatableNow > 0 
                    ? 'Active risk. Suppliers may absorb losses if liquidations fail.'
                    : 'No positions liquidatable. Pool has safety buffer.'}
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-white/25">•</span>
                <span>
                  <span className="text-white/70 font-medium">Sensitivity:</span>{' '}
                  {distanceToLiquidation.priceDrop !== null && Math.abs(distanceToLiquidation.priceDrop) < 15
                    ? `${Math.abs(distanceToLiquidation.priceDrop).toFixed(0)}% move triggers liquidations. Monitor volatility.`
                    : 'Well-collateralized. Can absorb significant swings.'}
                </span>
              </li>
              <li className="flex gap-1.5">
                <span className="text-white/25">•</span>
                <span>
                  <span className="text-white/70 font-medium">Suppliers:</span>{' '}
                  {verdict.verdict === 'fragile'
                    ? 'Consider reducing exposure until pool stabilizes.'
                    : 'Strong protection against borrower defaults.'}
                </span>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Timestamp - minimal */}
      <p className="text-[8px] text-white/15 text-center">
        Updated {lastUpdated?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '—'}
      </p>
    </div>
  );
}
