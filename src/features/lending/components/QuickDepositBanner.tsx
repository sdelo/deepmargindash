import React from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import {
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { TransactionDetailsModal } from "../../../components/TransactionButton/TransactionDetailsModal";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  createSupplyTransactionInfo,
  createWithdrawTransactionInfo,
} from "../../../utils/transactionInfo";
import type { PoolOverview } from "../types";

// Fallback icons for when dynamic iconUrl is not available
const FALLBACK_ICONS: Record<string, string> = {
  SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
  DBUSDC:
    "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  DEEP: "https://assets.coingecko.com/coins/images/38087/standard/deep.png?1728614086",
  WAL: "https://assets.coingecko.com/coins/images/54016/standard/walrus.jpg?1737525627",
};
// Get icon from pool's dynamic iconUrl or fall back to static icons
const getPoolIcon = (pool: PoolOverview) =>
  pool.ui?.iconUrl || FALLBACK_ICONS[pool.asset] || "";

interface QuickDepositBannerProps {
  pools: PoolOverview[];
  selectedPoolId: string | null;
  onSelectPool: (poolId: string) => void;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onWithdrawAll?: () => void;
  walletBalance?: string;
  depositedBalance?: number;
  suiBalance?: string;
  txStatus?: "idle" | "pending" | "success" | "error";
  onAmountChange?: (amount: string) => void;
  currentPositionBalance?: number; // User's current position in this pool
}

// How It Works Modal
function HowItWorksModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative border border-cyan-500/20 rounded-2xl p-6 max-w-lg mx-4 shadow-2xl animate-fade-in"
        style={{
          background: "linear-gradient(180deg, #0c1a24 0%, #0a1419 100%)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-200/50 hover:text-cyan-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-cyan-100 mb-4 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          How DeepBook Margin Works
        </h2>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-sm font-bold shrink-0">
              1
            </div>
            <div>
              <p className="font-medium text-cyan-100">Supply Assets</p>
              <p className="text-sm text-cyan-200/60 mt-0.5">
                Deposit your tokens to provide liquidity for margin traders.
                Your assets remain in a smart contract vault.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold shrink-0">
              2
            </div>
            <div>
              <p className="font-medium text-cyan-100">Earn Yield</p>
              <p className="text-sm text-cyan-200/60 mt-0.5">
                Borrowers pay interest on their margin positions. Your APY
                increases with pool utilization.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-teal-400 text-sm font-bold shrink-0">
              3
            </div>
            <div>
              <p className="font-medium text-cyan-100">Withdraw Anytime</p>
              <p className="text-sm text-cyan-200/60 mt-0.5">
                Request withdrawals at any time, subject to available liquidity
                in the pool.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Section */}
        <div className="mt-5 pt-4 border-t border-amber-500/20">
          <h3 className="text-sm font-semibold text-amber-300 mb-3 flex items-center gap-2">
            <span>⚠️</span> Understand the Risks
          </h3>
          <div className="space-y-3">
            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
              <p className="font-medium text-cyan-100 text-sm">
                Liquidity Risk
              </p>
              <p className="text-xs text-cyan-200/60 mt-1">
                When pool utilization is high, most assets are lent out. You may
                need to wait for borrowers to repay before you can withdraw.
                Check "Available Liquidity" before depositing.
              </p>
            </div>
            <div className="bg-red-500/5 rounded-lg p-3 border border-red-500/10">
              <p className="font-medium text-cyan-100 text-sm">Bad Debt Risk</p>
              <p className="text-xs text-cyan-200/60 mt-1">
                If a borrower's position becomes insolvent during extreme market
                moves, their collateral may not fully cover their debt. Any
                shortfall is shared proportionally across all suppliers—meaning
                your deposit could lose value.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-cyan-500/20">
          <p className="text-[11px] text-cyan-200/40">
            These are smart contract risks
          </p>
        </div>
      </div>
    </div>
  );
}

