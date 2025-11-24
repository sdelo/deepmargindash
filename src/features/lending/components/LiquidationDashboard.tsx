import React from "react";
import {
  fetchLiquidations,
  type LiquidationEventResponse,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import TimeRangeSelector from "../../../components/TimeRangeSelector";
import { useAppNetwork } from "../../../context/AppNetworkContext";

export function LiquidationDashboard() {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("1M");
  const [liquidations, setLiquidations] = React.useState<
    LiquidationEventResponse[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch liquidations - refetch when timeRange or serverUrl changes
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const params = timeRangeToParams(timeRange);
        const data = await fetchLiquidations({ ...params, limit: 1000 });
        setLiquidations(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching liquidations:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [timeRange, serverUrl]);

  // Calculate analytics
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
    const averageLiquidationSize =
      totalLiquidations > 0 ? totalLiquidationVolume / totalLiquidations : 0;

    return {
      totalLiquidations,
      totalLiquidationVolume,
      totalRewards,
      totalBadDebt,
      averageLiquidationSize,
    };
  }, [liquidations]);

  if (error) {
    return (
      <div className="card-surface p-6 rounded-3xl border border-red-500/20">
        <p className="text-red-400">
          Error loading liquidations: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">⚡</span>
            {isLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-rose-400"></div>
            )}
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-8 w-16 bg-white/10 rounded animate-pulse"></div>
            ) : (
              analytics.totalLiquidations.toLocaleString()
            )}
          </div>
          <div className="text-sm text-white/60">Total Liquidations</div>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">💸</span>
            {isLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-rose-400"></div>
            )}
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
            ) : (
              (analytics.totalLiquidationVolume / 1e9).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }
              )
            )}
          </div>
          <div className="text-sm text-white/60">Liquidation Volume</div>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🎁</span>
            {isLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-rose-400"></div>
            )}
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
            ) : (
              (analytics.totalRewards / 1e9).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </div>
          <div className="text-sm text-white/60">Rewards Distributed</div>
        </div>

        <div className="card-surface p-6 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-3xl">🔴</span>
            {isLoading && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-rose-400"></div>
            )}
          </div>
          <div className="text-2xl font-bold text-rose-400 mb-1">
            {isLoading ? (
              <div className="h-8 w-20 bg-white/10 rounded animate-pulse"></div>
            ) : (
              (analytics.totalBadDebt / 1e9).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            )}
          </div>
          <div className="text-sm text-white/60">Bad Debt Incurred</div>
        </div>
      </div>

      {/* Liquidation History Table */}
      <div className="card-surface p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-rose-300 mb-4">
          Liquidation History
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-20 bg-white/5 rounded animate-pulse"
              ></div>
            ))}
          </div>
        ) : liquidations.length === 0 ? (
          <div className="text-center py-12 text-white/60">
            <div className="text-5xl mb-3">✨</div>
            <p className="text-lg font-semibold">No Liquidations</p>
            <p className="text-sm mt-2">
              No liquidation events in the selected time range
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">
                    Manager ID
                  </th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">
                    Amount
                  </th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">
                    Pool Reward
                  </th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">
                    Bad Debt
                  </th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">
                    Risk Ratio
                  </th>
                </tr>
              </thead>
              <tbody>
                {liquidations
                  .sort(
                    (a, b) =>
                      b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms
                  )
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
                        <td className="py-3 px-4 text-white/80">
                          {new Date(
                            liq.checkpoint_timestamp_ms
                          ).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-cyan-300 text-xs">
                          {liq.margin_manager_id.slice(0, 8)}...
                          {liq.margin_manager_id.slice(-6)}
                        </td>
                        <td className="py-3 px-4 text-right text-white font-semibold">
                          {(
                            parseFloat(liq.liquidation_amount) / 1e9
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right text-green-400">
                          {(parseFloat(liq.pool_reward) / 1e9).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
                        </td>
                        <td
                          className={`py-3 px-4 text-right ${hasBadDebt ? "text-rose-400 font-bold" : "text-white/60"}`}
                        >
                          {(parseFloat(liq.pool_default) / 1e9).toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}
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

      {/* Bad Debt Monitor */}
      {analytics.totalBadDebt > 0 && (
        <div className="card-surface p-6 rounded-2xl border border-rose-500/30 bg-rose-500/5">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-rose-300 mb-2">
                Bad Debt Alert
              </h3>
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
                Bad debt occurs when collateral is insufficient to cover the
                liquidation amount plus rewards. This represents a loss for the
                margin pool.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
