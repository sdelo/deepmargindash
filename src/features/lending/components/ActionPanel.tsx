import React from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { ArrowTopRightOnSquareIcon, InformationCircleIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { TransactionDetailsModal } from "../../../components/TransactionButton/TransactionDetailsModal";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  createSupplyTransactionInfo,
  createWithdrawTransactionInfo,
} from "../../../utils/transactionInfo";
import { fetchPairSummary, type MarketSummary } from "../api/marketData";
import type { PoolOverview } from "../types";

// Fallback icons for when dynamic iconUrl is not available
const FALLBACK_ICONS: Record<string, string> = {
  SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
  DBUSDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  DEEP: "https://assets.coingecko.com/coins/images/38087/standard/deep.png?1728614086",
  WAL: "https://assets.coingecko.com/coins/images/54016/standard/walrus.jpg?1737525627",
};

interface ActionPanelProps {
  pool: PoolOverview | null;
  onDeposit: (amount: number) => void;
  onWithdraw: (amount: number) => void;
  onWithdrawAll?: () => void;
  walletBalance?: string;
  depositedBalance?: number;
  suiBalance?: string;
  txStatus?: "idle" | "pending" | "success" | "error";
  onAmountChange?: (amount: string) => void;
  currentPositionBalance?: number;
  onShowHowItWorks?: () => void;
}