export function QuickDepositBanner({
  pools,
  selectedPoolId,
  onSelectPool,
  onDeposit,
  onWithdraw,
  onWithdrawAll,
  walletBalance,
  depositedBalance = 0,
  suiBalance,
  txStatus = "idle",
  onAmountChange,
  currentPositionBalance = 0,
}: QuickDepositBannerProps) {
  const account = useCurrentAccount();
  const { network } = useAppNetwork();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"deposit" | "withdraw">("deposit");
  const [inputAmount, setInputAmount] = React.useState<string>("");
  const [isWithdrawMax, setIsWithdrawMax] = React.useState(false);
  const [showRiskWarning, setShowRiskWarning] = React.useState(true);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);

  const selectedPool = pools.find((p) => p.id === selectedPoolId) ?? pools[0];

  // Parse balances
  const walletBalanceNum = React.useMemo(() => {
    if (!walletBalance) return 0;
    const num = parseFloat(walletBalance.split(" ")[0].replace(/,/g, "")) || 0;
    return Math.floor(num * 100) / 100;
  }, [walletBalance]);

  const suiBalanceNum = React.useMemo(() => {
    if (!suiBalance) return 0;
    return parseFloat(suiBalance.split(" ")[0].replace(/,/g, "")) || 0;
  }, [suiBalance]);

  const maxBalance = mode === "deposit" ? walletBalanceNum : depositedBalance;
  const maxBalanceFormatted =
    mode === "deposit"
      ? walletBalanceNum.toFixed(2)
      : depositedBalance.toLocaleString(undefined, {
          maximumFractionDigits: 6,
        });

  const handleQuickPercent = (percent: number) => {
    const amount = (maxBalance * percent) / 100;
    const roundedAmount = Math.floor(amount * 1000000) / 1000000;
    const amountStr = roundedAmount.toString();
    setInputAmount(amountStr);
    // Track if user selected MAX (100%) in withdraw mode
    setIsWithdrawMax(mode === "withdraw" && percent === 100);
    if (mode === "deposit" && onAmountChange) {
      onAmountChange(amountStr);
    }
  };

  const handleInputChange = (value: string) => {
    setInputAmount(value);
    // Clear the MAX flag when user manually edits
    setIsWithdrawMax(false);
    if (mode === "deposit" && onAmountChange) {
      onAmountChange(value);
    }
  };

  const handleSubmit = () => {
    const v = Number(inputAmount || 0);
    if (!Number.isFinite(v) || v <= 0) return;
    if (mode === "deposit") {
      onDeposit(v);
    } else {
      // Use onWithdrawAll when MAX was selected to avoid precision issues
      if (isWithdrawMax && onWithdrawAll) {
        onWithdrawAll();
      } else {
        if (v > depositedBalance) return;
        onWithdraw(v);
      }
    }
  };

  // Calculate if there's an insufficient balance error and the shortage amount
  const insufficientBalanceInfo = React.useMemo(() => {
    const v = Number(inputAmount || 0);
    if (!Number.isFinite(v) || v <= 0) return null;

    if (mode === "deposit" && v > walletBalanceNum) {
      const shortage = v - walletBalanceNum;
      return { shortage, maxAvailable: walletBalanceNum };
    }
    if (mode === "withdraw" && v > depositedBalance) {
      const shortage = v - depositedBalance;
      return { shortage, maxAvailable: depositedBalance };
    }
    return null;
  }, [inputAmount, mode, walletBalanceNum, depositedBalance]);

  const isSubmitDisabled = React.useMemo(() => {
    const v = Number(inputAmount || 0);
    if (txStatus === "pending") return true;
    if (suiBalanceNum < 0.01) return true;
    if (!Number.isFinite(v) || v <= 0) return true;
    if (insufficientBalanceInfo) return true;
    return false;
  }, [inputAmount, txStatus, suiBalanceNum, insufficientBalanceInfo]);

  const getButtonText = () => {
    if (txStatus === "pending")
      return mode === "deposit" ? "Depositing..." : "Withdrawing...";
    if (suiBalanceNum < 0.01) return "Insufficient SUI for Gas";
    if (insufficientBalanceInfo) {
      const shortageFormatted = insufficientBalanceInfo.shortage.toLocaleString(
        undefined,
        {
          maximumFractionDigits: 2,
        }
      );
      return `Short ${shortageFormatted} ${selectedPool.asset}`;
    }
    return "Review";
  };

  const transactionInfo = React.useMemo(() => {
    if (!selectedPool) return null;
    const amount = inputAmount || "0";
    if (mode === "deposit") {
      return createSupplyTransactionInfo(
        selectedPool.asset,
        `${amount} ${selectedPool.asset}`,
        network
      );
    } else {
      return createWithdrawTransactionInfo(
        selectedPool.asset,
        `${amount} ${selectedPool.asset}`,
        network
      );
    }
  }, [selectedPool, inputAmount, mode, network]);

  // Calculate "After Deposit" preview metrics
  const depositPreview = React.useMemo(() => {
    const amount = parseFloat(inputAmount) || 0;
    if (mode !== "deposit" || amount <= 0) return null;

    const apy = selectedPool?.ui?.aprSupplyPct || 0;
    const currentPosition = currentPositionBalance;
    const newPosition = currentPosition + amount;
    const dailyEarnings = (newPosition * (apy / 100)) / 365;
    const monthlyEarnings = (newPosition * (apy / 100)) / 12;
    const yearlyEarnings = newPosition * (apy / 100);

    // Delta (incremental) earnings from just this deposit
    const incrementalDaily = (amount * (apy / 100)) / 365;
    const incrementalMonthly = (amount * (apy / 100)) / 12;

    return {
      currentPosition,
      newPosition,
      dailyEarnings,
      monthlyEarnings,
      yearlyEarnings,
      incrementalDaily,
      incrementalMonthly,
      apy,
    };
  }, [inputAmount, mode, selectedPool, currentPositionBalance]);

  if (!selectedPool) return null;

  return (
    <>
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

      <div className="sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="space-y-3">
            {/* Risk Warning Banner */}
            {showRiskWarning && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <p className="text-xs text-amber-200">
                    <span className="font-medium">
                      Margin pools involve risks
                    </span>
                    <span className="text-amber-200/70 hidden sm:inline">
                      {" "}
                      — including potential liquidation and variable APY.
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHowItWorks(true)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 whitespace-nowrap"
                  >
                    <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                    How it works
                  </button>
                  <button
                    onClick={() => setShowRiskWarning(false)}
                    className="text-teal-400/60 hover:text-teal-400 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Main Banner - PRIMARY ACTION SURFACE (Tier 2) */}
            <div className="surface-tier-2 rounded-xl p-4 shadow-xl">
              {/* Row 1: Pool selector + Mode toggle */}
              <div className="flex items-center justify-between gap-3 mb-3">
                {/* Pool Selector */}
                <div className="flex items-center gap-1.5">
                  {pools.map((pool) => {
                    const isActive = pool.id === selectedPoolId;
                    return (
                      <button
                        key={pool.id}
                        onClick={() => onSelectPool(pool.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
                          isActive
                            ? "bg-cyan-500/20 border border-cyan-500/50 text-white"
                            : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <img
                          src={getPoolIcon(pool)}
                          alt={pool.asset}
                          className="w-5 h-5 rounded-full"
                        />
                        <div className="text-left">
                          <div className="text-xs font-semibold">
                            {pool.asset}
                          </div>
                          <div
                            className={`text-[10px] ${isActive ? "text-cyan-300" : "text-slate-500"}`}
                          >
                            {pool.ui.aprSupplyPct.toFixed(2)}% APY
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Deposit/Withdraw Toggle */}
                <div className="flex items-center gap-0.5 p-0.5 bg-white/5 rounded-lg">
                  <button
                    onClick={() => setMode("deposit")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      mode === "deposit"
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Deposit
                  </button>
                  <button
                    onClick={() => setMode("withdraw")}
                    className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      mode === "withdraw"
                        ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/25"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Row 2: Amount Input (focal point) + Primary CTA */}
              <div className="flex items-center gap-3">
                {/* Amount Input - FOCAL POINT */}
                <div className="flex-1 relative">
                  <div
                    className={`flex items-center bg-slate-900/80 border-2 rounded-xl overflow-hidden transition-all ${
                      insufficientBalanceInfo
                        ? "border-red-500/70 ring-1 ring-red-500/30"
                        : "border-slate-600 input-glow-focus"
                    }`}
                  >
                    <input
                      type="number"
                      value={inputAmount}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="Enter amount"
                      className="flex-1 bg-transparent px-4 py-3 text-white text-lg font-semibold focus:outline-none placeholder:text-slate-500"
                    />
                    <div className="flex items-center gap-1 pr-2">
                      {/* Quick % Buttons */}
                      {[25, 50, 75, 100].map((p) => (
                        <button
                          key={p}
                          onClick={() => handleQuickPercent(p)}
                          className="px-2 py-1 text-[10px] font-bold bg-white/5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-all"
                          disabled={maxBalance <= 0}
                        >
                          {p === 100 ? "MAX" : `${p}%`}
                        </button>
                      ))}
                    </div>
                    <span className="px-3 py-2 bg-slate-700/50 text-cyan-400 text-sm font-semibold border-l border-slate-600">
                      {selectedPool.asset}
                    </span>
                  </div>
                  {/* Balance hint / Error state with MAX nudge */}
                  <div className="absolute -bottom-5 left-1 right-1 flex items-center justify-between">
                    {insufficientBalanceInfo ? (
                      <>
                        <span className="text-[10px] text-red-400">
                          Insufficient balance — you're short{" "}
                          <span className="font-semibold">
                            {insufficientBalanceInfo.shortage.toLocaleString(
                              undefined,
                              { maximumFractionDigits: 2 }
                            )}{" "}
                            {selectedPool.asset}
                          </span>
                        </span>
                        <button
                          onClick={() => handleQuickPercent(100)}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                        >
                          Max: {maxBalanceFormatted} {selectedPool.asset}
                        </button>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-500">
                        {mode === "deposit" ? "Wallet balance:" : "Available:"}{" "}
                        <span className="text-slate-400 font-medium">
                          {maxBalanceFormatted} {selectedPool.asset}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Single Primary CTA - Opens Review Modal First */}
                {account ? (
                  <>
                    <button
                      onClick={() =>
                        !isSubmitDisabled && setShowReviewModal(true)
                      }
                      disabled={isSubmitDisabled}
                      className={`btn-glow-hover px-6 py-3 rounded-xl text-sm font-bold min-w-[140px] flex items-center justify-center gap-2 ${
                        isSubmitDisabled
                          ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                          : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/30 hover:from-cyan-400 hover:to-blue-400"
                      }`}
                    >
                      {!isSubmitDisabled && (
                        <DocumentTextIcon className="w-4 h-4" />
                      )}
                      {getButtonText()}
                    </button>

                    {/* Review Modal - Must confirm before wallet opens */}
                    {transactionInfo && (
                      <TransactionDetailsModal
                        isOpen={showReviewModal}
                        onClose={() => setShowReviewModal(false)}
                        onContinue={() => {
                          setShowReviewModal(false);
                          handleSubmit();
                        }}
                        transactionInfo={transactionInfo}
                        disabled={isSubmitDisabled}
                      />
                    )}
                  </>
                ) : (
                  <ConnectModal
                    open={connectOpen}
                    onOpenChange={setConnectOpen}
                    trigger={
                      <button
                        onClick={() => setConnectOpen(true)}
                        className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all min-w-[140px]"
                      >
                        Connect Wallet
                      </button>
                    }
                  />
                )}
              </div>

              {/* Row 3: INLINE "After Deposit" Preview - THE CONFIDENCE PAYLOAD */}
              {depositPreview && (
                <div className="mt-3 pt-3 border-t border-emerald-500/20 animate-fade-in">
                  <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                        After Deposit
                      </span>
                      <span className="text-[9px] text-slate-500">
                        at {depositPreview.apy.toFixed(2)}% APY
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {/* Position Change */}
                      <div>
                        <div className="text-[9px] text-slate-500 mb-0.5">
                          Position
                        </div>
                        <div className="text-xs font-semibold text-white">
                          {depositPreview.currentPosition > 0 ? (
                            <>
                              <span className="text-slate-400">
                                {depositPreview.currentPosition.toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 2 }
                                )}
                              </span>
                              <span className="text-emerald-400 mx-1">→</span>
                              <span className="text-emerald-300">
                                {depositPreview.newPosition.toLocaleString(
                                  undefined,
                                  { maximumFractionDigits: 2 }
                                )}
                              </span>
                            </>
                          ) : (
                            <span className="text-emerald-300">
                              {depositPreview.newPosition.toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}
                            </span>
                          )}
                          <span className="text-slate-500 text-[10px] ml-1">
                            {selectedPool.asset}
                          </span>
                        </div>
                      </div>
                      {/* Daily Earnings */}
                      <div>
                        <div className="text-[9px] text-slate-500 mb-0.5">
                          Est. Daily
                        </div>
                        <div className="text-xs font-semibold text-emerald-400">
                          +
                          {depositPreview.incrementalDaily < 0.0001
                            ? depositPreview.incrementalDaily.toFixed(6)
                            : depositPreview.incrementalDaily.toFixed(4)}{" "}
                          {selectedPool.asset}
                        </div>
                      </div>
                      {/* Monthly Earnings */}
                      <div>
                        <div className="text-[9px] text-slate-500 mb-0.5">
                          Est. Monthly
                        </div>
                        <div className="text-xs font-semibold text-emerald-400">
                          +
                          {depositPreview.incrementalMonthly < 0.01
                            ? depositPreview.incrementalMonthly.toFixed(4)
                            : depositPreview.incrementalMonthly.toFixed(2)}{" "}
                          {selectedPool.asset}
                        </div>
                      </div>
                      {/* Pool Info */}
                      <div>
                        <div className="text-[9px] text-slate-500 mb-0.5">
                          Pool Shares
                        </div>
                        <div className="text-xs font-medium text-cyan-400">
                          Receipt token issued
                        </div>
                      </div>
                    </div>
                    {/* APY Disclaimer */}
                    <div className="mt-2 pt-2 border-t border-white/5">
                      <p className="text-[9px] text-slate-500 italic">
                        Assumes APY stays constant. APY may change with
                        utilization.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Row 4: How deposit is used */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50">
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <svg
                    className="w-3 h-3 text-cyan-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    {mode === "deposit"
                      ? "Depositing to:"
                      : "Withdrawing from:"}
                  </span>
                  <span className="text-cyan-400 font-medium">
                    {selectedPool?.asset ?? "SUI"} Margin Pool
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuickDepositBanner;
