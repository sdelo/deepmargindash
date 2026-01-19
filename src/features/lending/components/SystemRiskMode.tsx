import React from 'react';
import { type AtRiskPosition, type RiskDistributionBucket } from '../../../hooks/useAtRiskPositions';
import { StressCurveChart } from './StressCurveChart';

interface SystemRiskModeProps {
  positions: AtRiskPosition[];
  riskDistribution: RiskDistributionBucket[];
  liquidatableCount: number;
  atRiskCount: number;
  totalDebtAtRiskUsd: number;
  isLoading: boolean;
  lastUpdated: Date | null;
  onViewOpportunities: () => void;
}

type HistogramMode = 'count' | 'dollar';

/**
 * Calculate what price change would trigger the first liquidation
 */
function calculateDistanceToFirstLiquidation(
  positions: AtRiskPosition[]
): { priceDrop: number | null; priceIncrease: number | null } {
  let closestDropPct: number | null = null;
  let closestIncreasePct: number | null = null;

  positions.forEach((position) => {
    if (position.isLiquidatable) return;

    const threshold = position.liquidationThreshold;
    const collateral = position.baseAssetUsd + position.quoteAssetUsd;
    const debt = position.totalDebtUsd;

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
 * Find cliff point - where liquidations cascade (6x jump in debt at risk)
 */
function findCliffPoint(positions: AtRiskPosition[]): { shockPct: number; debtMultiplier: number } | null {
  if (positions.length === 0) return null;
  
  const points: { pct: number; debt: number }[] = [];
  
  for (let pct = 0; pct >= -50; pct -= 2) {
    let debtAtRisk = 0;
    positions.forEach((position) => {
      const basePriceMultiplier = 1 + pct / 100;
      const newBaseAssetUsd = position.baseAssetUsd * basePriceMultiplier;
      const newQuoteAssetUsd = position.quoteAssetUsd;
      const newBaseDebtUsd = position.baseDebtUsd * basePriceMultiplier;
      const newQuoteDebtUsd = position.quoteDebtUsd;
      const newCollateralValueUsd = newBaseAssetUsd + newQuoteAssetUsd;
      const newDebtValueUsd = newBaseDebtUsd + newQuoteDebtUsd;
      const newRiskRatio = newDebtValueUsd > 0 ? newCollateralValueUsd / newDebtValueUsd : 999;
      
      if (newRiskRatio <= position.liquidationThreshold) {
        debtAtRisk += newDebtValueUsd;
      }
    });
    points.push({ pct, debt: debtAtRisk });
  }
  
  // Find the biggest jump
  let maxJump = 0;
  let cliffPoint: { shockPct: number; debtMultiplier: number } | null = null;
  
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1].debt || 1;
    const curr = points[i].debt;
    const multiplier = curr / prev;
    
    if (multiplier > maxJump && multiplier >= 2) {
      maxJump = multiplier;
      cliffPoint = { shockPct: points[i].pct, debtMultiplier: multiplier };
    }
  }
  
  return cliffPoint;
}

/**
 * Get positions within a certain buffer percentage
 */
function getPositionsWithinBuffer(positions: AtRiskPosition[], bufferPct: number): {
  count: number;
  debtUsd: number;
  collateralUsd: number;
} {
  const filtered = positions.filter(p => !p.isLiquidatable && p.distanceToLiquidation <= bufferPct);
  return {
    count: filtered.length,
    debtUsd: filtered.reduce((sum, p) => sum + p.totalDebtUsd, 0),
    collateralUsd: filtered.reduce((sum, p) => sum + p.baseAssetUsd + p.quoteAssetUsd, 0),
  };
}

/**
 * Get liquidatable positions stats
 */
function getLiquidatableStats(positions: AtRiskPosition[]): {
  count: number;
  debtUsd: number;
  collateralUsd: number;
} {
  const filtered = positions.filter(p => p.isLiquidatable);
  return {
    count: filtered.length,
    debtUsd: filtered.reduce((sum, p) => sum + p.totalDebtUsd, 0),
    collateralUsd: filtered.reduce((sum, p) => sum + p.baseAssetUsd + p.quoteAssetUsd, 0),
  };
}

function formatUsd(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * Find the closest position to liquidation
 */
function findClosestPosition(positions: AtRiskPosition[]): AtRiskPosition | null {
  const nonLiquidatable = positions.filter(p => !p.isLiquidatable);
  if (nonLiquidatable.length === 0) return null;
  return nonLiquidatable.reduce((closest, p) => 
    p.distanceToLiquidation < closest.distanceToLiquidation ? p : closest
  );
}

/**
 * VerdictBlock - The meaning layer that answers "So what?"
 * This turns data into actionable conclusions.
 */
function VerdictBlock({
  positions,
  liquidatableCount,
  distanceToLiquidation,
  smallestBuffer,
  onViewOpportunities,
}: {
  positions: AtRiskPosition[];
  liquidatableCount: number;
  distanceToLiquidation: { priceDrop: number | null; priceIncrease: number | null };
  smallestBuffer: number | null;
  onViewOpportunities: () => void;
}) {
  const closestPosition = findClosestPosition(positions);
  const liquidatableStats = getLiquidatableStats(positions);
  
  // Generate the verdict text based on system state
  const getVerdictContent = () => {
    if (positions.length === 0) {
      return {
        headline: "No active positions to monitor",
        explanation: "The system has no borrowing activity. Liquidation risk is zero.",
        actionable: null,
      };
    }

    if (liquidatableCount > 0) {
      return {
        headline: `${liquidatableCount} position${liquidatableCount > 1 ? 's' : ''} can be liquidated now (${formatUsd(liquidatableStats.debtUsd)} debt)`,
        explanation: "Collateral value has fallen below the required threshold. These positions are profitable to liquidate.",
        actionable: "Go to Opportunities to execute liquidations →",
      };
    }

    const closestDrop = distanceToLiquidation.priceDrop;
    const dropRequired = closestDrop ? Math.abs(closestDrop) : null;

    if (dropRequired && dropRequired < 10) {
      return {
        headline: `First liquidation at ${dropRequired.toFixed(0)}% price drop`,
        explanation: `A relatively small market move could trigger liquidations. The closest position has only a ${smallestBuffer?.toFixed(0)}% buffer.`,
        actionable: "Monitor closely during volatile periods.",
      };
    }

    if (dropRequired && dropRequired < 20) {
      return {
        headline: `Moderate risk: ${dropRequired.toFixed(0)}% price drop triggers liquidations`,
        explanation: `Positions are reasonably healthy, but a significant market correction could create opportunities.`,
        actionable: closestPosition 
          ? `Closest: ${closestPosition.baseAssetSymbol}/${closestPosition.quoteAssetSymbol} with ${smallestBuffer?.toFixed(0)}% buffer`
          : null,
      };
    }

    return {
      headline: "No liquidation risk under normal volatility",
      explanation: dropRequired 
        ? `A ≥${dropRequired.toFixed(0)}% price drop would be required to create any liquidations.`
        : "All positions are well-collateralized with healthy buffers.",
      actionable: closestPosition 
        ? `Closest position: ${smallestBuffer?.toFixed(0)}% buffer (${closestPosition.baseAssetSymbol}/${closestPosition.quoteAssetSymbol})`
        : null,
    };
  };

  const verdict = getVerdictContent();

  return (
    <div className="bg-slate-800/40 rounded-xl border border-white/[0.06] p-5">
      <div className="flex items-start gap-4">
        {/* Verdict icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          liquidatableCount > 0 
            ? 'bg-rose-500/20' 
            : smallestBuffer !== null && smallestBuffer < 15 
              ? 'bg-amber-500/20' 
              : 'bg-emerald-500/20'
        }`}>
          {liquidatableCount > 0 ? (
            <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ) : smallestBuffer !== null && smallestBuffer < 15 ? (
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* Verdict content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Verdict</span>
          </div>
          <h4 className="text-base font-semibold text-white leading-snug">
            {verdict.headline}
          </h4>
          <p className="text-sm text-white/60 mt-1 leading-relaxed">
            {verdict.explanation}
          </p>
          {verdict.actionable && liquidatableCount > 0 && (
            <button 
              onClick={onViewOpportunities}
              className="text-xs text-teal-400 hover:text-teal-300 mt-2 font-medium transition-colors"
            >
              {verdict.actionable}
            </button>
          )}
          {verdict.actionable && liquidatableCount === 0 && (
            <p className="text-xs text-white/40 mt-2 font-medium">
              {verdict.actionable}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * System Risk Mode - "Is the system safe right now?"
 * Single scroll page combining Overview + Analytics
 */
export function SystemRiskMode({
  positions,
  riskDistribution,
  liquidatableCount,
  atRiskCount,
  totalDebtAtRiskUsd,
  isLoading,
  lastUpdated,
  onViewOpportunities,
}: SystemRiskModeProps) {
  const [histogramMode, setHistogramMode] = React.useState<HistogramMode>('count');
  
  const distanceToLiquidation = React.useMemo(
    () => calculateDistanceToFirstLiquidation(positions),
    [positions]
  );

  // Find smallest buffer for summary
  const smallestBuffer = React.useMemo(() => {
    const nonLiquidatable = positions.filter(p => !p.isLiquidatable);
    if (nonLiquidatable.length === 0) return null;
    return Math.min(...nonLiquidatable.map(p => p.distanceToLiquidation));
  }, [positions]);

  // Calculate hero metrics
  const liquidatableStats = React.useMemo(() => getLiquidatableStats(positions), [positions]);
  const within10pct = React.useMemo(() => getPositionsWithinBuffer(positions, 10), [positions]);
  const cliffPoint = React.useMemo(() => findCliffPoint(positions), [positions]);

  const maxCount = Math.max(...riskDistribution.map(b => b.count), 1);
  const maxDebt = Math.max(...riskDistribution.map(b => b.totalDebtUsd), 1);

  // Determine system status
  const systemStatus = liquidatableCount > 0 
    ? 'critical' 
    : smallestBuffer !== null && smallestBuffer < 10 
      ? 'stressed' 
      : 'healthy';

  if (isLoading && positions.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="h-20 bg-white/[0.03] rounded-xl animate-pulse" />
        <div className="h-64 bg-white/[0.03] rounded-xl animate-pulse" />
        <div className="h-80 bg-white/[0.03] rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          HERO SUMMARY STRIP - 1 line: Liquidatable, Debt within 10%, Cliff, Smallest buffer
      ═══════════════════════════════════════════════════════════════════ */}
      <div
        className={`rounded-xl overflow-hidden ${
          systemStatus === 'healthy'
            ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20'
            : systemStatus === 'stressed'
              ? 'bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20'
              : 'bg-gradient-to-r from-rose-500/10 to-rose-500/5 border border-rose-500/20'
        }`}
      >
        <div className="px-5 py-4">
          {/* Status Badge + Title Row */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${
                systemStatus === 'healthy'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                  : systemStatus === 'stressed'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
              }`}
            >
              {systemStatus === 'healthy' ? 'Healthy' : systemStatus === 'stressed' ? 'Stressed' : 'Critical'}
            </div>
            <span className="text-sm text-white/50">
              {positions.length} active position{positions.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Hero Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Liquidatable Now */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Liquidatable Now</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${liquidatableCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {liquidatableCount}
                </span>
                <span className="text-sm text-white/50">positions</span>
              </div>
              <div className={`text-xs mt-1 tabular-nums ${liquidatableCount > 0 ? 'text-rose-300' : 'text-white/30'}`}>
                {formatUsd(liquidatableStats.debtUsd)} debt
              </div>
            </div>
            
            {/* Debt Within 10% */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Within 10% Buffer</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${within10pct.count > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {within10pct.count}
                </span>
                <span className="text-sm text-white/50">positions</span>
              </div>
              <div className={`text-xs mt-1 tabular-nums ${within10pct.count > 0 ? 'text-amber-300' : 'text-white/30'}`}>
                {formatUsd(within10pct.debtUsd)} debt
              </div>
            </div>
            
            {/* Cliff Point */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Cascade Cliff</div>
              {cliffPoint ? (
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold tabular-nums text-amber-400">
                      {Math.abs(cliffPoint.shockPct)}%
                    </span>
                    <span className="text-sm text-white/50">drop</span>
                  </div>
                  <div className="text-xs mt-1 text-amber-300 tabular-nums">
                    {cliffPoint.debtMultiplier.toFixed(1)}× debt jump
                  </div>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-white/30">—</div>
                  <div className="text-xs mt-1 text-white/30">No cascade risk</div>
                </>
              )}
            </div>
            
            {/* Smallest Buffer */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Smallest Buffer</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-bold tabular-nums ${
                  smallestBuffer === null ? 'text-white/30' :
                  smallestBuffer < 5 ? 'text-rose-400' :
                  smallestBuffer < 15 ? 'text-amber-400' :
                  'text-emerald-400'
                }`}>
                  {smallestBuffer !== null ? `${smallestBuffer.toFixed(0)}%` : '—'}
                </span>
              </div>
              <div className="text-xs mt-1 text-white/30">
                {smallestBuffer !== null ? 'until liquidation' : 'No positions'}
              </div>
            </div>
          </div>
          
          {/* CTA if liquidatable */}
          {liquidatableCount > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button
                onClick={onViewOpportunities}
                className="w-full px-4 py-3 text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white rounded-lg transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                View {liquidatableCount} Liquidation Opportunit{liquidatableCount > 1 ? 'ies' : 'y'} ({formatUsd(liquidatableStats.debtUsd)})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          VERDICT BLOCK - Plain-language conclusion (THE MEANING LAYER)
      ═══════════════════════════════════════════════════════════════════ */}
      <VerdictBlock
        positions={positions}
        liquidatableCount={liquidatableCount}
        distanceToLiquidation={distanceToLiquidation}
        smallestBuffer={smallestBuffer}
        onViewOpportunities={onViewOpportunities}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          RISK DISTRIBUTION - Histogram with Count ↔ $ toggle
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Risk Distribution</h3>
            <p className="text-xs text-white/40 mt-0.5">
              {positions.length} total positions · Click a bucket to filter
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Count ↔ $ Toggle */}
            <div className="flex bg-white/10 rounded-lg p-0.5">
              <button
                onClick={() => setHistogramMode('count')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  histogramMode === 'count' 
                    ? 'bg-teal-500 text-slate-900' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Count
              </button>
              <button
                onClick={() => setHistogramMode('dollar')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  histogramMode === 'dollar' 
                    ? 'bg-teal-500 text-slate-900' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                $ Debt
              </button>
            </div>
            {/* Legend */}
            <div className="hidden sm:flex items-center gap-3 text-xs ml-4">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-white/50">Liquidatable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-white/50">Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-white/50">Healthy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Histogram Bars */}
        <div className="flex items-end gap-1 h-32">
          {riskDistribution.map((bucket, idx) => {
            const value = histogramMode === 'count' ? bucket.count : bucket.totalDebtUsd;
            const maxValue = histogramMode === 'count' ? maxCount : maxDebt;
            const heightPct = value > 0 ? Math.max((value / maxValue) * 100, 8) : 4;
            
            return (
              <button
                key={idx}
                onClick={onViewOpportunities}
                className="flex-1 group relative h-full flex flex-col justify-end"
                title={`${bucket.count} positions · ${formatUsd(bucket.totalDebtUsd)} · ${bucket.label}`}
              >
                <div
                  className="w-full rounded-t transition-all group-hover:opacity-80"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: bucket.color,
                    minHeight: value > 0 ? '6px' : '3px',
                  }}
                />
                {/* Hover tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <div className="bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-[10px] whitespace-nowrap shadow-xl">
                    <div className="font-semibold text-white">{bucket.count} positions</div>
                    <div className="text-teal-400">{formatUsd(bucket.totalDebtUsd)} debt</div>
                    <div className="text-white/60 mt-1">{bucket.label}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* X-axis Labels (bucket ranges) */}
        <div className="flex gap-1 mt-2">
          {riskDistribution.map((bucket, idx) => (
            <div key={idx} className="flex-1 text-center text-[10px] text-white/50 font-mono">
              {bucket.label}
            </div>
          ))}
        </div>
        
        {/* Y-axis label */}
        <div className="flex justify-between mt-2 text-[9px] text-white/30">
          <span>Showing: {histogramMode === 'count' ? 'Position count' : 'Debt value ($)'}</span>
          <span>Max: {histogramMode === 'count' ? maxCount : formatUsd(maxDebt)}</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STRESS CURVE - Signature visual: "How steep is the cliff?"
      ═══════════════════════════════════════════════════════════════════ */}
      <StressCurveChart
        positions={positions}
        isLoading={isLoading}
      />

      {/* Timestamp */}
      {lastUpdated && (
        <p className="text-[10px] text-white/25 text-center">
          Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {' · '}
          <button onClick={onViewOpportunities} className="hover:text-white/50 transition-colors">
            View all positions →
          </button>
        </p>
      )}
    </div>
  );
}
