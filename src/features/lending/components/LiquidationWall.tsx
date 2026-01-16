import React from "react";
import {
  fetchLiquidations,
  type LiquidationEventResponse,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import TimeRangeSelector from "../../../components/TimeRangeSelector";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  LiquidationIcon,
  BoltIcon,
  TreasureIcon,
  DepthGaugeIcon,
  AlertIcon,
  CheckIcon,
  ChartIcon,
  ErrorIcon,
  InsightIcon,
} from "../../../components/ThemedIcons";

interface LiquidationWallProps {
  poolId?: string;
  asset?: string; // e.g., "SUI", "DBUSDC"
}

interface DailyLiquidationData {
  date: string;
  liquidationAmount: number;
  liquidationCount: number;
  badDebt: number;
  totalRewards: number;
}

export function LiquidationWall({ poolId, asset = "" }: LiquidationWallProps) {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("1M");
  const [liquidations, setLiquidations] = React.useState<
    LiquidationEventResponse[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch liquidations - refetch when timeRange, poolId, or serverUrl changes
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        // Clear old data immediately when server changes
        setLiquidations([]);

        const params = {
          ...timeRangeToParams(timeRange),
          ...(poolId && { margin_pool_id: poolId }),
          limit: 10000,
        };
        const data = await fetchLiquidations(params);
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
  }, [timeRange, poolId, serverUrl]);

  // Aggregate by day
  const dailyData = React.useMemo(() => {
    const dataMap = new Map<string, DailyLiquidationData>();

    liquidations.forEach((liq) => {
      const date = new Date(liq.checkpoint_timestamp_ms).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      );

      const existing = dataMap.get(date) || {
        date,
        liquidationAmount: 0,
        liquidationCount: 0,
        badDebt: 0,
        totalRewards: 0,
      };

      existing.liquidationAmount += parseFloat(liq.liquidation_amount) / 1e9;
      existing.liquidationCount += 1;
      existing.badDebt += parseFloat(liq.pool_default) / 1e9;
      existing.totalRewards += parseFloat(liq.pool_reward) / 1e9;

      dataMap.set(date, existing);
    });

    return Array.from(dataMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [liquidations]);

  // Calculate summary stats
  const stats = React.useMemo(() => {
    const totalLiquidations = liquidations.length;
    const totalVolume = liquidations.reduce(
      (sum, liq) => sum + parseFloat(liq.liquidation_amount) / 1e9,
      0
    );
    const totalBadDebt = liquidations.reduce(
      (sum, liq) => sum + parseFloat(liq.pool_default) / 1e9,
      0
    );
    const avgLiquidationSize =
      totalLiquidations > 0 ? totalVolume / totalLiquidations : 0;

    return {
      totalLiquidations,
      totalVolume,
      totalBadDebt,
      avgLiquidationSize,
    };
  }, [liquidations]);

  // Find max for chart scaling
  const maxAmount = Math.max(...dailyData.map((d) => d.liquidationAmount), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <LiquidationIcon size={32} /> Liquidation Wall
          </h2>
          <p className="text-sm text-white/60">
            Historical liquidation activity and system health
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Liquidations */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <BoltIcon size={28} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-white">
              {stats.totalLiquidations}
            </div>
            <div className="text-sm text-white/60">Total Liquidations</div>
            <div className="text-xs text-cyan-300">Events</div>
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <TreasureIcon size={28} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-300">
              {stats.totalVolume.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-sm text-white/60">Total Volume{asset ? ` (${asset})` : ""}</div>
            <div className="text-xs text-orange-400">Liquidated</div>
          </div>
        </div>

        {/* Average Size */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-2">
            <DepthGaugeIcon size={28} />
          </div>
          <div className="space-y-1">
            <div className="text-2xl font-bold text-cyan-300">
              {stats.avgLiquidationSize.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-sm text-white/60">Avg. Size</div>
            <div className="text-xs text-cyan-400">Per Event</div>
          </div>
        </div>

        {/* Bad Debt */}
        <div
          className={`bg-white/5 rounded-2xl p-5 border ${
            stats.totalBadDebt > 0
              ? "border-red-500/50 shadow-lg shadow-red-500/10"
              : "border-white/10"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            {stats.totalBadDebt > 0 ? (
              <AlertIcon size={28} variant="warning" />
            ) : (
              <CheckIcon size={28} />
            )}
          </div>
          <div className="space-y-1">
            <div
              className={`text-2xl font-bold ${
                stats.totalBadDebt > 0 ? "text-red-300" : "text-green-300"
              }`}
            >
              {stats.totalBadDebt.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="text-sm text-white/60">Bad Debt</div>
            <div
              className={`text-xs ${
                stats.totalBadDebt > 0 ? "text-red-400" : "text-green-400"
              }`}
            >
              {stats.totalBadDebt > 0 ? "Undercollateralized" : "Fully Covered"}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-cyan-200 mb-4 flex items-center gap-2">
          <ChartIcon size={24} /> Liquidations Over Time
        </h3>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-cyan-500 border-t-transparent rounded-full"></div>
              <div className="text-white/60">Loading liquidation data...</div>
            </div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2 flex justify-center"><ErrorIcon size={32} /></div>
              <div className="text-red-300 font-semibold mb-1">
                Error loading data
              </div>
              <div className="text-white/60 text-sm">{error.message}</div>
            </div>
          </div>
        ) : dailyData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-3 flex justify-center"><CheckIcon size={48} /></div>
              <div className="text-white font-semibold text-lg mb-2">
                No Liquidations Found
              </div>
              <div className="text-white/60 text-sm max-w-md">
                This is a healthy sign! No positions have been liquidated in the
                selected time range. The protocol is managing risk effectively.
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Bar Chart */}
            <div className="h-64 flex items-end gap-1 px-2 relative">
              {dailyData.map((day, idx) => {
                // Use logarithmic-ish scaling for better visibility when values are similar
                const rawPercent = (day.liquidationAmount / maxAmount) * 100;
                // Ensure minimum 15% height for non-zero values so bars are visible
                const heightPercent = day.liquidationAmount > 0 
                  ? Math.max(rawPercent, 15) 
                  : 0;
                const hasBadDebt = day.badDebt > 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center group relative"
                    style={{ height: '100%' }}
                  >
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 bg-gray-900 border border-white/20 rounded-lg p-3 text-xs z-20 pointer-events-none shadow-xl min-w-[160px] left-1/2 -translate-x-1/2">
                      <div className="font-bold text-white mb-2">
                        {day.date}
                      </div>
                      <div className="space-y-1 text-white/80">
                        <div className="flex justify-between gap-3">
                          <span>Count:</span>
                          <span className="font-semibold text-white">
                            {day.liquidationCount}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Volume:</span>
                          <span className="font-semibold text-orange-300">
                            {day.liquidationAmount.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between gap-3">
                          <span>Rewards:</span>
                          <span className="font-semibold text-green-300">
                            {day.totalRewards.toLocaleString(undefined, {
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        {hasBadDebt && (
                          <div className="flex justify-between gap-3 text-red-300">
                            <span>Bad Debt:</span>
                            <span className="font-semibold">
                              {day.badDebt.toLocaleString(undefined, {
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bar container - aligns bar to bottom */}
                    <div className="flex-1 w-full flex items-end">
                      {/* Bar */}
                      <div
                        className={`w-full rounded-t transition-all duration-300 hover:brightness-110 relative ${
                          hasBadDebt
                            ? "bg-gradient-to-t from-red-600 to-orange-500"
                            : "bg-gradient-to-t from-orange-500 to-amber-400"
                        }`}
                        style={{ height: `${heightPercent}%`, minHeight: day.liquidationAmount > 0 ? '24px' : '0px' }}
                      >
                        {/* Badge for bad debt */}
                        {hasBadDebt && (
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                            <AlertIcon size={14} variant="warning" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Date label (show every few bars) */}
                    {idx % Math.ceil(dailyData.length / 6) === 0 && (
                      <div className="text-[10px] text-white/40 whitespace-nowrap mt-1">
                        {day.date}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-orange-500 to-amber-400"></div>
                <span className="text-white/70">Healthy Liquidations</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-gradient-to-r from-red-600 to-orange-500"></div>
                <span className="text-white/70">With Bad Debt</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interpretation Guide */}
      <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30">
        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
          <InsightIcon size={24} /> What This Tells You
        </h3>
        <div className="space-y-3 text-sm text-white/70">
          <div className="flex gap-3">
            <span className="text-green-400 font-bold shrink-0">✓</span>
            <div>
              <span className="font-semibold text-white">Healthy System:</span>{" "}
              {stats.totalBadDebt === 0 ? (
                <>
                  All liquidations have been executed successfully with full
                  collateral coverage. The protocol is managing risk
                  effectively.
                </>
              ) : (
                <>
                  Some bad debt detected (
                  {((stats.totalBadDebt / stats.totalVolume) * 100).toFixed(2)}%
                  of liquidation volume). This indicates positions were
                  liquidated too late or market moved too quickly.
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-cyan-400 font-bold shrink-0">→</span>
            <div>
              <span className="font-semibold text-white">
                Liquidation Frequency:
              </span>{" "}
              {stats.totalLiquidations > 0 ? (
                <>
                  {stats.totalLiquidations} liquidation
                  {stats.totalLiquidations !== 1 ? "s" : ""} occurred in this
                  period. Frequent liquidations may indicate volatile markets or
                  aggressive leverage usage.
                </>
              ) : (
                <>
                  No liquidations in this period. This indicates conservative
                  risk management by borrowers or stable market conditions.
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-amber-400 font-bold shrink-0">ⓘ</span>
            <div>
              <span className="font-semibold text-white">Risk Assessment:</span>{" "}
              Regular, small liquidations are normal and healthy. Large spikes
              or increasing bad debt suggest you should be cautious about the
              pool's risk management.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
