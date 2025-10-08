import type { FC } from "react";
import type { UserPosition } from "../types";

type Props = { positions: UserPosition[]; onShowHistory?: () => void };

export const PersonalPositions: FC<Props> = ({ positions, onShowHistory }) => {
  return (
    <div
      className="rounded-3xl p-5 bg-white/5 border"
      style={{
        borderColor:
          "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm text-cyan-100/90">My Positions</div>
        <button
          className="text-[11px] text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
          onClick={onShowHistory}
        >
          Show deposit history
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-cyan-100/70">
            <tr className="text-left">
              <th className="py-2 pr-4">Asset</th>
              <th className="py-2 pr-4">Deposited</th>
              <th className="py-2 pr-4">Interest Earned</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {positions.map((pos) => (
              <tr
                key={`${pos.address}-${pos.asset}`}
                className="hover:bg-white/5"
              >
                <td className="py-3 pr-4">{pos.asset}</td>
                <td className="py-3 pr-4">{pos.balanceFormatted}</td>
                <td className="py-3 pr-4">
                  {(() => {
                    const amount = parseFloat(
                      (pos.balanceFormatted || "0")
                        .split(" ")[0]
                        .replace(/,/g, "")
                    );
                    if (!Number.isFinite(amount)) return "—";
                    const interest = amount * 0.05; // synthetic 5%
                    const denom =
                      (pos.balanceFormatted || "").split(" ")[1] || "";
                    return `${interest.toLocaleString()} ${denom}`;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonalPositions;
