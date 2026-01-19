import React from "react";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useAtRiskPositions, useRiskDistribution } from "../../../hooks/useAtRiskPositions";
import { SystemRiskMode } from "./SystemRiskMode";
import { OpportunitiesMode } from "./OpportunitiesMode";
import { ProofHistoryMode } from "./ProofHistoryMode";

/**
 * Dashboard Mode - 3 focused modes instead of 5 fragmented tabs
 * 
 * 1. System Risk (default): "Is the system safe right now?"
 *    - Combines Overview + Analytics
 *    - Single scroll page with verdict, distribution, simulator
 * 
 * 2. Opportunities: "What can I liquidate or watch?"
 *    - Replaces Positions
 *    - Trading blotter style with sticky filters
 * 
 * 3. Proof & History: "Is this system legit?"
 *    - Combines History + Leaderboard
 *    - Lifetime metrics + toggle between views
 */
type DashboardMode = 'system-risk' | 'opportunities' | 'proof';

export function LiquidationDashboard() {
  const { serverUrl } = useAppNetwork();
  const [activeMode, setActiveMode] = React.useState<DashboardMode>('system-risk');

  // At-risk positions hook
  const {
    positions,
    liquidatableCount,
    atRiskCount,
    totalDebtAtRiskUsd,
    isLoading: positionsLoading,
    error: positionsError,
    refetch: refetchPositions,
    lastUpdated,
  } = useAtRiskPositions();

  // Risk distribution from positions
  const riskDistribution = useRiskDistribution(positions);

  return (
    <div className="space-y-4">
      {/* ═══════════════════════════════════════════════════════════════════
          MODE NAVIGATION - 3 focused modes
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-800/60 rounded-lg border border-slate-700/50">
          {[
            { 
              key: 'system-risk', 
              label: 'System Risk',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              badge: null,
            },
            { 
              key: 'opportunities', 
              label: 'Opportunities',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
              badge: liquidatableCount > 0 ? liquidatableCount : null,
            },
            { 
              key: 'proof', 
              label: 'Proof & History',
              icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              ),
              badge: null,
            },
          ].map((mode) => (
            <button
              key={mode.key}
              onClick={() => setActiveMode(mode.key as DashboardMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeMode === mode.key
                  ? 'bg-teal-400 text-slate-900'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {mode.icon}
              {mode.label}
              {mode.badge !== null && (
                <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                  activeMode === mode.key
                    ? 'bg-slate-900/30 text-slate-900'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {mode.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Live indicator */}
        {activeMode !== 'proof' && (
          <span className="flex items-center gap-2 text-xs text-white/40">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live data
          </span>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          MODE CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="min-h-[500px]">
        {/* Error State */}
        {positionsError && activeMode !== 'proof' && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 text-center">
            <p className="text-rose-400">
              Error loading positions: {positionsError.message}
            </p>
            <button
              onClick={refetchPositions}
              className="mt-3 px-4 py-2 text-sm bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* System Risk Mode */}
        {activeMode === 'system-risk' && !positionsError && (
          <SystemRiskMode
            positions={positions}
            riskDistribution={riskDistribution}
            liquidatableCount={liquidatableCount}
            atRiskCount={atRiskCount}
            totalDebtAtRiskUsd={totalDebtAtRiskUsd}
            isLoading={positionsLoading}
            lastUpdated={lastUpdated}
            onViewOpportunities={() => setActiveMode('opportunities')}
          />
        )}

        {/* Opportunities Mode */}
        {activeMode === 'opportunities' && !positionsError && (
          <OpportunitiesMode
            positions={positions}
            isLoading={positionsLoading}
            lastUpdated={lastUpdated}
            onRefresh={refetchPositions}
          />
        )}

        {/* Proof & History Mode */}
        {activeMode === 'proof' && (
          <ProofHistoryMode />
        )}
      </div>
    </div>
  );
}
