import React from "react";
import {
  fetchLiquidations,
  type LiquidationEventResponse,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import TimeRangeSelector from "../../../components/TimeRangeSelector";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useAtRiskPositions, useRiskDistribution } from "../../../hooks/useAtRiskPositions";
import { AtRiskPositionsTable } from "./AtRiskPositionsTable";
import { RiskDistributionChart } from "./RiskDistributionChart";
import { LiquidatorLeaderboard } from "./LiquidatorLeaderboard";
import { PriceSensitivitySimulator } from "./PriceSensitivitySimulator";
import { LiquidationOverview } from "./LiquidationOverview";

type DashboardTab = 'overview' | 'positions' | 'analytics' | 'history' | 'leaderboard';

export function LiquidationDashboard() {
  const { serverUrl } = useAppNetwork();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('overview');
  const [historyTimeRange, setHistoryTimeRange] = React.useState<TimeRange>("1M");
  const [liquidations, setLiquidations] = React.useState<LiquidationEventResponse[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [historyError, setHistoryError] = React.useState<Error | null>(null);

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

  // Fetch historical liquidations
  React.useEffect(() => {
    async function fetchData() {
      try {
        setHistoryLoading(true);
        const params = timeRangeToParams(historyTimeRange);
        const data = await fetchLiquidations({ ...params, limit: 1000 });
        setLiquidations(data);
        setHistoryError(null);
      } catch (err) {
        console.error("Error fetching liquidations:", err);
        setHistoryError(err as Error);
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchData();
  }, [historyTimeRange, serverUrl]);

  // Calculate historical analytics
  const analytics = React.useMemo(() => {
    const totalLiquidations = liquidations.length;
    const totalLiquidationVolume = liquidations.reduce(
      (sum, liq) => sum + parseFloat(liq.liquidation_amount),
      0
    );
    const totalRewards = liquidations.reduce(
      (sum, liq) => sum + parseFloat(liq.pool_reward),
      0
    );
    const totalBadDebt = liquidations.reduce(
      (sum, liq) => sum + parseFloat(liq.pool_default),
      0
    );

    return {
      totalLiquidations,
      totalLiquidationVolume,
      totalRewards,
      totalBadDebt,
    };
  }, [liquidations]);

  return (
    <div className="space-y-6">
      {/* Header - only show when not on overview tab */}
      {activeTab !== 'overview' && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-200 flex items-center gap-3">
                Liquidations
                {liquidatableCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                    {liquidatableCount} available
                  </span>
                )}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Monitor at-risk positions and liquidation opportunities
              </p>
            </div>
          </div>

          {/* Summary KPIs - only when not on overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group relative">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                Liquidatable
                <span className="text-slate-500 cursor-help" title="Positions that can be liquidated right now">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-xl font-bold text-rose-400 tabular-nums">
                {positionsLoading ? (
                  <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
                ) : (
                  liquidatableCount
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group relative">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                At-Risk
                <span className="text-slate-500 cursor-help" title="Positions within 20% of liquidation threshold">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-xl font-bold text-amber-400 tabular-nums">
                {positionsLoading ? (
                  <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
                ) : (
                  atRiskCount
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group relative">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                Debt at Risk
                <span className="text-slate-500 cursor-help" title="Total USD value of debt in at-risk positions">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className="text-xl font-bold text-cyan-400 tabular-nums">
                {positionsLoading ? (
                  <div className="h-6 w-12 bg-slate-700 rounded animate-pulse" />
                ) : totalDebtAtRiskUsd >= 1000000 ? (
                  `$${(totalDebtAtRiskUsd / 1000000).toFixed(1)}M`
                ) : totalDebtAtRiskUsd >= 1000 ? (
                  `$${(totalDebtAtRiskUsd / 1000).toFixed(1)}K`
                ) : (
                  `$${totalDebtAtRiskUsd.toFixed(0)}`
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 group relative">
              <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                Bad Debt
                <span className="text-slate-500 cursor-help" title="Unrecovered debt when collateral was insufficient to cover the loan. Denominated in native asset units.">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div className={`text-xl font-bold tabular-nums ${
                analytics.totalBadDebt > 0 ? 'text-rose-400' : 'text-slate-300'
              }`}>
                {historyLoading ? (
                  <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
                ) : analytics.totalBadDebt > 0 ? (
                  (analytics.totalBadDebt / 1e9).toFixed(2)
                ) : (
                  '0'
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab Navigation - Matching Pools page style */}
      <div className="flex gap-1 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'positions', label: 'Positions' },
          { key: 'analytics', label: 'Analytics' },
          { key: 'history', label: 'History' },
          { key: 'leaderboard', label: 'Leaderboard' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as DashboardTab)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-teal-400 text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <LiquidationOverview onSelectTab={setActiveTab} />
          </div>
        )}

        {/* At-Risk Positions Tab */}
        {activeTab === 'positions' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {positionsError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <p className="text-red-400">
                  Error loading at-risk positions: {positionsError.message}
                </p>
              </div>
            ) : (
              <AtRiskPositionsTable
                positions={positions}
                isLoading={positionsLoading}
                lastUpdated={lastUpdated}
                onRefresh={refetchPositions}
              />
            )}
          </div>
        )}

        {/* Risk Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Risk Distribution Chart */}
              <RiskDistributionChart
                buckets={riskDistribution}
                isLoading={positionsLoading}
              />

              {/* Price Sensitivity Simulator */}
              <PriceSensitivitySimulator
                positions={positions}
                isLoading={positionsLoading}
              />
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Time Range Selector */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Liquidation History</h3>
              <TimeRangeSelector value={historyTimeRange} onChange={setHistoryTimeRange} />
            </div>

            {/* Historical Stats with Sparkline */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Total Events</div>
                <div className="text-xl font-bold text-slate-200 tabular-nums">
                  {analytics.totalLiquidations.toLocaleString()}
                </div>
                {/* Mini activity indicator */}
                <div className="mt-2 flex items-end gap-0.5 h-4">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const dayLiqs = liquidations.filter(l => {
                      const dayAgo = Date.now() - ((7 - i) * 24 * 60 * 60 * 1000);
                      const dayEnd = Date.now() - ((6 - i) * 24 * 60 * 60 * 1000);
                      return l.checkpoint_timestamp_ms >= dayAgo && l.checkpoint_timestamp_ms < dayEnd;
                    }).length;
                    const maxDayLiqs = Math.max(...Array.from({ length: 7 }).map((_, j) => {
                      const dayAgo = Date.now() - ((7 - j) * 24 * 60 * 60 * 1000);
                      const dayEnd = Date.now() - ((6 - j) * 24 * 60 * 60 * 1000);
                      return liquidations.filter(l => l.checkpoint_timestamp_ms >= dayAgo && l.checkpoint_timestamp_ms < dayEnd).length;
                    }), 1);
                    const height = dayLiqs > 0 ? Math.max((dayLiqs / maxDayLiqs) * 100, 15) : 10;
                    return (
                      <div
                        key={i}
                        className={`flex-1 rounded-sm ${dayLiqs > 0 ? 'bg-cyan-400/60' : 'bg-white/10'}`}
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Volume</div>
                <div className="text-xl font-bold text-cyan-400 tabular-nums">
                  {(analytics.totalLiquidationVolume / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-slate-500 mt-1">native units</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Rewards Paid</div>
                <div className="text-xl font-bold text-emerald-400 tabular-nums">
                  {(analytics.totalRewards / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-slate-500 mt-1">to liquidators</div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  Bad Debt
                  <span className="text-slate-500 cursor-help" title="Debt that couldn't be recovered because collateral value was insufficient">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                </div>
                <div className={`text-xl font-bold tabular-nums ${analytics.totalBadDebt > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {(analytics.totalBadDebt / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>

            {/* Liquidation History Table */}
            <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/50">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-14 bg-slate-700/50 rounded animate-pulse" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-center py-8 text-rose-400">
                  Error loading history: {historyError.message}
                </div>
              ) : liquidations.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-base font-medium text-slate-300">No Liquidations</p>
                  <p className="text-sm text-slate-500 mt-1">No events in the selected time range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Time</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Liquidator</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Position</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Amount</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Reward</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Bad Debt</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium" title="Health Factor at time of liquidation (collateral/debt ratio)">
                          <span className="flex items-center justify-end gap-1">
                            Health Factor
                            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {liquidations
                        .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
                        .slice(0, 50)
                        .map((liq, index) => {
                          const hasBadDebt = parseFloat(liq.pool_default) > 0;
                          const healthFactor = parseFloat(liq.risk_ratio) / 1e9;
                          return (
                            <tr
                              key={index}
                              className={`border-b border-slate-700/30 hover:bg-slate-700/30 transition-colors ${
                                hasBadDebt ? "bg-rose-500/5" : ""
                              }`}
                            >
                              <td className="py-3 px-4 text-slate-300 text-xs">
                                {new Date(liq.checkpoint_timestamp_ms).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`https://suivision.xyz/account/${liq.sender}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
                                >
                                  {liq.sender ? `${liq.sender.slice(0, 6)}...${liq.sender.slice(-4)}` : 'N/A'}
                                </a>
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`https://suivision.xyz/object/${liq.margin_manager_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-xs font-mono"
                                >
                                  {liq.margin_manager_id.slice(0, 8)}...{liq.margin_manager_id.slice(-6)}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-200 font-medium tabular-nums">
                                {(parseFloat(liq.liquidation_amount) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right text-emerald-400 tabular-nums">
                                {(parseFloat(liq.pool_reward) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className={`py-3 px-4 text-right tabular-nums ${hasBadDebt ? "text-rose-400 font-medium" : "text-slate-500"}`}>
                                {(parseFloat(liq.pool_default) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`tabular-nums ${
                                  healthFactor <= 1.05 ? 'text-rose-400' :
                                  healthFactor <= 1.10 ? 'text-amber-400' :
                                  'text-yellow-400'
                                }`}>
                                  {healthFactor.toFixed(3)}
                                </span>
                                <span className="text-xs text-slate-500 ml-1">
                                  @ liq
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bad Debt Alert */}
            {analytics.totalBadDebt > 0 && (
              <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">
                <h3 className="text-sm font-medium text-rose-400 mb-1">Bad Debt Detected</h3>
                <p className="text-slate-300 text-sm">
                  Total:{" "}
                  <span className="font-medium text-rose-400">
                    {(analytics.totalBadDebt / 1e9).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-slate-500 ml-2 text-xs">
                    (occurs when collateral is insufficient)
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
            <LiquidatorLeaderboard />
          </div>
        )}
      </div>
    </div>
  );
}

















