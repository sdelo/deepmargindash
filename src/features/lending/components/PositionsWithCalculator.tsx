import type { FC } from "react";
import React, { useState, useMemo, useEffect } from "react";
import type { UserPosition, PoolOverview } from "../types";
import { useUserPositions } from "../../../hooks/useUserPositions";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useEnrichedUserPositions } from "../../../hooks/useEnrichedUserPositions";
import { useUserActivity } from "../hooks/useUserActivity";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ChevronDownIcon, ChevronUpIcon, CalculatorIcon, ClockIcon } from "@heroicons/react/24/outline";

type Props = {
  userAddress: string | undefined;
  pools: PoolOverview[];
  selectedPool: PoolOverview | null;
  positions?: UserPosition[];
  pendingDepositAmount?: string;
};

function generateProjectionData(
  depositAmount: number,
  existingPosition: number,
  currentAPY: number,
  lowAPY: number,
  highAPY: number
) {
  const dataPoints: {
    day: number;
    label: string;
    current: number;
    low: number;
    high: number;
    baseline?: number;
  }[] = [];

  const totalAmount = depositAmount + existingPosition;
  const intervals = [
    { day: 1, label: "1d" },
    { day: 7, label: "1w" },
    { day: 14, label: "2w" },
    { day: 30, label: "1m" },
    { day: 60, label: "2m" },
    { day: 90, label: "3m" },
    { day: 180, label: "6m" },
    { day: 270, label: "9m" },
    { day: 365, label: "1y" },
  ];

  for (const { day, label } of intervals) {
    const currentDailyRate = currentAPY / 100 / 365;
    const lowDailyRate = lowAPY / 100 / 365;
    const highDailyRate = highAPY / 100 / 365;

    const currentValue = totalAmount * Math.pow(1 + currentDailyRate, day);
    const lowValue = totalAmount * Math.pow(1 + lowDailyRate, day);
    const highValue = totalAmount * Math.pow(1 + highDailyRate, day);
    
    const baselineValue = existingPosition > 0 
      ? existingPosition * Math.pow(1 + currentDailyRate, day)
      : undefined;

    dataPoints.push({
      day,
      label,
      current: currentValue,
      low: lowValue,
      high: highValue,
      baseline: baselineValue,
    });
  }

  return dataPoints;
}

