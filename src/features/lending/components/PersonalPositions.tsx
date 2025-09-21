import type { FC } from "react";
import type { UserPosition } from "../types";

type Props = { positions: UserPosition[] };

export const PersonalPositions: FC<Props> = ({ positions }) => {
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
        <div className="text-[11px] text-cyan-100/70">Synthetic preview</div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-cyan-100/70">
            <tr className="text-left">
              <th className="py-2 pr-4">Asset</th>
              <th className="py-2 pr-4">Shares</th>
              <th className="py-2 pr-4">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {positions.map((pos) => (
              <tr
                key={`${pos.address}-${pos.asset}`}
                className="hover:bg-white/5"
              >
                <td className="py-3 pr-4">{pos.asset}</td>
                <td className="py-3 pr-4">{pos.shares.toString()}</td>
                <td className="py-3 pr-4">{pos.balanceFormatted}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonalPositions;
