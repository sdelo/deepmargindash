import type { FC } from "react";
import type { UserPosition, PoolOverview } from "../types";
import { useUserPositions } from "../../../hooks/useUserPositions";
import {
  calculateInterestEarned,
  calculateCurrentBalance,
} from "../../../utils/interestCalculation";

type Props = {
  userAddress: string | undefined;
  pools: PoolOverview[];
  onShowHistory?: () => void;
};

export const PersonalPositions: FC<Props> = ({
  userAddress,
  pools,
  onShowHistory,
}) => {
  const { data: positions, error, isLoading } = useUserPositions(userAddress);

  // Helper function to get pool data for a position
  const getPoolForPosition = (
    position: UserPosition
  ): PoolOverview | undefined => {
    return pools.find((pool) => pool.asset === position.asset);
  };

  if (isLoading) {
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
        <div className="text-center py-8 text-cyan-100/70">
          Loading positions...
        </div>
      </div>
    );
  }

  if (error) {
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
        <div className="text-center py-8 text-red-400">
          Error loading positions: {error.message}
        </div>
      </div>
    );
  }

  if (!userAddress) {
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
        <div className="text-center py-8 text-cyan-100/70">
          Connect your wallet to view positions
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
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
        <div className="text-center py-8 text-cyan-100/70">
          No positions found
        </div>
      </div>
    );
  }

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
            {positions.map((pos) => {
              const pool = getPoolForPosition(pos);
              const currentBalance = pool
                ? calculateCurrentBalance(pos, pool)
                : pos.balanceFormatted;
              const interestEarned = pool
                ? calculateInterestEarned(pos, pool)
                : "—";

              return (
                <tr
                  key={`${pos.address}-${pos.asset}`}
                  className="hover:bg-white/5"
                >
                  <td className="py-3 pr-4">{pos.asset}</td>
                  <td className="py-3 pr-4">{currentBalance}</td>
                  <td className="py-3 pr-4">{interestEarned}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonalPositions;