export const PositionsWithCalculator: FC<Props> = ({
  userAddress,
  pools,
  selectedPool,
  positions: propPositions,
  pendingDepositAmount = "",
}) => {
  const { explorerUrl } = useAppNetwork();
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>("");

  const {
    data: fetchedPositions,
    error,
    isLoading,
  } = useUserPositions(propPositions ? undefined : userAddress);

  const positions = propPositions || fetchedPositions;
  const enrichedPositions = useEnrichedUserPositions(positions, pools);

  const supplierCapIds = useMemo(() => {
    return enrichedPositions
      .map((pos) => pos.supplierCapId)
      .filter((id): id is string => !!id);
  }, [enrichedPositions]);

  const { transactions, isLoading: historyLoading } = useUserActivity(
    userAddress,
    undefined,
    undefined,
    supplierCapIds
  );

  const uniqueCapIds = useMemo(() => {
    const capIds = new Set(
      enrichedPositions
        .map((pos) => pos.supplierCapId)
        .filter((id): id is string => id !== undefined)
    );
    return Array.from(capIds);
  }, [enrichedPositions]);

  const [selectedCapId, setSelectedCapId] = useState<string | null>(
    uniqueCapIds.length > 0 ? uniqueCapIds[0] : null
  );

  useEffect(() => {
    if (
      uniqueCapIds.length > 0 &&
      (!selectedCapId || !uniqueCapIds.includes(selectedCapId))
    ) {
      setSelectedCapId(uniqueCapIds[0]);
    } else if (uniqueCapIds.length === 0) {
      setSelectedCapId(null);
    }
  }, [uniqueCapIds, selectedCapId]);

  const filteredPositions = useMemo(() => {
    if (uniqueCapIds.length <= 1) {
      return enrichedPositions;
    }
    if (!selectedCapId) {
      return [];
    }
    return enrichedPositions.filter(
      (pos) => pos.supplierCapId === selectedCapId
    );
  }, [enrichedPositions, selectedCapId, uniqueCapIds.length]);

  const currentPositionForPool = useMemo(() => {
    if (!selectedPool) return 0;
    const position = enrichedPositions.find((p) => p.asset === selectedPool.asset);
    if (!position) return 0;
    const match = position.balanceFormatted.match(/^([\d.,]+)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) || 0 : 0;
  }, [enrichedPositions, selectedPool]);

  const isWhatIfMode = pendingDepositAmount && parseFloat(pendingDepositAmount) > 0;
  const displayAmount = isWhatIfMode ? pendingDepositAmount : manualAmount;
  const depositAmount = parseFloat(displayAmount) || 0;

  const currentAPY = selectedPool?.ui?.aprSupplyPct ?? 0;
  const ic = selectedPool?.protocolConfig?.interest_config;
  const mc = selectedPool?.protocolConfig?.margin_pool_config;

  let optimisticAPY = currentAPY;
  let pessimisticAPY = currentAPY;

  if (ic && mc) {
    const optimalU = ic.optimal_utilization;
    const baseRate = ic.base_rate;
    const baseSlope = ic.base_slope;
    const spread = mc.protocol_spread;

    const optimalBorrowAPY = baseRate + baseSlope * optimalU;
    optimisticAPY = optimalBorrowAPY * optimalU * (1 - spread) * 100;

    const lowUtil = optimalU * 0.25;
    const lowBorrowAPY = baseRate + baseSlope * lowUtil;
    pessimisticAPY = lowBorrowAPY * lowUtil * (1 - spread) * 100;
  }

  const chartData = useMemo(
    () => generateProjectionData(depositAmount, currentPositionForPool, currentAPY, pessimisticAPY, optimisticAPY),
    [depositAmount, currentPositionForPool, currentAPY, pessimisticAPY, optimisticAPY]
  );

  const totalAmount = depositAmount + currentPositionForPool;
  const dailyEarnings = (totalAmount * (currentAPY / 100)) / 365;
  const monthlyEarnings = (totalAmount * (currentAPY / 100)) / 12;
  const yearlyTotal = totalAmount * (1 + currentAPY / 100);

  const formatValue = (num: number) => {
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatEarnings = (num: number) => {
    if (num < 0.0001) return num.toFixed(8);
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isEnriching = enrichedPositions.some((pos) => pos.isLoading);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
    if (active && payload && payload.length && selectedPool) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-400 mb-2">At {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatValue(entry.value)} {selectedPool.asset}
            </p>
          ))}
          <p className="text-xs text-slate-500 mt-1 border-t border-slate-700 pt-1">
            +{formatEarnings(payload[0]?.value - totalAmount || 0)} earned
          </p>
        </div>
      );
    }
    return null;
  };

  const hasPosition = currentPositionForPool > 0;
  const showCalculator = totalAmount > 0 || manualAmount;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: POSITION SUMMARY (Top)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          Position Summary
        </div>

        {isLoading || isEnriching ? (
          <div className="flex items-center justify-center py-4 text-slate-400 text-sm">
            <div className="w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mr-2" />
            {isLoading ? "Loading..." : "Calculating..."}
          </div>
        ) : error ? (
          <div className="text-rose-400 text-sm py-2">
            Error: {error.message}
          </div>
        ) : !userAddress ? (
          <div className="text-slate-500 text-sm py-2">
            Connect wallet to view positions
          </div>
        ) : positions.length === 0 ? (
          <div className="text-slate-500 text-sm py-2">
            No positions yet — make your first deposit above
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* SupplierCap */}
            {uniqueCapIds.length >= 1 && (
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <span>Cap:</span>
                <a
                  href={`${explorerUrl}/object/${uniqueCapIds[0]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {truncateAddress(uniqueCapIds[0])}
                  <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button
                  onClick={() => copyToClipboard(uniqueCapIds[0])}
                  className="px-1 py-0.5 bg-slate-700/50 hover:bg-slate-600/50 rounded text-slate-400 text-[9px]"
                >
                  Copy
                </button>
              </div>
            )}

            {/* Positions List */}
            {filteredPositions.map((pos) => {
              const currentBalance = pos.currentValueFromChain || pos.balanceFormatted;
              const interestEarned = pos.interestEarned || "—";

              return (
                <div
                  key={`${pos.supplierCapId}-${pos.asset}`}
                  className="flex items-center justify-between px-3 py-2.5 bg-slate-700/40 rounded-lg border border-slate-600/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{pos.asset}</span>
                    <span className="text-sm text-teal-400 font-medium">{currentBalance}</span>
                  </div>
                  <span className="text-sm text-emerald-400 font-medium">+{interestEarned}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: EARNINGS PROJECTION (Primary - Middle)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* Connector Cue when previewing deposit */}
        {isWhatIfMode && (
          <div className="flex items-center justify-center gap-2 py-2 mb-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 animate-pulse-subtle">
            <span className="text-xs text-emerald-400 font-medium">
              Previewing impact of this deposit ↓
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold rounded">
              +{depositAmount} {selectedPool?.asset}
            </span>
          </div>
        )}

        <div className={`flex-1 flex flex-col rounded-lg p-3 ${isWhatIfMode ? 'bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/20' : 'bg-slate-700/20 border border-slate-700/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-slate-300">
                {isWhatIfMode ? "Projected Earnings (after deposit)" : "Earnings Projection"}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold">
              {currentAPY.toFixed(2)}% APY
            </span>
          </div>

          {/* Manual input when not in What-If mode */}
          {!isWhatIfMode && !hasPosition && (
            <div className="relative mb-3">
              <input
                type="number"
                value={manualAmount}
                onChange={(e) => setManualAmount(e.target.value)}
                placeholder="Enter amount to preview earnings..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all pr-16"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 text-xs font-medium">
                {selectedPool?.asset}
              </span>
            </div>
          )}

          {/* Show chart/stats or empty state */}
          {showCalculator && selectedPool ? (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Chart */}
              <div className="flex-1 min-h-[140px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorHighCalc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCurrentCalc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="colorLowCalc" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) => {
                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
                        if (v < 1) return v.toFixed(2);
                        return v.toFixed(0);
                      }}
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={40}
                      domain={[totalAmount * 0.995, 'auto']}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} iconType="line" />
                    {isWhatIfMode && currentPositionForPool > 0 && (
                      <Area
                        type="monotone"
                        dataKey="baseline"
                        name="Current Only"
                        stroke="#64748b"
                        fill="transparent"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    <Area type="monotone" dataKey="high" name="High Util." stroke="#22d3ee" fill="url(#colorHighCalc)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="current" name="Current APY" stroke="#10b981" fill="url(#colorCurrentCalc)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="low" name="Low Util." stroke="#6366f1" fill="url(#colorLowCalc)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-white/50 mb-0.5">Daily</div>
                  <div className="text-xs font-semibold text-emerald-400">+{formatEarnings(dailyEarnings)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-white/50 mb-0.5">Monthly</div>
                  <div className="text-xs font-semibold text-emerald-400">+{formatEarnings(monthlyEarnings)}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2 text-center">
                  <div className="text-[9px] text-white/50 mb-0.5">1 Year Total</div>
                  <div className="text-xs font-semibold text-cyan-400">{formatValue(yearlyTotal)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
              <CalculatorIcon className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-500">Enter an amount above to preview earnings</p>
              <p className="text-[10px] text-slate-600 mt-1">Or make a deposit to start earning</p>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 3: TRANSACTION HISTORY (Bottom - Collapsed by Default)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0">
        <button
          onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-slate-300 transition-colors py-1"
        >
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-3.5 h-3.5" />
            <span>Transaction History</span>
            {transactions && transactions.length > 0 && (
              <span className="px-1 py-0.5 bg-slate-700 rounded text-[9px] text-slate-400">
                {transactions.length}
              </span>
            )}
          </div>
          {isHistoryExpanded ? (
            <ChevronUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronDownIcon className="w-3.5 h-3.5" />
          )}
        </button>

        {isHistoryExpanded && (
          <div className="mt-2 max-h-24 overflow-y-auto animate-fade-in">
            {historyLoading ? (
              <div className="text-center py-2 text-slate-500 text-xs">Loading...</div>
            ) : !transactions || transactions.length === 0 ? (
              <div className="text-center py-2 text-slate-600 text-xs">No transactions yet</div>
            ) : (
              <div className="space-y-1">
                {transactions.slice(0, 5).map((tx) => (
                  <a
                    key={tx.id}
                    href={`${explorerUrl}/txblock/${tx.transactionDigest}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between px-2 py-1.5 bg-slate-700/30 rounded border border-slate-700/30 hover:bg-slate-700/40 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${tx.type === "supply" ? "text-emerald-400" : "text-teal-400"}`}>
                        {tx.type === "supply" ? "↓" : "↑"}
                      </span>
                      <span className="text-xs text-slate-300">{tx.formattedAmount}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 group-hover:text-cyan-400">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PositionsWithCalculator;
