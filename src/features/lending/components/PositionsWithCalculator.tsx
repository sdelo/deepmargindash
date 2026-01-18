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
import { ChevronDownIcon, ChevronUpIcon, CalculatorIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

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
  highAPY: number,
  showIncremental: boolean = false,
  period: "30d" | "1y" = "30d"
) {
  const dataPoints: {
    day: number;
    label: string;
    current: number;
    low: number;
    high: number;
    baseline?: number;
    incrementalEarnings?: number;
    incrementalEarningsHigh?: number;
    incrementalEarningsLow?: number;
  }[] = [];

  const totalAmount = depositAmount + existingPosition;
  
  // Use different intervals based on period
  const intervals = period === "30d" 
    ? [
        { day: 1, label: "1d" },
        { day: 3, label: "3d" },
        { day: 7, label: "1w" },
        { day: 14, label: "2w" },
        { day: 21, label: "3w" },
        { day: 30, label: "30d" },
      ]
    : [
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

    // Calculate EARNINGS (interest only), not total balance
    const currentEarnings = totalAmount * (Math.pow(1 + currentDailyRate, day) - 1);
    const lowEarnings = totalAmount * (Math.pow(1 + lowDailyRate, day) - 1);
    const highEarnings = totalAmount * (Math.pow(1 + highDailyRate, day) - 1);
    
    const baselineEarnings = existingPosition > 0 
      ? existingPosition * (Math.pow(1 + currentDailyRate, day) - 1)
      : undefined;

    // Calculate incremental earnings from just the deposit amount
    const depositEarningsCurrent = depositAmount * (Math.pow(1 + currentDailyRate, day) - 1);
    const depositEarningsHigh = depositAmount * (Math.pow(1 + highDailyRate, day) - 1);
    const depositEarningsLow = depositAmount * (Math.pow(1 + lowDailyRate, day) - 1);

    dataPoints.push({
      day,
      label,
      current: currentEarnings,
      low: lowEarnings,
      high: highEarnings,
      baseline: baselineEarnings,
      incrementalEarnings: showIncremental && depositAmount > 0 ? depositEarningsCurrent : undefined,
      incrementalEarningsHigh: showIncremental && depositAmount > 0 ? depositEarningsHigh : undefined,
      incrementalEarningsLow: showIncremental && depositAmount > 0 ? depositEarningsLow : undefined,
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
  const { explorerUrl, indexerStatus } = useAppNetwork();
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [projectionPeriod, setProjectionPeriod] = useState<"30d" | "1y">("30d");

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
    () => generateProjectionData(depositAmount, currentPositionForPool, currentAPY, pessimisticAPY, optimisticAPY, isWhatIfMode, projectionPeriod),
    [depositAmount, currentPositionForPool, currentAPY, pessimisticAPY, optimisticAPY, isWhatIfMode, projectionPeriod]
  );

  const totalAmount = depositAmount + currentPositionForPool;
  const dailyEarnings = (totalAmount * (currentAPY / 100)) / 365;
  const monthlyEarnings = (totalAmount * (currentAPY / 100)) / 12;
  const yearlyEarnings = totalAmount * (currentAPY / 100);
  
  // Incremental earnings from just the deposit (the delta)
  const incrementalDailyEarnings = (depositAmount * (currentAPY / 100)) / 365;
  const incrementalMonthlyEarnings = (depositAmount * (currentAPY / 100)) / 12;
  const incrementalYearlyEarnings = depositAmount * (currentAPY / 100);

  const formatValue = (num: number) => {
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  const formatEarnings = (num: number) => {
    const absNum = Math.abs(num);
    const sign = num < 0 ? '-' : '';
    if (absNum >= 1000) return sign + absNum.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (absNum >= 1) return sign + absNum.toFixed(2);
    if (absNum >= 0.01) return sign + absNum.toFixed(4);
    if (absNum >= 0.0001) return sign + absNum.toFixed(6);
    if (absNum === 0) return '0';
    return sign + absNum.toFixed(8);
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const isEnriching = enrichedPositions.some((pos) => pos.isLoading);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string; dataKey?: string }>; label?: string }) => {
    if (active && payload && payload.length && selectedPool) {
      // Check if we're showing incremental data
      const hasIncremental = payload.some(p => p.dataKey?.includes('incremental'));
      
      return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-xs text-slate-400 mb-2">Earnings at {label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: +{formatEarnings(entry.value)} {selectedPool.asset}
            </p>
          ))}
          {isWhatIfMode && depositAmount > 0 && (
            <p className="text-[10px] text-emerald-400 mt-1 border-t border-slate-700 pt-1">
              From your {formatValue(totalAmount)} {selectedPool.asset} position
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const hasPosition = currentPositionForPool > 0;
  const showCalculator = totalAmount > 0 || manualAmount;

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Indexer Health Warning - Compact Chip */}
      {!indexerStatus.isHealthy && !indexerStatus.isLoading && (
        <div className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit" title={indexerStatus.lagDescription || "Interest earned may not be calculated accurately. Balances shown are still accurate."}>
          <ExclamationTriangleIcon className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] text-amber-300 font-medium">Data delayed: {indexerStatus.lagDescription?.match(/\d+d/)?.[0] || "~2d"}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 0: PENDING DEPOSIT INDICATOR (When in What-If Mode) - Compact One-Line
          ═══════════════════════════════════════════════════════════════════════ */}
      {isWhatIfMode && selectedPool && (
        <div className="flex-shrink-0 animate-fade-in">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">
              +{depositAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {selectedPool.asset} pending deposit
            </span>
            {currentPositionForPool > 0 && (
              <span className="text-[10px] text-slate-500 ml-auto">
                → {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} total
              </span>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1: POSITION SUMMARY (Top)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-shrink-0">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          {isWhatIfMode ? "Current Position" : "Position Summary"}
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
          /* ═══════════════════════════════════════════════════════════════════
             EMPTY STATE: Contextual Education (not a void)
             ═══════════════════════════════════════════════════════════════════ */
          <div className="space-y-3">
            {/* What you'll see after deposit */}
            <div className="bg-gradient-to-br from-emerald-500/5 to-cyan-500/5 rounded-lg p-3 border border-emerald-500/20">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-xs">→</span>
                </div>
                <div>
                  <p className="text-xs text-slate-300 font-medium mb-1">After your first deposit:</p>
                  <ul className="space-y-1 text-[11px] text-slate-400">
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                      Live balance with accrued interest
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                      Earnings projection chart
                    </li>
                    <li className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400"></span>
                      Transaction history
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Pool snapshot - show real data even before deposit */}
            {selectedPool && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Current Pool Stats</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-[10px] text-slate-500">Total Supplied</div>
                    <div className="text-sm font-semibold text-white">
                      {selectedPool.state.supply.toLocaleString(undefined, { maximumFractionDigits: 0 })} 
                      <span className="text-[10px] text-slate-500 ml-1">{selectedPool.asset}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500">Active Suppliers</div>
                    <div className="text-sm font-semibold text-cyan-400">
                      {/* This is placeholder - ideally fetch from indexer */}
                      Earning {selectedPool.ui.aprSupplyPct.toFixed(2)}%
                    </div>
                  </div>
                </div>
              </div>
            )}
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

            {/* ═══════════════════════════════════════════════════════════════════
                EXIT STATUS INDICATOR - Can I withdraw my full position?
            ═══════════════════════════════════════════════════════════════════ */}
            {selectedPool && currentPositionForPool > 0 && (() => {
              const availableLiquidity = selectedPool.state.supply - selectedPool.state.borrow;
              const canWithdrawFull = availableLiquidity >= currentPositionForPool;
              const withdrawablePct = Math.min((availableLiquidity / currentPositionForPool) * 100, 100);
              const withdrawableAmount = Math.min(availableLiquidity, currentPositionForPool);
              
              return (
                <div className={`mt-2 px-3 py-2 rounded-lg border ${
                  canWithdrawFull 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {canWithdrawFull ? (
                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-400" />
                      )}
                      <span className={`text-xs font-medium ${canWithdrawFull ? 'text-emerald-300' : 'text-amber-300'}`}>
                        Exit Status
                      </span>
                    </div>
                    <span className={`text-xs font-semibold ${canWithdrawFull ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {canWithdrawFull ? '100%' : `${withdrawablePct.toFixed(0)}%`} available
                    </span>
                  </div>
                  <p className={`text-[10px] mt-1 ${canWithdrawFull ? 'text-emerald-200/60' : 'text-amber-200/70'}`}>
                    {canWithdrawFull 
                      ? 'You can withdraw your full position right now.'
                      : `Only ${withdrawableAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${selectedPool.asset} available. Wait for borrowers to repay for full exit.`
                    }
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2: EARNINGS PROJECTION (Primary - Middle)
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className={`flex-1 flex flex-col rounded-lg p-3 ${isWhatIfMode ? 'bg-gradient-to-b from-emerald-500/5 to-transparent border border-emerald-500/20' : 'bg-slate-700/20 border border-slate-700/30'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalculatorIcon className="w-4 h-4 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-300">
                  {isWhatIfMode 
                    ? "Incremental Earnings from Deposit" 
                    : "Projection (Variable APY)"}
                </span>
                <span className="text-[9px] text-slate-500">APY changes with utilization — not guaranteed</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Period Toggle */}
              <div className="flex items-center bg-slate-800/60 rounded-lg p-0.5">
                <button
                  onClick={() => setProjectionPeriod("30d")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    projectionPeriod === "30d"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  30d
                </button>
                <button
                  onClick={() => setProjectionPeriod("1y")}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    projectionPeriod === "1y"
                      ? "bg-cyan-500/20 text-cyan-300"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  1y
                </button>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${currentAPY < 0.01 ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                {currentAPY.toFixed(2)}% APY
              </span>
            </div>
          </div>
          
          {/* Zero APY Warning */}
          {currentAPY < 0.01 && showCalculator && (
            <div className="mb-2 px-2 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-[10px] text-amber-300">
                <span className="font-semibold">No borrowers yet.</span> Current earnings are 0. Chart shows potential earnings if utilization increases.
              </p>
            </div>
          )}

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
                        // Format earnings values with + prefix
                        const prefix = v > 0 ? '+' : '';
                        if (v >= 1000000) return `${prefix}${(v / 1000000).toFixed(1)}M`;
                        if (v >= 1000) return `${prefix}${(v / 1000).toFixed(1)}k`;
                        if (v >= 100) return `${prefix}${v.toFixed(0)}`;
                        if (v >= 10) return `${prefix}${v.toFixed(1)}`;
                        if (v >= 1) return `${prefix}${v.toFixed(2)}`;
                        if (v >= 0.01) return `${prefix}${v.toFixed(3)}`;
                        if (v >= 0.001) return `${prefix}${v.toFixed(4)}`;
                        return `${prefix}${v.toFixed(6)}`;
                      }}
                      tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 9 }}
                      axisLine={false}
                      tickLine={false}
                      width={55}
                      domain={[0, 'auto']}
                      allowDecimals={true}
                      tickCount={5}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: "9px", paddingTop: "4px" }} iconType="line" />
                    {isWhatIfMode && currentPositionForPool > 0 && (
                      <Area
                        type="monotone"
                        dataKey="baseline"
                        name="Existing Position"
                        stroke="#64748b"
                        fill="transparent"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        dot={false}
                      />
                    )}
                    <Area type="monotone" dataKey="high" name={`High (${optimisticAPY.toFixed(1)}%)`} stroke="#22d3ee" fill="url(#colorHighCalc)" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="current" name={`Current (${currentAPY.toFixed(1)}%)`} stroke={currentAPY < 0.01 ? "#64748b" : "#10b981"} fill={currentAPY < 0.01 ? "transparent" : "url(#colorCurrentCalc)"} strokeWidth={currentAPY < 0.01 ? 1 : 2} strokeDasharray={currentAPY < 0.01 ? "4 4" : undefined} dot={false} />
                    <Area type="monotone" dataKey="low" name={`Low (${pessimisticAPY.toFixed(1)}%)`} stroke="#6366f1" fill="url(#colorLowCalc)" strokeWidth={1.5} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Row - Show values relevant to selected period */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className={`rounded-lg p-2 text-center ${isWhatIfMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                  <div className="text-[9px] text-white/50 mb-0.5">{isWhatIfMode ? 'Daily (from deposit)' : 'Est. Daily'}</div>
                  <div className="text-xs font-semibold text-emerald-400">
                    +{formatEarnings(isWhatIfMode ? incrementalDailyEarnings : dailyEarnings)}
                  </div>
                </div>
                <div className={`rounded-lg p-2 text-center ${isWhatIfMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                  <div className="text-[9px] text-white/50 mb-0.5">{isWhatIfMode ? 'At 30d (from deposit)' : (projectionPeriod === "30d" ? 'Est. at 30d' : 'Est. Monthly')}</div>
                  <div className="text-xs font-semibold text-emerald-400">
                    +{formatEarnings(isWhatIfMode ? incrementalMonthlyEarnings : monthlyEarnings)}
                  </div>
                </div>
                <div className={`rounded-lg p-2 text-center ${isWhatIfMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'}`}>
                  <div className="text-[9px] text-white/50 mb-0.5">
                    {isWhatIfMode 
                      ? (projectionPeriod === "30d" ? 'At 30d (from deposit)' : '1 Year (from deposit)')
                      : (projectionPeriod === "30d" ? 'Est. at 30d' : 'Est. at 1 Year')}
                  </div>
                  <div className="text-xs font-semibold text-cyan-400">
                    {projectionPeriod === "30d" 
                      ? `+${formatEarnings(isWhatIfMode ? incrementalMonthlyEarnings : monthlyEarnings)}`
                      : (isWhatIfMode ? `+${formatEarnings(incrementalYearlyEarnings)}` : `+${formatEarnings(yearlyEarnings)}`)}
                  </div>
                </div>
              </div>

              {/* APY Assumption Disclaimer - Clear framing */}
              <div className="mt-2 px-3 py-2 bg-slate-800/60 rounded-lg border border-slate-700/40">
                <div className="text-[10px] text-slate-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3 h-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-amber-300">How the projection band works</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[9px]">
                    <div className="flex items-start gap-1">
                      <span className="inline-block w-2 h-0.5 bg-cyan-400 mt-1.5 shrink-0"></span>
                      <div>
                        <span className="font-medium text-cyan-300">High</span>
                        <span className="text-slate-400 block">If pool hits optimal utilization ({(selectedPool?.protocolConfig?.interest_config?.optimal_utilization || 0.7) * 100}%)</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="inline-block w-2 h-0.5 bg-emerald-400 mt-1.5 shrink-0"></span>
                      <div>
                        <span className="font-medium text-emerald-300">Current</span>
                        <span className="text-slate-400 block">Today's APY stays constant</span>
                      </div>
                    </div>
                    <div className="flex items-start gap-1">
                      <span className="inline-block w-2 h-0.5 bg-indigo-400 mt-1.5 shrink-0"></span>
                      <div>
                        <span className="font-medium text-indigo-300">Low</span>
                        <span className="text-slate-400 block">If borrowing demand drops 75%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-slate-500 text-[9px] pt-1 border-t border-slate-700/50 italic">
                    Variable APY — actual returns depend on borrower demand and may differ significantly
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* ═══════════════════════════════════════════════════════════════════
               CALCULATOR EMPTY STATE: Interactive preview prompt
               ═══════════════════════════════════════════════════════════════════ */
            <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
              <div className="relative mb-3">
                <CalculatorIcon className="w-10 h-10 text-slate-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-cyan-500/50 animate-breathe"></div>
              </div>
              <p className="text-sm text-slate-400 font-medium mb-1">Enter an amount above to preview earnings</p>
              <p className="text-[10px] text-slate-600 max-w-[200px]">
                Or make a deposit to start earning
              </p>
              
              {/* Quick example calculation */}
              {selectedPool && (
                <div className="mt-4 px-4 py-2 bg-white/5 rounded-lg border border-white/10">
                  <p className="text-[10px] text-slate-500 mb-1">Example with 100 {selectedPool.asset}:</p>
                  <p className="text-xs text-emerald-400 font-medium">
                    +{((100 * (selectedPool.ui.aprSupplyPct / 100)) / 365).toFixed(4)} {selectedPool.asset}/day
                  </p>
                </div>
              )}
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
