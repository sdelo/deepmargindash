import type { FC } from "react";

type Props = {
  asset: "USDC" | "SUI";
  onDeposit?: (amount: number) => void;
  onWithdrawAll?: () => void;
  minBorrow?: number;
  supplyCap?: number;
  balance?: string;
};

export const DepositWithdrawPanel: FC<Props> = ({
  asset,
  onDeposit,
  onWithdrawAll,
  minBorrow = 0,
  supplyCap = 0,
  balance,
}) => {
  return (
    <div className="w-full card-surface card-ring glow-amber glow-cyan space-y-8">
      <h2 className="text-2xl font-extrabold tracking-wide text-amber-300 mb-3 text-center drop-shadow">
        Leviathan Margin Pool
      </h2>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-300/60 to-transparent"></div>

      {/* Deposit */}
      <div>
        <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_12px_2px_rgba(251,191,36,0.6)]"></span>
          Deposit
        </h3>
        <div className="space-y-3">
          <select className="input-surface">
            <option>{asset}</option>
          </select>
          <input
            type="number"
            placeholder="Enter amount"
            className="input-surface"
            id="deposit-amount"
          />
          <p className="text-xs text-cyan-100/80">
            Min Borrow: <span className="text-amber-300">{minBorrow}</span> ·
            Supply Cap:{" "}
            <span className="text-amber-300">{supplyCap.toLocaleString()}</span>
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              const el = document.getElementById(
                "deposit-amount"
              ) as HTMLInputElement | null;
              if (!el) return;
              const v = Number(el.value || 0);
              onDeposit?.(v);
            }}
          >
            <span className="relative z-10">Deposit</span>
          </button>
        </div>
      </div>

      {/* Withdraw */}
      <div>
        <h3 className="text-lg font-semibold text-cyan-200 mb-2 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]"></span>
          Withdraw
        </h3>
        <div className="space-y-3">
          <input
            type="number"
            placeholder="Enter amount (coming soon)"
            className="input-surface"
            disabled
          />
          <button className="btn-primary" onClick={() => onWithdrawAll?.()}>
            <span className="relative z-10">Withdraw All</span>
          </button>
        </div>
        {balance && (
          <p className="text-xs text-cyan-100/80 mt-2">
            Current Balance: <span className="text-amber-300">{balance}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default DepositWithdrawPanel;
