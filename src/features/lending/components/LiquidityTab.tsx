import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Line,
  ComposedChart,
} from "recharts";
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  fetchLoanBorrowed,
  fetchLoanRepaid,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import type { PoolOverview } from "../types";
import { calculatePoolRates } from "../../../utils/interestRates";

interface LiquidityTabProps {
  pool: PoolOverview;
}

interface DailyDataPoint {
  date: string;
  timestamp: number;
  availableLiquidity: number;
  utilization: number;
  supply: number;
  borrow: number;
}

export function LiquidityTab({ pool }: LiquidityTabProps) {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<"7D" | "1M">("7D");
  const [dailyData, setDailyData] = React.useState<DailyDataPoint[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  const decimals = pool.contracts?.coinDecimals ?? 9;
  const poolId = pool.contracts?.marginPoolId;

  // Get current live rates
  const liveRates = React.useMemo(() => calculatePoolRates(pool), [pool]);
  const currentAvailable = pool.state.supply - pool.state.borrow;
  const currentUtilization = liveRates.utilizationPct;

  // Fetch and process historical data
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

        const [supplied, withdrawn, borrowed, repaid] = await Promise.all([
          fetchAssetSupplied(params),
          fetchAssetWithdrawn(params),
          fetchLoanBorrowed(params),
          fetchLoanRepaid(params),
        ]);

        // Build events list
        const events: Array<{
          timestamp: number;
          type: "supply" | "withdraw" | "borrow" | "repay";
          amount: number;
        }> = [];

        supplied.forEach((e) => {
          events.push({
            timestamp: e.checkpoint_timestamp_ms,
            type: "supply",
            amount: parseFloat(e.amount) / 10 ** decimals,
          });
        });

        withdrawn.forEach((e) => {
          events.push({
            timestamp: e.checkpoint_timestamp_ms,
            type: "withdraw",
            amount: parseFloat(e.amount) / 10 ** decimals,
          });
        });

        borrowed.forEach((e) => {
          events.push({
            timestamp: e.checkpoint_timestamp_ms,
            type: "borrow",
            amount: parseFloat(e.loan_amount) / 10 ** decimals,
          });
        });

        repaid.forEach((e) => {
          events.push({
            timestamp: e.checkpoint_timestamp_ms,
            type: "repay",
            amount: parseFloat(e.repay_amount) / 10 ** decimals,
          });
        });

        // Sort by timestamp (newest first for backward calculation)
        events.sort((a, b) => b.timestamp - a.timestamp);

        // Create a date range for all days in the selected period
        const now = new Date();
        const daysToShow = timeRange === "7D" ? 7 : 30;
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysToShow);
        startDate.setHours(0, 0, 0, 0);

        // Work BACKWARDS from current state to calculate historical states
        // Start with current known state
        let runningSupply = pool.state?.supply ?? 0;
        let runningBorrow = pool.state?.borrow ?? 0;

        // Create daily snapshots map - keyed by date string
        const dailySnapshots = new Map<string, { supply: number; borrow: number; timestamp: number }>();

        // Add current state for today
        const todayKey = now.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        dailySnapshots.set(todayKey, {
          supply: runningSupply,
          borrow: runningBorrow,
          timestamp: now.getTime(),
        });

        // Process events from newest to oldest (working backwards)
        events.forEach((event) => {
          const eventDate = new Date(event.timestamp);
          
          // Reverse the effect of the event to get the state BEFORE the event
          if (event.type === "supply") {
            runningSupply -= event.amount;
          } else if (event.type === "withdraw") {
            runningSupply += event.amount;
          } else if (event.type === "borrow") {
            runningBorrow -= event.amount;
          } else if (event.type === "repay") {
            runningBorrow += event.amount;
          }

          // Clamp to prevent negative values from floating point errors
          runningSupply = Math.max(0, runningSupply);
          runningBorrow = Math.max(0, runningBorrow);

          const dateKey = eventDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          
          // Store the state at the START of this day (before all events on this day)
          // Only update if this is an earlier state for this day
          if (!dailySnapshots.has(dateKey) || event.timestamp < dailySnapshots.get(dateKey)!.timestamp) {
            dailySnapshots.set(dateKey, {
              supply: runningSupply,
              borrow: runningBorrow,
              timestamp: event.timestamp,
            });
          }
        });

        // Fill in all days in the range (for days with no events, carry forward the previous day's state)
        const result: DailyDataPoint[] = [];
        let lastKnownState = { supply: runningSupply, borrow: runningBorrow };

        for (let d = new Date(startDate); d <= now; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
          const isToday = d.toDateString() === now.toDateString();
          
          // Get state for this day, or use last known state
          const snapshot = dailySnapshots.get(dateKey);
          if (snapshot) {
            lastKnownState = { supply: snapshot.supply, borrow: snapshot.borrow };
          }

          const supply = lastKnownState.supply;
          const borrow = lastKnownState.borrow;
          const available = Math.max(0, supply - borrow);
          const utilization = supply > 0 ? Math.min(Math.max((borrow / supply) * 100, 0), 100) : 0;

          result.push({
            date: isToday ? `${dateKey} (now)` : dateKey,
            timestamp: d.getTime(),
            availableLiquidity: available,
            utilization,
            supply,
            borrow,
          });
        }

        setDailyData(result);
      } catch (err) {
        console.error("Error fetching liquidity history:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch data"));
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [poolId, decimals, serverUrl, timeRange, pool.state]);

  // Format number for display
  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(2) + "M";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K";
    if (Math.abs(num) >= 1) return num.toFixed(0);
    return num.toFixed(2);
  };

  // Calculate stress scenarios
  const stressScenarios = React.useMemo(() => {
    const supply = pool.state.supply;
    const borrow = pool.state.borrow;

    // Scenario 1: If utilization rises to 80%
    const targetUtil80 = 0.8;
    const borrowAt80 = supply * targetUtil80;
    const availableAt80 = supply - borrowAt80;

    // Scenario 2: If borrow demand increases 20%
    const borrowIncrease20 = borrow * 1.2;
    const availableAfterIncrease = Math.max(0, supply - borrowIncrease20);
    const utilAfterIncrease = supply > 0 ? (borrowIncrease20 / supply) * 100 : 0;

    return {
      util80: {
        available: availableAt80,
        currentUtil: currentUtilization,
        isRelevant: currentUtilization < 80,
      },
      borrowPlus20: {
        available: availableAfterIncrease,
        newUtil: Math.min(utilAfterIncrease, 100),
        borrowIncrease: borrow * 0.2,
      },
    };
  }, [pool.state, currentUtilization]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as DailyDataPoint;

    return (
      <div className="bg-slate-900/95 border border-cyan-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
        <div className="text-xs text-cyan-400 font-medium mb-2">{label}</div>
        <div className="space-y-1.5">
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Available:</span>
            <span className="font-semibold text-cyan-300">
              {formatNumber(data.availableLiquidity)} {pool.asset}
            </span>
          </div>
          <div className="flex justify-between gap-4 text-sm">
            <span className="text-slate-400">Utilization:</span>
            <span className="font-medium text-amber-400">
              {data.utilization.toFixed(1)}%
            </span>
          </div>
          <div className="pt-1.5 border-t border-slate-700/50 mt-1.5">
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-500">Total Supply:</span>
              <span className="text-slate-300">{formatNumber(data.supply)}</span>
            </div>
            <div className="flex justify-between gap-4 text-xs">
              <span className="text-slate-500">Total Borrowed:</span>
              <span className="text-slate-300">{formatNumber(data.borrow)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Available Liquidity Over Time
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Track how much liquidity is available for withdrawals
          </p>
        </div>

        {/* Time Range Toggle */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
          {(["7D", "1M"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                timeRange === range
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {range === "7D" ? "7 Days" : "30 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Current Status Banner */}
      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-cyan-500/10 to-emerald-500/5 rounded-xl border border-cyan-500/20">
        <div className="flex-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Available Now
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            {formatNumber(currentAvailable)} <span className="text-sm text-slate-400">{pool.asset}</span>
          </div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="flex-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            Current Utilization
          </div>
          <div className={`text-2xl font-bold ${
            currentUtilization > 80 ? "text-red-400" :
            currentUtilization > 50 ? "text-amber-400" :
            "text-emerald-400"
          }`}>
            {currentUtilization.toFixed(1)}%
          </div>
        </div>
        <div className="w-px h-10 bg-slate-700" />
        <div className="flex-1">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">
            % of Supply Available
          </div>
          <div className="text-2xl font-bold text-white">
            {pool.state.supply > 0 ? ((currentAvailable / pool.state.supply) * 100).toFixed(0) : 0}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-700/50 p-4">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
              <div className="w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              Loading liquidity history...
            </div>
          </div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-red-400">
              <p className="text-sm">Failed to load data</p>
              <p className="text-xs text-slate-500 mt-1">{error.message}</p>
            </div>
          </div>
        ) : dailyData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <p className="text-sm">No historical data available</p>
              <p className="text-xs text-slate-500 mt-1">Data will appear as pool activity occurs</p>
            </div>
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="liquidityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="liquidity"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  tickFormatter={(value) => formatNumber(value)}
                  width={60}
                />
                <YAxis
                  yAxisId="utilization"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#fbbf24" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 100]}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  yAxisId="liquidity"
                  type="monotone"
                  dataKey="availableLiquidity"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  fill="url(#liquidityGradient)"
                  name="Available Liquidity"
                />
                <Line
                  yAxisId="utilization"
                  type="monotone"
                  dataKey="utilization"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeOpacity={0.5}
                  strokeDasharray="4 4"
                  dot={false}
                  name="Utilization %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm bg-cyan-500" />
            <span className="text-slate-400">Available Liquidity ({pool.asset})</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-6 h-0 border-t-2 border-dashed border-amber-500/50" />
            <span className="text-slate-400">Utilization %</span>
          </div>
        </div>
      </div>

      {/* Stress / What-If Scenarios */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h4 className="text-sm font-semibold text-white">Stress Scenarios</h4>
          <span className="text-[10px] text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">Rough estimates</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Scenario 1: Utilization to 80% */}
          <div className={`p-4 rounded-xl border transition-all ${
            stressScenarios.util80.isRelevant
              ? "bg-amber-500/5 border-amber-500/20"
              : "bg-slate-800/30 border-slate-700/30 opacity-60"
          }`}>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">If utilization rises to 80%</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-amber-400">
                    ~{formatNumber(stressScenarios.util80.available)}
                  </span>
                  <span className="text-xs text-slate-500">{pool.asset} available</span>
                </div>
                {stressScenarios.util80.isRelevant ? (
                  <div className="text-[10px] text-slate-500 mt-1">
                    Currently at {currentUtilization.toFixed(1)}% → would drop by {formatNumber(currentAvailable - stressScenarios.util80.available)} {pool.asset}
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-400/70 mt-1">
                    Already above 80% utilization
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scenario 2: Borrow demand +20% */}
          <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10">
                <svg className="w-4 h-4 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-slate-400 mb-1">If borrow demand +20%</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-rose-400">
                    ~{formatNumber(stressScenarios.borrowPlus20.available)}
                  </span>
                  <span className="text-xs text-slate-500">{pool.asset} available</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Utilization would reach {stressScenarios.borrowPlus20.newUtil.toFixed(1)}%
                  {stressScenarios.borrowPlus20.newUtil >= 100 && (
                    <span className="text-red-400 ml-1">⚠ Pool would be fully utilized</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-500 italic text-center">
          These are simplified scenarios based on current supply. Actual outcomes depend on market conditions and user behavior.
        </p>
      </div>

      {/* Insight Box */}
      <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/30">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 shrink-0">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h5 className="text-sm font-medium text-white mb-1">Is {formatNumber(currentAvailable)} {pool.asset} normal?</h5>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentUtilization < 30 ? (
                <>
                  This pool has <span className="text-emerald-400 font-medium">very high liquidity</span>. 
                  Withdrawals should be instant with no issues. The low utilization ({currentUtilization.toFixed(0)}%) 
                  means most supplied assets are sitting idle.
                </>
              ) : currentUtilization < 60 ? (
                <>
                  This pool has <span className="text-cyan-400 font-medium">healthy liquidity</span>. 
                  Most withdrawal sizes should be processed smoothly. The pool is being used efficiently 
                  with a balanced utilization rate.
                </>
              ) : currentUtilization < 80 ? (
                <>
                  This pool has <span className="text-amber-400 font-medium">moderate liquidity</span>. 
                  Large withdrawals may need to wait for borrowers to repay. Consider the time it might 
                  take for full liquidity to become available.
                </>
              ) : (
                <>
                  This pool has <span className="text-red-400 font-medium">low available liquidity</span>. 
                  Withdrawals may be delayed or partial. The high utilization indicates strong borrow 
                  demand—you may need to wait for repayments.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* What This Tells You */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mt-4">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          What This Tells You
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
          <div>
            <span className="text-white/80 font-medium">Withdrawal Risk</span>
            <p className="mt-1">
              {currentUtilization > 70 ? (
                <>High utilization means most assets are lent out. Large withdrawals may require waiting for borrowers to repay.</>
              ) : (
                <>Low utilization means plenty of assets are available. Withdrawals should process instantly regardless of size.</>
              )}
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Trend Analysis</span>
            <p className="mt-1">
              Watch for declining available liquidity over time—it signals growing borrow demand. Rising liquidity means borrowers are repaying or new suppliers are entering.
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Stress Scenarios</span>
            <p className="mt-1">
              The scenarios above show how quickly liquidity could drop. If borrow demand spikes, the pool may temporarily have limited withdrawal capacity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