export function ActionPanel({
  pool,
  onDeposit,
  onWithdraw,
  onWithdrawAll,
  walletBalance,
  depositedBalance = 0,
  suiBalance,
  txStatus = "idle",
  onAmountChange,
  currentPositionBalance = 0,
  onShowHowItWorks,
}: ActionPanelProps) {
  const account = useCurrentAccount();
  const { network, explorerUrl } = useAppNetwork();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"deposit" | "withdraw">("deposit");
  const [inputAmount, setInputAmount] = React.useState<string>("");
  const [isWithdrawMax, setIsWithdrawMax] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);
  const [showUsd, setShowUsd] = React.useState(true);
  const [marketPrice, setMarketPrice] = React.useState<number | null>(null);

  // Fetch current market price for USD conversion
  React.useEffect(() => {
    async function fetchPrice() {
      if (!pool) return;
      try {
        // For stablecoins, price is ~1
        if (pool.asset === "DBUSDC" || pool.asset === "USDC") {
          setMarketPrice(1);
          return;
        }
        // Try to fetch from market API using trading pair
        const tradingPair = pool.contracts?.tradingPair || `${pool.asset}_DBUSDC`;
        const summary = await fetchPairSummary(tradingPair);
        if (summary?.last_price) {
          setMarketPrice(summary.last_price);
        }
      } catch (err) {
        console.error("Error fetching market price:", err);
      }
    }
    fetchPrice();
    // Refresh price every 30 seconds
    const interval = setInterval(fetchPrice, 30000);
    return () => clearInterval(interval);
  }, [pool]);

  // Format amount with optional USD value
  const formatWithUsd = (amount: number, forceUsd = showUsd) => {
    const formatted = amount.toLocaleString(undefined, { maximumFractionDigits: 4 });
    if (forceUsd && marketPrice) {
      const usdValue = amount * marketPrice;
      const usdFormatted = usdValue >= 1000 
        ? `$${(usdValue / 1000).toFixed(1)}K` 
        : `$${usdValue.toFixed(2)}`;
      return `${formatted} (${usdFormatted})`;
    }
    return formatted;
  };

  // Get pool icon
  const poolIcon = pool?.ui?.iconUrl || FALLBACK_ICONS[pool?.asset || "SUI"] || FALLBACK_ICONS.SUI;

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
      : depositedBalance.toLocaleString(undefined, { maximumFractionDigits: 6 });

  const handleQuickPercent = (percent: number) => {
    const amount = (maxBalance * percent) / 100;
    const roundedAmount = Math.floor(amount * 1000000) / 1000000;
    const amountStr = roundedAmount.toString();
    setInputAmount(amountStr);
    setIsWithdrawMax(mode === "withdraw" && percent === 100);
    if (mode === "deposit" && onAmountChange) {
      onAmountChange(amountStr);
    }
  };

  const handleInputChange = (value: string) => {
    setInputAmount(value);
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
      if (isWithdrawMax && onWithdrawAll) {
        onWithdrawAll();
      } else {
        if (v > depositedBalance) return;
        onWithdraw(v);
      }
    }
  };

  const insufficientBalanceInfo = React.useMemo(() => {
    const v = Number(inputAmount || 0);
    if (!Number.isFinite(v) || v <= 0) return null;
    if (mode === "deposit" && v > walletBalanceNum) {
      return { shortage: v - walletBalanceNum, maxAvailable: walletBalanceNum };
    }
    if (mode === "withdraw" && v > depositedBalance) {
      return { shortage: v - depositedBalance, maxAvailable: depositedBalance };
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
    if (txStatus === "pending") return mode === "deposit" ? "Depositing..." : "Withdrawing...";
    if (suiBalanceNum < 0.01) return "Insufficient SUI for Gas";
    if (insufficientBalanceInfo) {
      const shortageFormatted = insufficientBalanceInfo.shortage.toLocaleString(undefined, { maximumFractionDigits: 2 });
      return `Short ${shortageFormatted} ${pool?.asset}`;
    }
    return mode === "deposit" ? "Deposit" : "Withdraw";
  };

  const transactionInfo = React.useMemo(() => {
    if (!pool) return null;
    const amount = inputAmount || "0";
    if (mode === "deposit") {
      return createSupplyTransactionInfo(pool.asset, `${amount} ${pool.asset}`, network);
    } else {
      return createWithdrawTransactionInfo(pool.asset, `${amount} ${pool.asset}`, network);
    }
  }, [pool, inputAmount, mode, network]);

  // Deposit preview calculation
  const depositPreview = React.useMemo(() => {
    const amount = parseFloat(inputAmount) || 0;
    if (mode !== "deposit" || amount <= 0 || !pool) return null;

    const apy = pool.ui?.aprSupplyPct || 0;
    const newPosition = currentPositionBalance + amount;
    const incrementalDaily = (amount * (apy / 100)) / 365;
    const incrementalMonthly = (amount * (apy / 100)) / 12;

    return { currentPosition: currentPositionBalance, newPosition, incrementalDaily, incrementalMonthly, apy };
  }, [inputAmount, mode, pool, currentPositionBalance]);

  if (!pool) return null;

  // Get utilization for withdrawal status
  const utilizationPct = pool.state.supply > 0 ? (pool.state.borrow / pool.state.supply) * 100 : 0;
  const getWithdrawStatus = () => {
    if (utilizationPct < 50) return "Instant withdrawal";
    if (utilizationPct < 80) return `Withdrawal queue possible (util > 50%)`;
    return `Withdrawal queue likely (util ${utilizationPct.toFixed(0)}%)`;
  };
  const withdrawStatus = getWithdrawStatus();
  const withdrawStatusColor = utilizationPct < 50 ? "text-emerald-400" : utilizationPct < 80 ? "text-amber-400" : "text-red-400";

  // Min deposit based on pool (10 USDC for DBUSDC, 0.1 SUI for SUI)
  const minDeposit = pool.asset === "DBUSDC" ? 10 : 0.1;

  // Determine if user has no position yet (for pulse animation)
  const hasNoPosition = depositedBalance === 0 || depositedBalance === undefined;

  // APY for display (utilizationPct already declared above)
  const apyPct = pool.ui?.aprSupplyPct || 0;

  return (
    <div className="surface-elevated overflow-hidden">
      {/* Pool Header with Accent Bar - Mirrors selected row styling */}
      <div className="relative">
        {/* Accent bar on left */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#2dd4bf]" />
        
        <div className="pl-5 pr-4 py-3 bg-[#2dd4bf]/[0.08] border-b border-[#2dd4bf]/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={poolIcon}
                alt={pool.asset}
                className="w-7 h-7 rounded-full ring-2 ring-[#2dd4bf]/30"
              />
              <div>
                <div className="text-xs text-white/50 font-medium">
                  {mode === "deposit" ? "Deposit & Earn" : "Withdraw from"}
                </div>
                <div className="text-sm font-semibold text-white">
                  {pool.asset} Margin Pool
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[#2dd4bf] font-bold text-lg font-mono">{apyPct.toFixed(2)}%</div>
              <div className="text-[10px] text-white/40">{utilizationPct.toFixed(0)}% utilized</div>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Toggle with How It Works Link */}
      <div className="flex items-center border-b border-white/[0.06]">
        <div className="flex flex-1">
          <button
            onClick={() => setMode("deposit")}
            className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
              mode === "deposit"
                ? "text-[#2dd4bf]"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Deposit
            {mode === "deposit" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2dd4bf]" />
            )}
          </button>
          <button
            onClick={() => setMode("withdraw")}
            className={`flex-1 py-3 text-sm transition-all relative ${
              mode === "withdraw"
                ? "text-white font-semibold"
                : hasNoPosition 
                  ? "text-white/30 hover:text-white/50" 
                  : "text-white/50 hover:text-white/70"
            }`}
          >
            Withdraw
            {mode === "withdraw" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        </div>
        {/* USD Toggle + How it works tooltip */}
        <div className="flex items-center gap-1 pr-2">
          <button
            onClick={() => setShowUsd(!showUsd)}
            className={`px-2 py-1 text-[10px] font-semibold rounded transition-all ${
              showUsd 
                ? "bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/30" 
                : "bg-white/5 text-white/40 border border-white/10 hover:text-white/60"
            }`}
            title="Toggle USD values"
          >
            $
          </button>
          <div className="relative group">
            <button
              className="px-2 py-2 flex items-center gap-1 text-[11px] text-white/40 hover:text-[#2dd4bf] transition-colors"
            >
              <InformationCircleIcon className="w-3.5 h-3.5" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <p className="text-[11px] text-white/90 leading-relaxed">
                Supplied assets are allocated to DeepBook margin traders and earn yield from borrow interest.
              </p>
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-slate-800 border-l border-t border-slate-700 rotate-45"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Balance Info with USD */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
          <div>
            <span className="text-label">{mode === "deposit" ? "Wallet Balance" : "Your Position"}</span>
            <div className="text-sm font-mono text-white mt-0.5">
              {maxBalanceFormatted} {pool.asset}
            </div>
            {showUsd && marketPrice && (
              <div className="text-xs font-mono text-[#2dd4bf]/70">
                ${(maxBalance * marketPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
          {mode === "deposit" && depositedBalance > 0 && (
            <div className="text-right">
              <span className="text-label">Already Supplied</span>
              <div className="text-sm font-mono text-white/80 mt-0.5">
                {depositedBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })} {pool.asset}
              </div>
              {showUsd && marketPrice && (
                <div className="text-xs font-mono text-[#2dd4bf]/70">
                  ${(depositedBalance * marketPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deposit Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-label">Deposit</span>
            {mode === "deposit" && (
              <span className="text-xs text-white/40">Min: {minDeposit} {pool.asset}</span>
            )}
          </div>
          
          {/* Amount Input */}
          <div className="relative">
            <div
              className={`flex items-center rounded-xl overflow-hidden transition-all ${
                insufficientBalanceInfo
                  ? "ring-1 ring-red-500/50"
                  : mode === "deposit" && hasNoPosition && !inputAmount
                    ? "ring-2 ring-[#2dd4bf]/40 animate-pulse-ring"
                    : "ring-1 ring-white/[0.08] focus-within:ring-[#2dd4bf]/40"
              }`}
              style={{
                background: "rgba(0, 0, 0, 0.25)",
              }}
            >
              <div className="flex-1 flex items-center">
                <span className="pl-4 text-sm text-white/50">Amount</span>
                <input
                  type="number"
                  value={inputAmount}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder={`Enter ${pool.asset}`}
                  className="flex-1 bg-transparent px-3 py-3.5 text-white text-base font-medium focus:outline-none placeholder:text-white/30 w-full font-mono"
                />
              </div>
              <div className="px-4 py-3.5 bg-[#2dd4bf] text-[#0d1a1f] font-semibold text-sm">
                {pool.asset}
              </div>
            </div>
            {/* USD value of input amount */}
            {showUsd && marketPrice && inputAmount && parseFloat(inputAmount) > 0 && (
              <div className="absolute -bottom-5 left-4 text-xs font-mono text-[#2dd4bf]/70">
                ≈ ${(parseFloat(inputAmount) * marketPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>

          {/* Quick % Buttons */}
          <div className="flex gap-2">
            {[25, 50, 75].map((p) => (
              <button
                key={p}
                onClick={() => handleQuickPercent(p)}
                className="flex-1 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-white/60 hover:text-white transition-all"
                disabled={maxBalance <= 0}
              >
                {p}%
              </button>
            ))}
            <button
              onClick={() => handleQuickPercent(100)}
              className="flex-1 py-2 text-xs font-semibold bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg text-white/60 hover:text-white transition-all"
              disabled={maxBalance <= 0}
            >
              MAX
            </button>
          </div>
        </div>

        {/* Deposit Preview - Trade Ticket Style */}
        {depositPreview && (
          <div className="p-3 bg-[#2dd4bf]/[0.08] rounded-lg border border-[#2dd4bf]/20">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-[#2dd4bf] uppercase tracking-wider">
                Deposit Preview
              </span>
              <span className="text-[9px] text-white/40 bg-white/5 px-1.5 py-0.5 rounded">
                ~0.001 SUI gas
              </span>
            </div>

            {/* Position: Before → After → Delta */}
            <div className="bg-black/20 rounded-lg p-2.5 mb-2">
              <div className="text-[9px] text-white/40 mb-1">Position</div>
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="text-white/50">
                  {depositPreview.currentPosition.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
                <span className="text-white/30">→</span>
                <span className="text-white font-semibold">
                  {depositPreview.newPosition.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
                <span className="text-[#2dd4bf] text-[10px] bg-[#2dd4bf]/15 px-1 py-0.5 rounded">
                  +{(parseFloat(inputAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </span>
              </div>
            </div>

            {/* APY + Rate Type + Sensitivity in one line */}
            <div className="flex items-center gap-2 text-[10px] mb-2 pb-2 border-b border-white/[0.06]">
              <span className="text-[#2dd4bf] font-semibold">{depositPreview.apy.toFixed(2)}% APY</span>
              <span className="text-white/20">•</span>
              <span className="text-amber-400">Variable</span>
              <span className="text-white/20">•</span>
              <span className="text-white/40">↑ with utilization</span>
            </div>

            {/* Earnings */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Daily</span>
                <span className="text-[#2dd4bf] font-mono">+{depositPreview.incrementalDaily.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Monthly</span>
                <span className="text-[#2dd4bf] font-mono">+{depositPreview.incrementalMonthly.toFixed(4)}</span>
              </div>
            </div>

            {/* Simulate link */}
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex justify-end">
              <a
                href={`https://suiscan.xyz/${network}/tx/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] text-white/40 hover:text-[#2dd4bf] flex items-center gap-1 transition-colors"
              >
                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Simulate tx
              </a>
            </div>
          </div>
        )}

        {/* DeepBook Trust Line */}
        <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <CheckBadgeIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] text-white/70">
            Powered by <span className="font-semibold text-white">DeepBook Margin Pool</span>
          </span>
          <span className="text-white/20">·</span>
          <span className="text-[11px] text-emerald-400 font-medium">Verified</span>
          <span className="text-white/20">·</span>
          <a
            href={`${explorerUrl}/object/${pool.contracts?.marginPoolId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-white/50 hover:text-[#2dd4bf] transition-colors flex items-center gap-0.5"
          >
            View on Explorer
            <ArrowTopRightOnSquareIcon className="w-3 h-3" />
          </a>
        </div>

        {/* Submit Button */}
        {account ? (
          <>
            <button
              onClick={() => !isSubmitDisabled && setShowReviewModal(true)}
              disabled={isSubmitDisabled}
              className={`btn-primary w-full py-3.5 ${
                isSubmitDisabled ? "opacity-50 cursor-not-allowed shadow-none" : ""
              }`}
            >
              {getButtonText()}
            </button>

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
          <div className="space-y-2">
            <ConnectModal
              open={connectOpen}
              onOpenChange={setConnectOpen}
              trigger={
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl text-sm font-semibold bg-white/[0.06] text-white/40 cursor-not-allowed border border-white/[0.08]"
                >
                  {mode === "deposit" ? "Deposit" : "Withdraw"}
                </button>
              }
            />
            <button
              onClick={() => setConnectOpen(true)}
              className="w-full text-center text-xs text-[#2dd4bf] hover:text-[#5eead4] transition-colors cursor-pointer"
            >
              Connect wallet to continue →
            </button>
          </div>
        )}

        {/* Contract Details */}
        <div className="space-y-1.5 pt-3 border-t border-white/[0.06]">
          <div className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Contract Details</div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Pool Contract</span>
            <a
              href={`${explorerUrl}/object/${pool.contracts?.marginPoolId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#2dd4bf] flex items-center gap-1 font-mono text-[11px] transition-colors"
            >
              {pool.contracts?.marginPoolId?.slice(0, 8)}...{pool.contracts?.marginPoolId?.slice(-6)}
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Withdrawal Status</span>
            <span className={withdrawStatusColor}>{withdrawStatus}</span>
          </div>
          {showUsd && marketPrice && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/40">{pool.asset} Price</span>
              <span className="text-white/60 font-mono">${marketPrice.toFixed(pool.asset === "SUI" ? 4 : 2)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActionPanel;
