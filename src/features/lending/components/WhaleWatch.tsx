import React from "react";
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  fetchLoanBorrowed,
  fetchLoanRepaid,
  type AssetSuppliedEventResponse,
  type AssetWithdrawnEventResponse,
  type LoanBorrowedEventResponse,
  type LoanRepaidEventResponse,
} from "../api/events";
import { type TimeRange, timeRangeToParams } from "../api/types";
import TimeRangeSelector from "../../../components/TimeRangeSelector";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  ConcentrationIcon,
  CheckIcon,
  AlertIcon,
  BoltIcon,
  DiamondIcon,
  BorrowersIcon,
  InsightIcon,
  ErrorIcon,
} from "../../../components/ThemedIcons";

interface WhaleWatchProps {
  poolId?: string;
  decimals?: number;
  asset?: string; // e.g., "SUI", "DBUSDC"
}

interface ParticipantStats {
  address: string;
  netAmount: number;
  supplyAmount: number;
  withdrawAmount: number;
  borrowAmount: number;
  repayAmount: number;
  transactionCount: number;
}

export function WhaleWatch({ poolId, decimals = 9, asset = "" }: WhaleWatchProps) {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<TimeRange>("ALL");
  const [suppliedEvents, setSuppliedEvents] = React.useState<
    AssetSuppliedEventResponse[]
  >([]);
  const [withdrawnEvents, setWithdrawnEvents] = React.useState<
    AssetWithdrawnEventResponse[]
  >([]);
  const [borrowedEvents, setBorrowedEvents] = React.useState<
    LoanBorrowedEventResponse[]
  >([]);
  const [repaidEvents, setRepaidEvents] = React.useState<
    LoanRepaidEventResponse[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch all events - refetch when timeRange, poolId, or serverUrl changes
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const params = {
          ...timeRangeToParams(timeRange),
          ...(poolId && { margin_pool_id: poolId }),
          limit: 10000,
        };

        const [supplied, withdrawn, borrowed, repaid] = await Promise.all([
          fetchAssetSupplied(params),
          fetchAssetWithdrawn(params),
          fetchLoanBorrowed(params),
          fetchLoanRepaid(params),
        ]);

        setSuppliedEvents(supplied);
        setWithdrawnEvents(withdrawn);
        setBorrowedEvents(borrowed);
        setRepaidEvents(repaid);
        setError(null);
      } catch (err) {
        console.error("Error fetching whale watch data:", err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [timeRange, poolId, serverUrl]);

  // Calculate top suppliers
  const topSuppliers = React.useMemo(() => {
    const supplierMap = new Map<string, ParticipantStats>();

    // Aggregate supplies
    suppliedEvents.forEach((event) => {
      const existing = supplierMap.get(event.supplier) || {
        address: event.supplier,
        netAmount: 0,
        supplyAmount: 0,
        withdrawAmount: 0,
        borrowAmount: 0,
        repayAmount: 0,
        transactionCount: 0,
      };
      const amount = parseFloat(event.amount) / 10 ** decimals;
      existing.supplyAmount += amount;
      existing.netAmount += amount;
      existing.transactionCount += 1;
      supplierMap.set(event.supplier, existing);
    });

    // Subtract withdrawals
    withdrawnEvents.forEach((event) => {
      const existing = supplierMap.get(event.supplier);
      if (existing) {
        const amount = parseFloat(event.amount) / 10 ** decimals;
        existing.withdrawAmount += amount;
        existing.netAmount -= amount;
        existing.transactionCount += 1;
      }
    });

    return Array.from(supplierMap.values())
      .filter((s) => s.netAmount > 0)
      .sort((a, b) => b.netAmount - a.netAmount)
      .slice(0, 5);
  }, [suppliedEvents, withdrawnEvents, decimals]);

  // Calculate top borrowers
  const topBorrowers = React.useMemo(() => {
    const borrowerMap = new Map<string, ParticipantStats>();

    // Aggregate borrows
    borrowedEvents.forEach((event) => {
      const existing = borrowerMap.get(event.margin_manager_id) || {
        address: event.margin_manager_id,
        netAmount: 0,
        supplyAmount: 0,
        withdrawAmount: 0,
        borrowAmount: 0,
        repayAmount: 0,
        transactionCount: 0,
      };
      const amount = parseFloat(event.loan_amount) / 10 ** decimals;
      existing.borrowAmount += amount;
      existing.netAmount += amount;
      existing.transactionCount += 1;
      borrowerMap.set(event.margin_manager_id, existing);
    });

    // Subtract repayments
    repaidEvents.forEach((event) => {
      const existing = borrowerMap.get(event.margin_manager_id);
      if (existing) {
        const amount = parseFloat(event.repay_amount) / 10 ** decimals;
        existing.repayAmount += amount;
        existing.netAmount -= amount;
        existing.transactionCount += 1;
      }
    });

    return Array.from(borrowerMap.values())
      .filter((b) => b.netAmount > 0)
      .sort((a, b) => b.netAmount - a.netAmount)
      .slice(0, 5);
  }, [borrowedEvents, repaidEvents, decimals]);

  // Calculate concentration metrics
  const concentration = React.useMemo(() => {
    const totalSupply = topSuppliers.reduce((sum, s) => sum + s.netAmount, 0);
    const totalBorrow = topBorrowers.reduce((sum, b) => sum + b.netAmount, 0);

    const top1Supply = topSuppliers.length > 0 ? topSuppliers[0].netAmount : 0;
    const top1Borrow = topBorrowers.length > 0 ? topBorrowers[0].netAmount : 0;

    const supplyConcentration =
      totalSupply > 0 ? (top1Supply / totalSupply) * 100 : 0;
    const borrowConcentration =
      totalBorrow > 0 ? (top1Borrow / totalBorrow) * 100 : 0;

    return {
      totalSupply,
      totalBorrow,
      top1Supply,
      top1Borrow,
      supplyConcentration,
      borrowConcentration,
    };
  }, [topSuppliers, topBorrowers]);

  // Determine risk level
  const getRiskLevel = (concentrationPercent: number) => {
    if (concentrationPercent > 70)
      return { label: "Very High", color: "red", icon: <AlertIcon size={20} variant="danger" /> };
    if (concentrationPercent > 50)
      return { label: "High", color: "orange", icon: <AlertIcon size={20} variant="warning" /> };
    if (concentrationPercent > 30)
      return { label: "Moderate", color: "yellow", icon: <BoltIcon size={20} /> };
    return { label: "Low", color: "green", icon: <CheckIcon size={20} /> };
  };

  const supplyRisk = getRiskLevel(concentration.supplyConcentration);
  const borrowRisk = getRiskLevel(concentration.borrowConcentration);

  const formatAddress = (addr: string) => {
    if (addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ConcentrationIcon size={32} /> Concentration
          </h2>
          <p className="text-sm text-white/60">
            Position concentration risk - Top suppliers vs. borrowers
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {isLoading ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-3 border-cyan-500 border-t-transparent rounded-full"></div>
            <div className="text-white/60">Loading concentration data...</div>
          </div>
        </div>
      ) : error ? (
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-2 flex justify-center"><ErrorIcon size={32} /></div>
            <div className="text-red-300 font-semibold mb-1">
              Error loading data
            </div>
            <div className="text-white/60 text-sm">{error.message}</div>
          </div>
        </div>
      ) : (
        <>
          {/* Concentration Risk Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supply Concentration */}
            <div
              className={`bg-white/5 rounded-2xl p-6 border ${
                supplyRisk.color === "red"
                  ? "border-red-500/50 shadow-lg shadow-red-500/10"
                  : supplyRisk.color === "orange"
                    ? "border-orange-500/30"
                    : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {supplyRisk.icon} Supply Concentration
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    supplyRisk.color === "red"
                      ? "bg-red-500/20 text-red-300"
                      : supplyRisk.color === "orange"
                        ? "bg-orange-500/20 text-orange-300"
                        : supplyRisk.color === "yellow"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {supplyRisk.label} Risk
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-white/60">
                      Top Supplier Share
                    </span>
                    <span className="text-3xl font-bold text-white">
                      {concentration.supplyConcentration.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        supplyRisk.color === "red"
                          ? "bg-gradient-to-r from-red-600 to-red-400"
                          : supplyRisk.color === "orange"
                            ? "bg-gradient-to-r from-orange-600 to-orange-400"
                            : "bg-gradient-to-r from-cyan-500 to-blue-500"
                      }`}
                      style={{
                        width: `${Math.min(concentration.supplyConcentration, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Top 5 Supply:</span>
                    <span className="text-white font-semibold">
                      {concentration.totalSupply.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Borrow Concentration */}
            <div
              className={`bg-white/5 rounded-2xl p-6 border ${
                borrowRisk.color === "red"
                  ? "border-red-500/50 shadow-lg shadow-red-500/10"
                  : borrowRisk.color === "orange"
                    ? "border-orange-500/30"
                    : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  {borrowRisk.icon} Borrow Concentration
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    borrowRisk.color === "red"
                      ? "bg-red-500/20 text-red-300"
                      : borrowRisk.color === "orange"
                        ? "bg-orange-500/20 text-orange-300"
                        : borrowRisk.color === "yellow"
                          ? "bg-yellow-500/20 text-yellow-300"
                          : "bg-green-500/20 text-green-300"
                  }`}
                >
                  {borrowRisk.label} Risk
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-white/60">
                      Top Borrower Share
                    </span>
                    <span className="text-3xl font-bold text-white">
                      {concentration.borrowConcentration.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        borrowRisk.color === "red"
                          ? "bg-gradient-to-r from-red-600 to-red-400"
                          : borrowRisk.color === "orange"
                            ? "bg-gradient-to-r from-orange-600 to-orange-400"
                            : "bg-gradient-to-r from-amber-500 to-orange-500"
                      }`}
                      style={{
                        width: `${Math.min(concentration.borrowConcentration, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Top 5 Borrow:</span>
                    <span className="text-white font-semibold">
                      {concentration.totalBorrow.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Suppliers */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-cyan-200 mb-4 flex items-center gap-2">
                <DiamondIcon size={24} /> Top 5 Suppliers
              </h3>

              {topSuppliers.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  No suppliers found in this period
                </div>
              ) : (
                <div className="space-y-3">
                  {topSuppliers.map((supplier, idx) => (
                    <div
                      key={supplier.address}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-cyan-500/30 transition-colors"
                    >
                      {/* Rank */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0
                            ? "bg-yellow-500/20 text-yellow-300"
                            : idx === 1
                              ? "bg-gray-400/20 text-gray-300"
                              : idx === 2
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white/80 truncate">
                          {formatAddress(supplier.address)}
                        </div>
                        <div className="text-xs text-white/40">
                          {supplier.transactionCount} transactions
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {supplier.netAmount.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                          {asset && <span className="text-xs text-white/60 ml-1">{asset}</span>}
                        </div>
                        <div className="text-xs text-cyan-300">
                          {(
                            (supplier.netAmount / concentration.totalSupply) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Borrowers */}
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-bold text-amber-200 mb-4 flex items-center gap-2">
                <BorrowersIcon size={24} /> Top 5 Borrowers
              </h3>

              {topBorrowers.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  No borrowers found in this period
                </div>
              ) : (
                <div className="space-y-3">
                  {topBorrowers.map((borrower, idx) => (
                    <div
                      key={borrower.address}
                      className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-amber-500/30 transition-colors"
                    >
                      {/* Rank */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0
                            ? "bg-yellow-500/20 text-yellow-300"
                            : idx === 1
                              ? "bg-gray-400/20 text-gray-300"
                              : idx === 2
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {idx + 1}
                      </div>

                      {/* Address */}
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-xs text-white/80 truncate">
                          {formatAddress(borrower.address)}
                        </div>
                        <div className="text-xs text-white/40">
                          {borrower.transactionCount} transactions
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className="font-bold text-white">
                          {borrower.netAmount.toLocaleString(undefined, {
                            maximumFractionDigits: 0,
                          })}
                          {asset && <span className="text-xs text-white/60 ml-1">{asset}</span>}
                        </div>
                        <div className="text-xs text-amber-300">
                          {(
                            (borrower.netAmount / concentration.totalBorrow) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Risk Interpretation */}
          <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30">
            <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <InsightIcon size={24} /> What This Means
            </h3>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex gap-3">
                <span className="shrink-0"><AlertIcon size={18} variant="warning" /></span>
                <div>
                  <span className="font-semibold text-white">
                    Supply Concentration:
                  </span>{" "}
                  {concentration.supplyConcentration > 50 ? (
                    <>
                      <span className="text-orange-300 font-semibold">
                        High risk!
                      </span>{" "}
                      The top supplier controls{" "}
                      {concentration.supplyConcentration.toFixed(1)}% of tracked
                      supply. If they withdraw, liquidity could drop
                      significantly.
                    </>
                  ) : (
                    <>
                      Supply is relatively well-distributed. The top supplier
                      has {concentration.supplyConcentration.toFixed(1)}% of
                      tracked supply, indicating healthy diversification.
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-cyan-400 font-bold shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
                <div>
                  <span className="font-semibold text-white">
                    Borrow Concentration:
                  </span>{" "}
                  {concentration.borrowConcentration > 50 ? (
                    <>
                      <span className="text-orange-300 font-semibold">
                        High risk!
                      </span>{" "}
                      The top borrower has{" "}
                      {concentration.borrowConcentration.toFixed(1)}% of tracked
                      debt. A default could significantly impact the pool.
                    </>
                  ) : (
                    <>
                      Debt is relatively well-distributed. The top borrower has{" "}
                      {concentration.borrowConcentration.toFixed(1)}% of tracked
                      debt, reducing single-point-of-failure risk.
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-green-400 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </span>
                <div>
                  <span className="font-semibold text-white">Note:</span> This
                  shows net positions based on event history in the selected
                  time range. Actual current positions may differ. Lower
                  concentration = lower risk.
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
