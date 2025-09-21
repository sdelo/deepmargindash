import type { FC } from "react";
import React from "react";

type Props = {
  asset: "USDC" | "SUI";
  onDeposit?: (amount: number) => void;
  onWithdrawAll?: () => void;
  onWithdraw?: (amount: number) => void;
  minBorrow?: number;
  supplyCap?: number;
  balance?: string;
};

export const DepositWithdrawPanel: FC<Props> = ({
  asset,
  onDeposit,
  onWithdrawAll,
  onWithdraw,
  minBorrow = 0,
  supplyCap = 0,
  balance,
}) => {
  const [tab, setTab] = React.useState<"deposit" | "withdraw">("deposit");
  return (
    <div className="w-full card-surface card-ring glow-amber glow-cyan space-y-6 p-5">
      <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 mb-3 text-center drop-shadow">
        Leviathan Margin Pool
      </h2>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>

      <div className="flex items-center gap-2 justify-center">
        <button
          className={`pill px-4 py-2 flex-1 max-w-[220px] ${tab === "deposit" ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white" : "text-indigo-100/80"}`}
          onClick={() => setTab("deposit")}
        >
          Deposit
        </button>
        <button
          className={`pill px-4 py-2 flex-1 max-w-[220px] ${tab === "withdraw" ? "ring-2 ring-cyan-300 bg-gradient-to-r from-cyan-300/20 to-indigo-500/20 text-white" : "text-indigo-100/80"}`}
          onClick={() => setTab("withdraw")}
        >
          Withdraw
        </button>
      </div>

      {/* Deposit */}
      {tab === "deposit" && (
        <div>
          <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)]"></span>
            Deposit
          </h3>
          <div className="space-y-3">
            <select className="input-surface">
              <option>{asset}</option>
            </select>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Enter amount"
                className="input-surface flex-1"
                id="deposit-amount"
              />
              <button className="pill">Min</button>
              <button className="pill">Max</button>
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
                        const bal =
                          parseFloat(balance.split(" ")[0].replace(/,/g, "")) ||
                          0;
                        el.value = String(Math.floor((bal * p) / 100));
                      }
                    }}
                  >
                    {p === 100 ? "Max" : `${p}%`}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-cyan-100/80">
              Min Borrow: <span className="text-amber-300">{minBorrow}</span> ·
              Supply Cap:{" "}
              <span className="text-amber-300">
                {supplyCap.toLocaleString()}
              </span>
            </p>
            <button
              className="btn-primary animate-[pulse_2.2s_ease-in-out_infinite] hover:opacity-95"
              onClick={() => {
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
              <span className="relative z-10">Deposit</span>
            </button>
          </div>
        </div>
      )}

      {/* Withdraw */}
      {tab === "withdraw" && (
        <div>
          <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
            Withdraw
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                step="any"
                placeholder="Enter amount"
                className="input-surface flex-1"
                id="withdraw-amount"
              />
              <button className="pill">Max</button>
            </div>
            <div className="flex gap-2">
              <button
                className="pill flex-1"
                onClick={() => {
                  const el = document.getElementById(
                    "withdraw-amount"
                  ) as HTMLInputElement | null;
                  if (!el) return;
                  const v = Number(el.value || 0);
                  if (!Number.isFinite(v) || v <= 0) return;
                  onWithdraw?.(v);
                }}
              >
                Withdraw
              </button>
              <button
                className={`pill flex-1 ${balance ? "opacity-100" : "opacity-50"}`}
                onClick={() => onWithdrawAll?.()}
                disabled={!balance}
              >
                Withdraw All
              </button>
            </div>
          </div>
          {balance && (
            <p className="text-xs text-cyan-100/80 mt-2">
              Current Balance: <span className="text-amber-300">{balance}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default DepositWithdrawPanel;
