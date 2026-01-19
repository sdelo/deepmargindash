import React from 'react';
import { type AtRiskPosition } from '../../../hooks/useAtRiskPositions';
import { TransactionDetailsModal } from '../../../components/TransactionButton/TransactionDetailsModal';
import { PositionHistoryModal } from './PositionHistoryModal';
import { PositionDetailDrawer } from './PositionDetailDrawer';
import { ProximityLadder } from './ProximityLadder';
import { CONTRACTS } from '../../../config/contracts';
import { useSuiClientContext } from '@mysten/dapp-kit';

interface OpportunitiesModeProps {
  positions: AtRiskPosition[];
  isLoading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

type FilterMode = 'liquidatable' | 'critical' | 'watch' | 'all';

/**
 * Format relative time (e.g., "12s ago", "2m ago")
 */
function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

/**
 * Format address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Format USD value
 */
function formatUsd(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}

/**
 * Calculate estimated net profit for a position
 */
function calculateNetProfit(position: AtRiskPosition): number {
  const grossReward = position.estimatedRewardUsd;
  const estimatedGasCost = 0.50; // ~$0.50 in gas on SUI
  const estimatedSlippage = position.totalDebtUsd * 0.003; // ~0.3% slippage estimate
  return grossReward - estimatedGasCost - estimatedSlippage;
}

/**
 * Get confidence level for a position
 */
function getConfidenceLevel(position: AtRiskPosition): { level: 'high' | 'medium' | 'low'; label: string; color: string } {
  // Based on position size, oracle freshness, and buffer
  const netProfit = calculateNetProfit(position);
  
  if (!position.isLiquidatable) {
    return { level: 'low', label: 'Not liquidatable', color: 'text-white/40' };
  }
  
  if (netProfit > 10) {
    return { level: 'high', label: 'High confidence', color: 'text-emerald-400' };
  }
  
  if (netProfit > 0) {
    return { level: 'medium', label: 'Medium confidence', color: 'text-amber-400' };
  }
  
  return { level: 'low', label: 'Low/negative profit', color: 'text-rose-400' };
}

/**
 * Best 3 Cards - Show the most actionable opportunities
 */
function BestOpportunitiesCards({
  positions,
  onSelect,
}: {
  positions: AtRiskPosition[];
  onSelect: (position: AtRiskPosition) => void;
}) {
  // Find best by different criteria
  const liquidatablePositions = positions.filter(p => p.isLiquidatable);
  
  // Best by net profit
  const bestProfit = liquidatablePositions.length > 0
    ? [...liquidatablePositions].sort((a, b) => calculateNetProfit(b) - calculateNetProfit(a))[0]
    : null;
  
  // Closest to liquidation (non-liquidatable)
  const nonLiquidatable = positions.filter(p => !p.isLiquidatable);
  const closestToLiq = nonLiquidatable.length > 0
    ? [...nonLiquidatable].sort((a, b) => a.distanceToLiquidation - b.distanceToLiquidation)[0]
    : null;
  
  // Largest repay cap (biggest debt that can be liquidated)
  const largestRepay = liquidatablePositions.length > 0
    ? [...liquidatablePositions].sort((a, b) => b.totalDebtUsd - a.totalDebtUsd)[0]
    : null;

  if (!bestProfit && !closestToLiq && !largestRepay) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
      {/* Best Net Profit */}
      <button
        onClick={() => bestProfit && onSelect(bestProfit)}
        disabled={!bestProfit}
        className={`p-4 rounded-xl border text-left transition-all ${
          bestProfit 
            ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer' 
            : 'bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bestProfit ? 'bg-emerald-500/20' : 'bg-white/10'}`}>
            <svg className={`w-4 h-4 ${bestProfit ? 'text-emerald-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Best Net Profit</span>
        </div>
        {bestProfit ? (
          <>
            <div className="text-xl font-bold text-emerald-400 tabular-nums">
              +{formatUsd(calculateNetProfit(bestProfit))}
            </div>
            <div className="text-xs text-white/50 mt-1 truncate">
              {bestProfit.baseAssetSymbol}/{bestProfit.quoteAssetSymbol} · {formatUsd(bestProfit.totalDebtUsd)} debt
            </div>
          </>
        ) : (
          <div className="text-sm text-white/30">No liquidatable positions</div>
        )}
      </button>

      {/* Closest to Liquidation */}
      <button
        onClick={() => closestToLiq && onSelect(closestToLiq)}
        disabled={!closestToLiq}
        className={`p-4 rounded-xl border text-left transition-all ${
          closestToLiq 
            ? 'bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer' 
            : 'bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${closestToLiq ? 'bg-amber-500/20' : 'bg-white/10'}`}>
            <svg className={`w-4 h-4 ${closestToLiq ? 'text-amber-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Closest to Liq</span>
        </div>
        {closestToLiq ? (
          <>
            <div className="text-xl font-bold text-amber-400 tabular-nums">
              {closestToLiq.distanceToLiquidation.toFixed(1)}% buffer
            </div>
            <div className="text-xs text-white/50 mt-1 truncate">
              {closestToLiq.baseAssetSymbol}/{closestToLiq.quoteAssetSymbol} · {formatUsd(closestToLiq.totalDebtUsd)} debt
            </div>
          </>
        ) : (
          <div className="text-sm text-white/30">No positions to watch</div>
        )}
      </button>

      {/* Largest Repay Cap */}
      <button
        onClick={() => largestRepay && onSelect(largestRepay)}
        disabled={!largestRepay}
        className={`p-4 rounded-xl border text-left transition-all ${
          largestRepay 
            ? 'bg-cyan-500/10 border-cyan-500/30 hover:bg-cyan-500/20 cursor-pointer' 
            : 'bg-white/[0.02] border-white/[0.06] opacity-50 cursor-not-allowed'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${largestRepay ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
            <svg className={`w-4 h-4 ${largestRepay ? 'text-cyan-400' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">Largest Repay</span>
        </div>
        {largestRepay ? (
          <>
            <div className="text-xl font-bold text-cyan-400 tabular-nums">
              {formatUsd(largestRepay.totalDebtUsd)}
            </div>
            <div className="text-xs text-white/50 mt-1 truncate">
              {largestRepay.baseAssetSymbol}/{largestRepay.quoteAssetSymbol} · +{formatUsd(calculateNetProfit(largestRepay))} est. profit
            </div>
          </>
        ) : (
          <div className="text-sm text-white/30">No liquidatable positions</div>
        )}
      </button>
    </div>
  );
}

/**
 * Setup State - Shown when there are no opportunities, with actionable next steps
 */
function SetupStateCard({
  type,
  onRefresh,
}: {
  type: 'no-liquidatable' | 'no-positions' | 'all-healthy';
  onRefresh: () => void;
}) {
  const content = {
    'no-liquidatable': {
      icon: (
        <svg className="w-10 h-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: "No Liquidation Opportunities",
      description: "All positions are above the liquidation threshold. Monitor the closest positions for changes.",
      actions: [
        { label: "Set up price alerts", description: "Get notified when positions approach liquidation", disabled: true },
        { label: "Configure bot mode", description: "Auto-execute liquidations when they appear", disabled: true },
      ],
    },
    'no-positions': {
      icon: (
        <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 12H4" />
        </svg>
      ),
      title: "No Active Positions",
      description: "There are no borrowing positions in the system to monitor or liquidate.",
      actions: [
        { label: "Check back later", description: "Positions will appear when users borrow", disabled: true },
      ],
    },
    'all-healthy': {
      icon: (
        <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: "System is Healthy",
      description: "All positions have comfortable buffers. No immediate liquidation opportunities.",
      actions: [
        { label: "Watch high-risk positions", description: "Monitor positions <15% buffer", disabled: false },
        { label: "Configure capital", description: "Set up repayment assets for faster execution", disabled: true },
      ],
    },
  };

  const { icon, title, description, actions } = content[type];

  return (
    <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] p-8">
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-white/50 mb-6">{description}</p>
        
        {/* Action cards */}
        <div className="w-full space-y-2">
          {actions.map((action, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-lg border text-left flex items-center gap-3 ${
                action.disabled 
                  ? 'bg-white/[0.02] border-white/[0.06] opacity-60' 
                  : 'bg-teal-500/10 border-teal-500/30 hover:bg-teal-500/20 cursor-pointer'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                action.disabled ? 'bg-white/10' : 'bg-teal-500/20'
              }`}>
                {action.disabled ? (
                  <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${action.disabled ? 'text-white/50' : 'text-white'}`}>
                  {action.label}
                  {action.disabled && <span className="ml-2 text-[10px] text-white/30 uppercase">Coming soon</span>}
                </div>
                <div className="text-xs text-white/40">{action.description}</div>
              </div>
            </div>
          ))}
        </div>
        
        <button
          onClick={onRefresh}
          className="mt-6 px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>
    </div>
  );
}

/**
 * Opportunities Mode - "What can I liquidate and what's the profit?"
 * Focused on action with Best 3 cards + Proximity Ladder as main list
 */
export function OpportunitiesMode({
  positions,
  isLoading,
  lastUpdated,
  onRefresh,
}: OpportunitiesModeProps) {
  const { network } = useSuiClientContext();
  const [selectedPosition, setSelectedPosition] = React.useState<AtRiskPosition | null>(null);
  const [showTxModal, setShowTxModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [historyPosition, setHistoryPosition] = React.useState<AtRiskPosition | null>(null);
  const [drawerPosition, setDrawerPosition] = React.useState<AtRiskPosition | null>(null);

  const contracts = network === 'mainnet' ? CONTRACTS.mainnet : CONTRACTS.testnet;

  // Count by category
  const counts = React.useMemo(() => ({
    liquidatable: positions.filter(p => p.isLiquidatable).length,
    critical: positions.filter(p => !p.isLiquidatable && p.distanceToLiquidation < 10).length,
    watch: positions.filter(p => !p.isLiquidatable && p.distanceToLiquidation >= 10 && p.distanceToLiquidation < 25).length,
    all: positions.length,
  }), [positions]);

  // Get liquidatable positions stats
  const liquidatableStats = React.useMemo(() => {
    const liquidatable = positions.filter(p => p.isLiquidatable);
    return {
      count: liquidatable.length,
      totalDebt: liquidatable.reduce((sum, p) => sum + p.totalDebtUsd, 0),
      totalProfit: liquidatable.reduce((sum, p) => sum + calculateNetProfit(p), 0),
    };
  }, [positions]);

  const handleLiquidateClick = (position: AtRiskPosition) => {
    setSelectedPosition(position);
    setShowTxModal(true);
  };

  const handleRowClick = (position: AtRiskPosition) => {
    setDrawerPosition(position);
  };

  const handleViewHistory = (position: AtRiskPosition) => {
    setHistoryPosition(position);
    setShowHistoryModal(true);
  };

  const transactionInfo = selectedPosition ? {
    action: 'Liquidate Position',
    packageId: contracts.MARGIN_PACKAGE_ID,
    module: 'margin_manager',
    function: 'liquidate',
    summary: `Liquidate position with ${formatUsd(selectedPosition.totalDebtUsd)} debt. Est. profit: ${formatUsd(calculateNetProfit(selectedPosition))}`,
    sourceCodeUrl: `https://suivision.xyz/package/${contracts.MARGIN_PACKAGE_ID}`,
    arguments: [
      { name: 'Position', value: formatAddress(selectedPosition.marginManagerId) },
      { name: 'Health', value: selectedPosition.riskRatio.toFixed(4) },
      { name: 'Debt', value: formatUsd(selectedPosition.totalDebtUsd) },
      { name: 'Est. Net Profit', value: formatUsd(calculateNetProfit(selectedPosition)) },
    ],
  } : null;

  // Determine empty state type
  const getEmptyStateType = (): 'no-positions' | 'no-liquidatable' | 'all-healthy' => {
    if (positions.length === 0) return 'no-positions';
    if (counts.liquidatable === 0 && counts.critical === 0) return 'all-healthy';
    return 'no-liquidatable';
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* ═══════════════════════════════════════════════════════════════════
          HEADER BAR - Status + Refresh
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Status summary */}
        <div className="flex items-center gap-3">
          {liquidatableStats.count > 0 ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-500/30">
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="text-sm font-medium text-rose-300">
                {liquidatableStats.count} Active · {formatUsd(liquidatableStats.totalProfit)} potential profit
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-sm text-white/60">
                No active opportunities · {positions.length} positions monitored
              </span>
            </div>
          )}
        </div>

        {/* Right side: Last updated + Refresh */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/40 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {formatRelativeTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && positions.length === 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
            <div className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
            <div className="h-28 bg-white/[0.03] rounded-xl animate-pulse" />
          </div>
          <div className="h-64 bg-white/[0.03] rounded-xl animate-pulse" />
        </div>
      ) : positions.length === 0 ? (
        /* Empty state - No positions */
        <SetupStateCard type="no-positions" onRefresh={onRefresh} />
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              BEST 3 CARDS - Top opportunities at a glance (not a table)
          ═══════════════════════════════════════════════════════════════════ */}
          <BestOpportunitiesCards positions={positions} onSelect={handleRowClick} />

          {/* ═══════════════════════════════════════════════════════════════════
              PROXIMITY LADDER - Primary interactive list
          ═══════════════════════════════════════════════════════════════════ */}
          {positions.length > 0 && (
            <ProximityLadder
              positions={positions}
              onSelectPosition={handleRowClick}
              selectedPositionId={drawerPosition?.marginManagerId}
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              SETUP STATE - When no liquidatable positions
          ═══════════════════════════════════════════════════════════════════ */}
          {counts.liquidatable === 0 && (
            <SetupStateCard 
              type={counts.critical > 0 ? 'no-liquidatable' : 'all-healthy'} 
              onRefresh={onRefresh} 
            />
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              LIQUIDATABLE SUMMARY - Quick action bar for liquidatable positions
          ═══════════════════════════════════════════════════════════════════ */}
          {counts.liquidatable > 0 && (
            <div className="bg-rose-500/10 rounded-xl border border-rose-500/30 p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-rose-300">
                      {counts.liquidatable} Position{counts.liquidatable > 1 ? 's' : ''} Ready to Liquidate
                    </h4>
                    <p className="text-sm text-white/60">
                      Total debt: {formatUsd(liquidatableStats.totalDebt)} · Est. profit: {formatUsd(liquidatableStats.totalProfit)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {positions.filter(p => p.isLiquidatable).slice(0, 3).map((position) => (
                    <button
                      key={position.marginManagerId}
                      onClick={() => handleLiquidateClick(position)}
                      className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-500 hover:bg-rose-400 text-white transition-all flex items-center gap-2"
                    >
                      <span className="text-xs opacity-70">{formatAddress(position.marginManagerId).slice(0, 6)}...</span>
                      <span>+{formatUsd(calculateNetProfit(position))}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Position count */}
      {positions.length > 0 && (
        <p className="text-[10px] text-white/30 text-center">
          {counts.liquidatable} liquidatable · {counts.critical} critical · {counts.watch} watching · {counts.all} total
        </p>
      )}

      {/* Position Detail Drawer */}
      {drawerPosition && (
        <PositionDetailDrawer
          position={drawerPosition}
          allPositions={positions}
          isOpen={!!drawerPosition}
          onClose={() => setDrawerPosition(null)}
          onLiquidate={handleLiquidateClick}
          onViewHistory={handleViewHistory}
        />
      )}

      {/* Transaction Modal */}
      {transactionInfo && (
        <TransactionDetailsModal
          isOpen={showTxModal}
          onClose={() => {
            setShowTxModal(false);
            setSelectedPosition(null);
          }}
          onContinue={() => {
            console.log('Liquidate position:', selectedPosition?.marginManagerId);
            setShowTxModal(false);
            setSelectedPosition(null);
          }}
          transactionInfo={transactionInfo}
          disabled={!selectedPosition?.isLiquidatable}
        />
      )}

      {/* Position History Modal */}
      {historyPosition && (
        <PositionHistoryModal
          position={historyPosition}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryPosition(null);
          }}
        />
      )}
    </div>
  );
}
