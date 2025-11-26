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
import {
  LiquidationCenterIcon,
  HarpoonIcon,
  DepthPressureIcon,
  TreasureIcon,
  BrokenAnchorIcon,
  HealthyAnchorIcon,
  HistoryIcon,
  TridentIcon,
} from "../../../components/ThemedIcons";

type DashboardTab = 'opportunities' | 'history' | 'leaderboard';

export function LiquidationDashboard() {
  const { serverUrl } = useAppNetwork();
  const [activeTab, setActiveTab] = React.useState<DashboardTab>('opportunities');
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
      {/* Header with Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <LiquidationCenterIcon size={28} />
            Liquidations Center
            {liquidatableCount > 0 && (
              <span className="px-3 py-1 text-sm font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                {liquidatableCount} LIQUIDATABLE NOW
              </span>
            )}
          </h2>
          <p className="text-sm text-white/60 mt-1">
            Monitor at-risk positions, historical liquidations, and top liquidators
          </p>
        </div>
      </div>

      {/* Summary KPIs - Always Visible */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white/5 p-4 rounded-2xl border border-rose-500/30">
          <div className="flex items-center justify-between mb-2">
            <HarpoonIcon size={24} />
            {positionsLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-rose-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-rose-400">
            {positionsLoading ? (
              <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
            ) : (
              liquidatableCount
            )}
          </div>
          <div className="text-xs text-white/60">Liquidatable Now</div>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <DepthPressureIcon size={24} />
            {positionsLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-amber-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-amber-400">
            {positionsLoading ? (
              <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
            ) : (
              atRiskCount
            )}
          </div>
          <div className="text-xs text-white/60">At-Risk Positions</div>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-cyan-500/30">
          <div className="flex items-center justify-between mb-2">
            <TreasureIcon size={24} />
            {positionsLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-cyan-400" />
            )}
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {positionsLoading ? (
              <div className="h-7 w-16 bg-white/10 rounded animate-pulse" />
            ) : totalDebtAtRiskUsd >= 1000000 ? (
              `$${(totalDebtAtRiskUsd / 1000000).toFixed(1)}M`
            ) : totalDebtAtRiskUsd >= 1000 ? (
              `$${(totalDebtAtRiskUsd / 1000).toFixed(1)}K`
            ) : (
              `$${totalDebtAtRiskUsd.toFixed(0)}`
            )}
          </div>
          <div className="text-xs text-white/60">Debt at Risk</div>
        </div>

        <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            {analytics.totalBadDebt > 0 ? (
              <BrokenAnchorIcon size={24} />
            ) : (
              <HealthyAnchorIcon size={24} />
            )}
            {historyLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-white/40" />
            )}
          </div>
          <div className={`text-2xl font-bold ${
            analytics.totalBadDebt > 0 ? 'text-rose-400' : 'text-cyan-400'
          }`}>
            {historyLoading ? (
              <div className="h-7 w-12 bg-white/10 rounded animate-pulse" />
            ) : analytics.totalBadDebt > 0 ? (
              (analytics.totalBadDebt / 1e9).toFixed(2)
            ) : (
              '0'
            )}
          </div>
          <div className="text-xs text-white/60">Bad Debt (Historical)</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
        <button
          onClick={() => setActiveTab('opportunities')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'opportunities'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <HarpoonIcon size={18} />
            <span>Opportunities</span>
            {liquidatableCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs font-bold bg-rose-500/30 text-rose-300 rounded">
                {liquidatableCount}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'history'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <HistoryIcon size={18} />
            <span>History</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'text-white/60 hover:text-white hover:bg-white/10'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <TridentIcon size={18} />
            <span>Leaderboard</span>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {/* Opportunities Tab */}
        {activeTab === 'opportunities' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {positionsError ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <p className="text-red-400">
                  Error loading at-risk positions: {positionsError.message}
                </p>
              </div>
            ) : (
              <>
                {/* At-Risk Positions Table */}
                <AtRiskPositionsTable
                  positions={positions}
                  isLoading={positionsLoading}
                  lastUpdated={lastUpdated}
                  onRefresh={refetchPositions}
                />

                {/* Two-column layout for charts */}
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
              </>
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xl font-bold text-white">
                  {analytics.totalLiquidations.toLocaleString()}
                </div>
                <div className="text-xs text-white/60">Total Liquidations</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xl font-bold text-cyan-400">
                  {(analytics.totalLiquidationVolume / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}
                </div>
                <div className="text-xs text-white/60">Volume (Native)</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="text-xl font-bold text-green-400">
                  {(analytics.totalRewards / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-white/60">Rewards Paid</div>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className={`text-xl font-bold ${analytics.totalBadDebt > 0 ? 'text-rose-400' : 'text-green-400'}`}>
                  {(analytics.totalBadDebt / 1e9).toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-white/60">Bad Debt</div>
              </div>
            </div>

            {/* Liquidation History Table */}
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-white/5 rounded animate-pulse" />
                  ))}
                </div>
              ) : historyError ? (
                <div className="text-center py-8 text-red-400">
                  Error loading history: {historyError.message}
                </div>
              ) : liquidations.length === 0 ? (
                <div className="text-center py-12 text-white/60">
                  <div className="mb-3 flex justify-center">
                    <HealthyAnchorIcon size={48} />
                  </div>
                  <p className="text-lg font-semibold text-white">No Liquidations</p>
                  <p className="text-sm mt-2">No liquidation events in the selected time range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-white/60 font-semibold">Time</th>
                        <th className="text-left py-3 px-4 text-white/60 font-semibold">Liquidator</th>
                        <th className="text-left py-3 px-4 text-white/60 font-semibold">Manager ID</th>
                        <th className="text-right py-3 px-4 text-white/60 font-semibold">Amount</th>
                        <th className="text-right py-3 px-4 text-white/60 font-semibold">Reward</th>
                        <th className="text-right py-3 px-4 text-white/60 font-semibold">Bad Debt</th>
                        <th className="text-right py-3 px-4 text-white/60 font-semibold">Risk Ratio</th>
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
                              className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                                hasBadDebt ? "bg-rose-500/5" : ""
                              }`}
                            >
                              <td className="py-3 px-4 text-white/80 text-xs">
                                {new Date(liq.checkpoint_timestamp_ms).toLocaleString()}
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`https://suivision.xyz/account/${liq.sender}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-amber-300 hover:text-amber-200 text-xs"
                                >
                                  {liq.sender ? `${liq.sender.slice(0, 6)}...${liq.sender.slice(-4)}` : 'N/A'}
                                </a>
                              </td>
                              <td className="py-3 px-4">
                                <a
                                  href={`https://suivision.xyz/object/${liq.margin_manager_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-mono text-cyan-300 hover:text-cyan-200 text-xs"
                                >
                                  {liq.margin_manager_id.slice(0, 8)}...{liq.margin_manager_id.slice(-6)}
                                </a>
                              </td>
                              <td className="py-3 px-4 text-right text-white font-semibold">
                                {(parseFloat(liq.liquidation_amount) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-4 text-right text-green-400">
                                {(parseFloat(liq.pool_reward) / 1e9).toLocaleString(undefined, {
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className={`py-3 px-4 text-right ${hasBadDebt ? "text-rose-400 font-bold" : "text-white/60"}`}>
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
              <div className="bg-white/5 p-6 rounded-2xl border border-rose-500/30">
                <div className="flex items-start gap-4">
                  <BrokenAnchorIcon size={40} />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-rose-300 mb-2">Bad Debt Alert</h3>
                    <p className="text-white/80 text-sm mb-3">
                      Total bad debt incurred:{" "}
                      <span className="font-bold text-rose-400">
                        {(analytics.totalBadDebt / 1e9).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </p>
                    <p className="text-white/60 text-xs">
                      Bad debt occurs when collateral is insufficient to cover the liquidation amount
                      plus rewards. This represents a loss for the margin pool.
                    </p>
                  </div>
                </div>
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









