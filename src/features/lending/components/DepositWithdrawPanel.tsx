import type { FC } from "react";
import React from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { MIN_DEPOSIT_AMOUNT } from "../../../constants";

type Props = {
  asset: "DBUSDC" | "SUI";
  apy?: number; // Added APY for earnings projection
  onDeposit?: (amount: number) => void;
  onWithdrawAll?: () => void;
  onWithdraw?: (amount: number) => void;
  minBorrow?: number;
  supplyCap?: number;
  balance?: string;
  suiBalance?: string;
  txStatus?: "idle" | "pending" | "success" | "error";
  txError?: string | null;
};

export const DepositWithdrawPanel: FC<Props> = ({
  asset,
  apy = 0,
  onDeposit,
  onWithdrawAll,
  onWithdraw,
  minBorrow = 0,
  supplyCap = 0,
  balance,
  suiBalance,
  txStatus = "idle",
  txError,
}) => {
  const [tab, setTab] = React.useState<"deposit" | "withdraw">("deposit");
  const account = useCurrentAccount();
  const [connectOpen, setConnectOpen] = React.useState(false);
  const [inputAmount, setInputAmount] = React.useState<string>("");

  // Parse balances for validation (rounded down to nearest 0.01)
  const assetBalanceNum = React.useMemo(() => {
    if (!balance) return 0;
    const num = parseFloat(balance.split(" ")[0].replace(/,/g, "")) || 0;
    return Math.floor(num * 100) / 100; // Round down to nearest 0.01
  }, [balance]);

  const suiBalanceNum = React.useMemo(() => {
    if (!suiBalance) return 0;
    return parseFloat(suiBalance.split(" ")[0].replace(/,/g, "")) || 0;
  }, [suiBalance]);

  // Format rounded balance for display
  const roundedAssetBalance = React.useMemo(() => {
    return assetBalanceNum.toFixed(2);
  }, [assetBalanceNum]);

  // Calculate estimated earnings
  const earnings = React.useMemo(() => {
    const amount = parseFloat(inputAmount) || 0;
    const daily = (amount * (apy / 100)) / 365;
    const yearly = amount * (apy / 100);
    return { daily, yearly };
  }, [inputAmount, apy]);

  return (
    <div className="w-full card-surface card-ring glow-amber glow-cyan animate-pulse-glow p-6 flex flex-col relative min-h-[500px]">
      <div className="mb-4">
        <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 mb-1 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_20px_4px_rgba(251,191,36,0.6)]"></span>
          {asset} Margin Pool
        </h2>
        <p className="text-xs text-cyan-100/70">
          Deposit {asset} to earn yield or withdraw your funds.
        </p>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-4"></div>

      <div className="flex items-center gap-3 justify-center mb-6">
        <button
          className={`pill px-8 py-3.5 text-lg flex-1 max-w-[280px] ${
            tab === "deposit"
              ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white font-bold"
              : "text-indigo-100/80"
          }`}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`pill px-8 py-3.5 text-lg flex-1 max-w-[280px] ${
            tab === "withdraw"
              ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white font-bold"
              : "text-indigo-100/80"
          }`}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {/* Deposit */}
      <div className={`flex-1 ${tab === "deposit" ? "block" : "hidden"}`}>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_DEPOSIT_AMOUNT}
              max={assetBalanceNum}
              step="0.000001"
              placeholder={`Enter ${asset} amount`}
              className="input-surface flex-1 text-lg px-5 py-4"
              value={inputAmount}
              onChange={(e) => setInputAmount(e.target.value)}
              id="deposit-amount"
            />
          </div>
          
          {/* Earnings Projection */}
          {inputAmount && !isNaN(parseFloat(inputAmount)) && parseFloat(inputAmount) > 0 && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-xs text-indigo-200/80 uppercase tracking-wider mb-2">Estimated Earnings</h4>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-cyan-100/70">Daily</div>
                  <div className="text-lg font-bold text-emerald-300">
                    +{earnings.daily.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {asset}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-cyan-100/70">Yearly (APY {apy.toFixed(2)}%)</div>
                  <div className="text-lg font-bold text-emerald-300">
                    +{earnings.yearly.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {asset}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-sm text-indigo-200/80">
            <span>Quick %</span>
            <div className="flex gap-3">
              {([25, 50, 75, 100] as const).map((p) => (
                <button
                  key={p}
                  className="pill px-5 py-2.5 text-base hover:scale-105 transition-transform"
                  onClick={() => {
                    if (balance) {
                      const bal = assetBalanceNum;
                      const amount = (bal * p) / 100;
                      const roundedAmount = Math.floor(amount * 100) / 100;
                      setInputAmount(roundedAmount.toFixed(2));
                    }
                  }}
                >
                  {`${p}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Balance Information for Deposit */}
          {balance && (
            <p className="text-sm text-cyan-100/80 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              Available {asset}:{" "}
              <span className="text-amber-300 font-bold">{roundedAssetBalance}</span>
            </p>
          )}

          <p className="text-sm text-cyan-100/80 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
            Min Borrow: <span className="text-amber-300 font-semibold">{minBorrow}</span> ·
            Supply Cap:{" "}
            <span className="text-amber-300 font-semibold">{supplyCap.toLocaleString()}</span>
          </p>
          {account ? (
            <button
              className={`btn-primary text-lg py-4 ${
                txStatus === "pending"
                  ? "opacity-50 cursor-not-allowed"
                  : "animate-[pulse_2.2s_ease-in-out_infinite] hover:opacity-95"
              }`}
              disabled={txStatus === "pending" || suiBalanceNum < 0.01}
              onClick={() => {
                if (txStatus === "pending") return;
                let v = Number(inputAmount || 0);
                if (!Number.isFinite(v) || v <= 0) return;
                if (v < 0) v = 0;
                onDeposit?.(v);
              }}
            >
              <span className="relative z-10 font-bold">
                {txStatus === "pending"
                  ? "Depositing..."
                  : suiBalanceNum < 0.01
                    ? "Insufficient SUI for Gas"
                    : "Deposit"}
              </span>
            </button>
          ) : (
            <ConnectModal
              open={connectOpen}
              onOpenChange={setConnectOpen}
              trigger={
                <button
                  onClick={() => setConnectOpen(true)}
                  className="btn-primary text-lg py-4 hover:opacity-95"
                >
                  <span className="relative z-10 font-bold">Connect Wallet</span>
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Withdraw */}
      <div className={`flex-1 ${tab === "withdraw" ? "block" : "hidden"}`}>
        <h3 className="text-xl font-semibold text-cyan-200 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
          Withdraw
        </h3>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={assetBalanceNum}
              step="0.000001"
              placeholder="Enter amount"
              className="input-surface flex-1 text-lg px-5 py-4"
              id="withdraw-amount"
            />
          </div>
          <div className="flex gap-3">
            {account ? (
              <button
                className={`pill flex-1 text-base py-3 ${
                  txStatus === "pending" ? "opacity-50 cursor-not-allowed" : ""
                }`}
                disabled={txStatus === "pending" || suiBalanceNum < 0.01}
                onClick={() => {
                  if (txStatus === "pending") return;
                  const el = document.getElementById(
                    "withdraw-amount"
                  ) as HTMLInputElement | null;
                  if (!el) return;
                  const v = Number(el.value || 0);
                  if (!Number.isFinite(v) || v <= 0) return;
                  onWithdraw?.(v);
                }}
              >
                {txStatus === "pending"
                  ? "Withdrawing..."
                  : suiBalanceNum < 0.01
                    ? "Insufficient SUI for Gas"
                    : "Withdraw"}
              </button>
            ) : (
              <ConnectModal
                open={connectOpen}
                onOpenChange={setConnectOpen}
                trigger={
                  <button
                    onClick={() => setConnectOpen(true)}
                    className="pill flex-1 text-base py-3"
                  >
                    Connect Wallet
                  </button>
                }
              />
            )}
          </div>
        </div>
        {/* Balance Information */}
        <div className="mt-4 space-y-2">
          {balance && (
            <p className="text-sm text-cyan-100/80 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              {asset} Balance: <span className="text-amber-300 font-bold">{balance}</span>
            </p>
          )}
          {suiBalance && (
            <p className="text-sm text-cyan-100/80 bg-white/5 px-4 py-3 rounded-xl border border-white/10">
              SUI Balance:{" "}
              <span
                className={`font-bold ${
                  suiBalanceNum < 0.01 ? "text-red-300" : "text-amber-300"
                }`}
              >
                {suiBalance}
              </span>
            </p>
          )}
          {suiBalanceNum < 0.01 && (
            <p className="text-sm text-red-300 bg-red-900/20 px-4 py-3 rounded-xl border border-red-400/30">
              ⚠️ Low SUI balance! You need at least 0.01 SUI for gas fees.
            </p>
          )}
        </div>
      </div>

      {/* Transaction Status Feedback */}
      {txStatus === "error" && txError && (
        <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">
            <span className="font-semibold">Transaction Failed:</span> {txError}
          </p>
        </div>
      )}

      {txStatus === "success" && (
        <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-300 text-sm">
            <span className="font-semibold">Transaction Successful!</span> Check
            your wallet for confirmation.
          </p>
        </div>
      )}
    </div>
  );
};

export default DepositWithdrawPanel;
