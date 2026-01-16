import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  type AssetSuppliedEventResponse,
  type AssetWithdrawnEventResponse,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import TimeRangeSelector from "../../../components/TimeRangeSelector";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  PoolActivityIcon,
  InsightIcon,
  ErrorIcon,
} from "../../../components/ThemedIcons";
import type { PoolOverview } from "../types";

interface PoolActivityProps {
  pool: PoolOverview;
}

interface DailyFlowData {
  date: string;
  timestamp: number;
  deposits: number;
  withdrawals: number;
  netFlow: number;
  tvl: number;
  depositCount: number;
  withdrawCount: number;
}

export function PoolActivity({ pool }: PoolActivityProps) {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("1M");
  const [dailyData, setDailyData] = React.useState<DailyFlowData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const decimals = pool.contracts?.coinDecimals ?? 9;
  const poolId = pool.contracts?.marginPoolId;

  // Fetch and process flow data
  React.useEffect(() => {
    async function fetchData() {
      if (!poolId) return;

      try {
        setIsLoading(true);
        setError(null);
        setDailyData([]);

        const params = {
          ...timeRangeToParams(timeRange),
          margin_pool_id: poolId,
          limit: 10000,
        };

        const [supplied, withdrawn] = await Promise.all([
          fetchAssetSupplied(params),
          fetchAssetWithdrawn(params),
        ]);

        // Build daily aggregations
        const dayMap = new Map<string, DailyFlowData>();

        // Process deposits
        supplied.forEach((e) => {
          const date = new Date(e.checkpoint_timestamp_ms).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          );
          const amount = parseFloat(e.amount) / 10 ** decimals;

          const existing = dayMap.get(date) || {
            date,
            timestamp: e.checkpoint_timestamp_ms,
            deposits: 0,
            withdrawals: 0,
            netFlow: 0,
            tvl: 0,
            depositCount: 0,
            withdrawCount: 0,
          };

          existing.deposits += amount;
          existing.netFlow += amount;
          existing.depositCount += 1;
          existing.timestamp = Math.max(
            existing.timestamp,
            e.checkpoint_timestamp_ms
          );
          dayMap.set(date, existing);
        });

        // Process withdrawals
        withdrawn.forEach((e) => {
          const date = new Date(e.checkpoint_timestamp_ms).toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric" }
          );
          const amount = parseFloat(e.amount) / 10 ** decimals;

          const existing = dayMap.get(date) || {
            date,
            timestamp: e.checkpoint_timestamp_ms,
            deposits: 0,
            withdrawals: 0,
            netFlow: 0,
            tvl: 0,
            depositCount: 0,
            withdrawCount: 0,
          };

          existing.withdrawals += amount;
          existing.netFlow -= amount;
          existing.withdrawCount += 1;
          existing.timestamp = Math.max(
            existing.timestamp,
            e.checkpoint_timestamp_ms
          );
          dayMap.set(date, existing);
        });

        // Sort by date and calculate running TVL
        const sortedData = Array.from(dayMap.values()).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        // Calculate TVL from current state working backwards
        let currentTVL = pool.state?.supply ?? 0;
        const reversedForTVL = [...sortedData].reverse();
        reversedForTVL.forEach((day, idx) => {
          if (idx === 0) {
            day.tvl = currentTVL;
          } else {
            // Work backwards
            const nextDay = reversedForTVL[idx - 1];
            day.tvl = nextDay.tvl - nextDay.netFlow;
          }
        });

        // Re-sort chronologically
        sortedData.forEach((day) => {
          const match = reversedForTVL.find((d) => d.date === day.date);
          if (match) day.tvl = Math.max(0, match.tvl);
        });

        setDailyData(sortedData);
      } catch (err) {
        console.error("Error fetching pool activity:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [timeRange, poolId, decimals, serverUrl, pool.state]);

  // Calculate stats
  const stats = React.useMemo(() => {
    if (dailyData.length === 0) {
      return {
        totalDeposits: 0,
        totalWithdrawals: 0,
        netChange: 0,
        avgDailyFlow: 0,
        daysWithNetInflow: 0,
        daysWithNetOutflow: 0,
      };
    }

    const totalDeposits = dailyData.reduce((sum, d) => sum + d.deposits, 0);
    const totalWithdrawals = dailyData.reduce(
      (sum, d) => sum + d.withdrawals,
      0
    );
    const netChange = totalDeposits - totalWithdrawals;
    const avgDailyFlow = netChange / dailyData.length;
    const daysWithNetInflow = dailyData.filter((d) => d.netFlow > 0).length;
    const daysWithNetOutflow = dailyData.filter((d) => d.netFlow < 0).length;

    return {
      totalDeposits,
      totalWithdrawals,
      netChange,
      avgDailyFlow,
      daysWithNetInflow,
      daysWithNetOutflow,
    };
  }, [dailyData]);

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1e6)
      return (num / 1e6).toFixed(1) + "M";
    if (Math.abs(num) >= 1e3)
      return (num / 1e3).toFixed(1) + "K";
    return num.toFixed(0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <PoolActivityIcon size={32} /> Pool Activity
          </h2>
          <p className="text-sm text-white/60">
            TVL changes and deposit/withdrawal flows for {pool.asset}
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-sm text-white/60 mb-1">Total Deposited</div>
          <div className="text-xl font-bold text-emerald-400">
            +{formatNumber(stats.totalDeposits)}
          </div>
          <div className="text-xs text-white/40 mt-1">{pool.asset}</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-sm text-white/60 mb-1">Total Withdrawn</div>
          <div className="text-xl font-bold text-red-400">
            -{formatNumber(stats.totalWithdrawals)}
          </div>
          <div className="text-xs text-white/40 mt-1">{pool.asset}</div>
        </div>
        <div
          className={`bg-white/5 rounded-2xl p-4 border ${
            stats.netChange >= 0
              ? "border-emerald-500/30"
              : "border-red-500/30"
          }`}
        >
          <div className="text-sm text-white/60 mb-1">Net Change</div>
          <div
            className={`text-xl font-bold ${
              stats.netChange >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {stats.netChange >= 0 ? "+" : ""}
            {formatNumber(stats.netChange)}
          </div>
          <div className="text-xs text-white/40 mt-1">
            {stats.netChange >= 0 ? "Pool growing" : "Pool shrinking"}
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
          <div className="text-sm text-white/60 mb-1">Flow Balance</div>
          <div className="text-xl font-bold text-cyan-300">
            {stats.daysWithNetInflow} / {stats.daysWithNetOutflow}
          </div>
          <div className="text-xs text-white/40 mt-1">Inflow / Outflow days</div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-cyan-200 mb-4">
          Daily Flows & TVL Trend
        </h3>

        {isLoading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-8 w-8 border-3 border-cyan-500 border-t-transparent rounded-full"></div>
              <div className="text-white/60">Loading pool activity...</div>
            </div>
          </div>
        ) : error ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center">
              <div className="mb-2 flex justify-center">
                <ErrorIcon size={32} />
              </div>
              <div className="text-red-300 font-semibold mb-1">
                Error loading data
              </div>
              <div className="text-white/60 text-sm">{error.message}</div>
            </div>
          </div>
        ) : dailyData.length === 0 ? (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">🌊</div>
              <div className="text-white font-semibold text-lg mb-2">
                No Activity Yet
              </div>
              <div className="text-white/60 text-sm">
                No deposits or withdrawals recorded in this time range.
                Be the first to supply liquidity!
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={dailyData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="tvlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis
                dataKey="date"
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="flow"
                orientation="left"
                tickFormatter={(v) => formatNumber(v)}
                tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <YAxis
                yAxisId="tvl"
                orientation="right"
                tickFormatter={(v) => formatNumber(v)}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                }}
                labelStyle={{ color: "#fff", fontWeight: "bold" }}
                formatter={(value: number, name: string) => {
                  const labels: Record<string, string> = {
                    deposits: "Deposits",
                    withdrawals: "Withdrawals",
                    tvl: "TVL",
                  };
                  return [formatNumber(value), labels[name] || name];
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => {
                  const labels: Record<string, string> = {
                    deposits: "Deposits",
                    withdrawals: "Withdrawals",
                    tvl: "TVL",
                  };
                  return (
                    <span className="text-white/80 text-sm">
                      {labels[value] || value}
                    </span>
                  );
                }}
              />
              <ReferenceLine
                yAxisId="flow"
                y={0}
                stroke="rgba(255,255,255,0.3)"
              />
              {/* TVL Area */}
              <Area
                yAxisId="tvl"
                type="monotone"
                dataKey="tvl"
                stroke="#22d3ee"
                strokeWidth={2}
                fill="url(#tvlGradient)"
                name="tvl"
              />
              {/* Deposit Bars */}
              <Bar
                yAxisId="flow"
                dataKey="deposits"
                fill="#10b981"
                radius={[2, 2, 0, 0]}
                name="deposits"
                opacity={0.8}
              />
              {/* Withdrawal Bars (negative) */}
              <Bar
                yAxisId="flow"
                dataKey={(d: DailyFlowData) => -d.withdrawals}
                fill="#ef4444"
                radius={[0, 0, 2, 2]}
                name="withdrawals"
                opacity={0.8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Insight Box */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mt-4">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          What This Tells You
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
          <div>
            <span className="text-white/80 font-medium">TVL Trend</span>
            <p className="mt-1">
              {stats.netChange > 0 ? (
                <>Pool grew by {formatNumber(Math.abs(stats.netChange))} {pool.asset}. Growing TVL signals supplier confidence.</>
              ) : stats.netChange < 0 ? (
                <>Pool shrunk by {formatNumber(Math.abs(stats.netChange))} {pool.asset}. Monitor sustained outflows.</>
              ) : (
                <>Stable TVL indicates balanced deposit/withdrawal activity.</>
              )}
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Activity Level</span>
            <p className="mt-1">
              {dailyData.length > 0 ? (
                <>{dailyData.reduce((sum, d) => sum + d.depositCount + d.withdrawCount, 0)} txns across {dailyData.length} active days. Active pools have better liquidity.</>
              ) : (
                <>No activity recorded in this period.</>
              )}
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Risk Signals</span>
            <p className="mt-1">
              Large sudden withdrawals reduce liquidity. Check Concentration tab if you see significant outflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}






