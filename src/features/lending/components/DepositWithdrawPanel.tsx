import type { FC } from "react";
import React from "react";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";
import { MIN_DEPOSIT_AMOUNT } from "../../../constants";

type Props = {
  asset: "DBUSDC" | "SUI";
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

  return (
    <div className="w-full card-surface card-ring glow-amber glow-cyan animate-pulse-glow p-8 flex flex-col relative min-h-[600px]">
      <div className="mb-6">
        <h2 className="text-3xl font-extrabold tracking-wide text-amber-300 mb-2 flex items-center gap-3">
          <span className="w-4 h-4 rounded-full bg-amber-400 animate-pulse shadow-[0_0_20px_4px_rgba(251,191,36,0.6)]"></span>
          Leviathan Margin Pool
        </h2>
        <p className="text-sm text-cyan-100/70">
          Deposit or withdraw from the {asset} margin pool
        </p>
      </div>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent mb-6"></div>

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
        <h3 className="text-xl font-semibold text-cyan-200 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)]"></span>
          Deposit
        </h3>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_DEPOSIT_AMOUNT}
              max={assetBalanceNum}
              step="0.000001"
              placeholder={`Enter ${asset} amount`}
              className="input-surface flex-1 text-lg px-5 py-4"
              id="deposit-amount"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-indigo-200/80">
            <span>Quick %</span>
            <div className="flex gap-3">
              {([25, 50, 75, 100] as const).map((p) => (
                <button
                  key={p}
                  className="pill px-5 py-2.5 text-base hover:scale-105 transition-transform"
                  onClick={() => {
                    const el = document.getElementById(
                      "deposit-amount"
                    ) as HTMLInputElement | null;
                    if (!el) return;
                    if (balance) {
                      const bal = assetBalanceNum; // Use the already parsed and rounded balance
                      const amount = (bal * p) / 100;
                      // Round down to nearest 0.01 using Math.floor
                      const roundedAmount = Math.floor(amount * 100) / 100;
                      el.value = roundedAmount.toFixed(2);
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
                const el = document.getElementById(
                  "deposit-amount"
                ) as HTMLInputElement | null;
                if (!el) return;
                let v = Number(el.value || 0);
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
