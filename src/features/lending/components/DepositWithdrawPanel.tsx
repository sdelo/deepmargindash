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
    <div className="w-full h-full card-surface card-ring glow-amber glow-cyan animate-pulse-glow p-5 flex flex-col">
      <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 mb-3 text-center drop-shadow">
        Leviathan Margin Pool
      </h2>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>

      <div className="flex items-center gap-2 justify-center">
        <button
          className={`pill px-4 py-2 flex-1 max-w-[220px] ${
            tab === "deposit"
              ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white"
              : "text-indigo-100/80"
          }`}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`pill px-4 py-2 flex-1 max-w-[220px] ${
            tab === "withdraw"
              ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white"
              : "text-indigo-100/80"
          }`}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {/* Deposit */}
      <div className={`flex-1 ${tab === "deposit" ? "block" : "hidden"}`}>
        <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)]"></span>
          Deposit
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={MIN_DEPOSIT_AMOUNT}
              max={assetBalanceNum}
              step="0.000001"
              placeholder={`Enter ${asset} amount`}
              className="input-surface flex-1"
              id="deposit-amount"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-indigo-200/80">
            <span>Quick %</span>
            <div className="flex gap-2">
              {([25, 50, 75, 100] as const).map((p) => (
                <button
                  key={p}
                  className="pill"
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
            <p className="text-xs text-cyan-100/80">
              Available {asset}:{" "}
              <span className="text-amber-300">{roundedAssetBalance}</span>
            </p>
          )}

          <p className="text-xs text-cyan-100/80">
            Min Borrow: <span className="text-amber-300">{minBorrow}</span> ·
            Supply Cap:{" "}
            <span className="text-amber-300">{supplyCap.toLocaleString()}</span>
          </p>
          {account ? (
            <button
              className={`btn-primary ${
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
              <span className="relative z-10">
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
                  className="btn-primary hover:opacity-95"
                >
                  <span className="relative z-10">Connect Wallet</span>
                </button>
              }
            />
          )}
        </div>
      </div>

      {/* Withdraw */}
      <div className={`flex-1 ${tab === "withdraw" ? "block" : "hidden"}`}>
        <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
          Withdraw
        </h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={assetBalanceNum}
              step="0.000001"
              placeholder="Enter amount"
              className="input-surface flex-1"
              id="withdraw-amount"
            />
          </div>
          <div className="flex gap-2">
            {account ? (
              <button
                className={`pill flex-1 ${
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
                    className="pill flex-1"
                  >
                    Connect Wallet
                  </button>
                }
              />
            )}
          </div>
        </div>
        {/* Balance Information */}
        <div className="mt-2 space-y-1">
          {balance && (
            <p className="text-xs text-cyan-100/80">
              {asset} Balance: <span className="text-amber-300">{balance}</span>
            </p>
          )}
          {suiBalance && (
            <p className="text-xs text-cyan-100/80">
              SUI Balance:{" "}
              <span
                className={`${
                  suiBalanceNum < 0.01 ? "text-red-300" : "text-amber-300"
                }`}
              >
                {suiBalance}
              </span>
            </p>
          )}
          {suiBalanceNum < 0.01 && (
            <p className="text-xs text-red-300">
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
