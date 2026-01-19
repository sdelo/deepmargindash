import React from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { ArrowTopRightOnSquareIcon, InformationCircleIcon } from "@heroicons/react/24/outline";
import { TransactionDetailsModal } from "../../../components/TransactionButton/TransactionDetailsModal";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import {
  createSupplyTransactionInfo,
  createWithdrawTransactionInfo,
} from "../../../utils/transactionInfo";
import type { PoolOverview } from "../types";

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
  const { network } = useAppNetwork();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"deposit" | "withdraw">("deposit");
  const [inputAmount, setInputAmount] = React.useState<string>("");
  const [isWithdrawMax, setIsWithdrawMax] = React.useState(false);
  const [showReviewModal, setShowReviewModal] = React.useState(false);

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

  return (
    <div className="surface-elevated">
      {/* Mode Toggle with How It Works Link */}
      <div className="flex items-center border-b border-white/[0.06]">
        <div className="flex flex-1">
          <button
            onClick={() => setMode("deposit")}
            className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
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
            className={`flex-1 py-3.5 text-sm font-semibold transition-all relative ${
              mode === "withdraw"
                ? "text-white"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            Withdraw
            {mode === "withdraw" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
          </button>
        </div>
        {/* How it works link */}
        {onShowHowItWorks && (
          <button
            onClick={onShowHowItWorks}
            className="px-3 py-3.5 flex items-center gap-1 text-[11px] text-white/40 hover:text-[#2dd4bf] transition-colors"
          >
            <InformationCircleIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">How it works</span>
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Token & Balance Info */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-label">Token</span>
            <div className="text-sm font-medium text-white mt-0.5">{pool.asset}</div>
          </div>
          <div className="text-right">
            <span className="text-label">{mode === "deposit" ? "Wallet" : "Deposited"}</span>
            <div className="text-sm font-mono text-white/80 mt-0.5">{maxBalanceFormatted} {pool.asset}</div>
          </div>
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
            
            {/* What happens to funds - contextual explainer */}
            {mode === "deposit" && (
              <div className="flex items-start gap-2 px-2 py-2 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                <svg className="w-3.5 h-3.5 text-white/30 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Supplied assets are allocated to DeepBook margin traders and earn yield from borrow interest.{" "}
                  {onShowHowItWorks && (
                    <button 
                      onClick={onShowHowItWorks}
                      className="text-[#2dd4bf] hover:text-[#5eead4] transition-colors"
                    >
                      Learn more →
                    </button>
                  )}
                </p>
              </div>
            )}

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

        {/* Trust Info */}
        <div className="space-y-2 pt-3 border-t border-white/[0.06]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Depositing to</span>
            <span className="text-[#2dd4bf] font-medium">{pool.asset} Margin Pool</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Contract</span>
            <a
              href={`https://suiscan.xyz/${network}/object/${pool.contracts?.marginPoolId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-[#2dd4bf] flex items-center gap-1 font-mono text-[11px] transition-colors"
            >
              {pool.contracts?.marginPoolId?.slice(0, 8)}...
              <ArrowTopRightOnSquareIcon className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Withdrawals</span>
            <span className={withdrawStatusColor}>{withdrawStatus}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ActionPanel;
