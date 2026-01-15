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

type DashboardTab = 'positions' | 'analytics' | 'history' | 'leaderboard';

export function LiquidationDashboard() {
  const { serverUrl } = useAppNetwork();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('positions');
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
      {/* Header */}
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

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Liquidatable</div>
          <div className="text-xl font-bold text-rose-400">
            {positionsLoading ? (
              <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
            ) : (
              liquidatableCount
            )}
          </div>
        </div>

        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">At-Risk</div>
          <div className="text-xl font-bold text-amber-400">
            {positionsLoading ? (
              <div className="h-6 w-8 bg-slate-700 rounded animate-pulse" />
            ) : (
              atRiskCount
            )}
          </div>
        </div>

        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Debt at Risk</div>
          <div className="text-xl font-bold text-cyan-400">
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

        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
          <div className="text-xs text-slate-400 mb-1">Bad Debt</div>
          <div className={`text-xl font-bold ${
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

      {/* Tab Navigation - Matching Pools page style */}
      <div className="flex gap-1 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
        {[
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
                ? 'bg-amber-400 text-slate-900'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
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

            {/* Historical Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Total</div>
                <div className="text-xl font-bold text-slate-200">
                  {analytics.totalLiquidations.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Volume</div>
                <div className="text-xl font-bold text-cyan-400">
                  {(analytics.totalLiquidationVolume / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Rewards</div>
                <div className="text-xl font-bold text-emerald-400">
                  {(analytics.totalRewards / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Bad Debt</div>
                <div className={`text-xl font-bold ${analytics.totalBadDebt > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
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
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Manager</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Amount</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Reward</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Bad Debt</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Risk Ratio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liquidations
                        .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
                        .slice(0, 50)
                        .map((liq, index) => {
                          const hasBadDebt = parseFloat(liq.pool_default) > 0;
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
                                  className="text-cyan-400 hover:text-cyan-300 text-xs"
                                >
                                  {liq.sender ? `${liq.sender.slice(0, 6)}...${liq.sender.slice(-4)}` : 'N/A'}
                                </a>
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`https://suivision.xyz/object/${liq.margin_manager_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 hover:text-cyan-300 text-xs"
                                >
                                  {liq.margin_manager_id.slice(0, 8)}...{liq.margin_manager_id.slice(-6)}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-right text-slate-200 font-medium">
                                {(parseFloat(liq.liquidation_amount) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right text-emerald-400">
                                {(parseFloat(liq.pool_reward) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className={`py-3 px-4 text-right ${hasBadDebt ? "text-rose-400 font-medium" : "text-slate-500"}`}>
                                {(parseFloat(liq.pool_default) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right text-amber-400">
                                {(parseFloat(liq.risk_ratio) / 1e9).toFixed(3)}
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

















