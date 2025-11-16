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
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          Loading positions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-red-400 text-base">
          Error loading positions: {error.message}
        </div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          Connect your wallet to view positions
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          No positions found
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
      style={{
        borderColor:
          "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
        <button
          className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white transition-colors"
          onClick={onShowHistory}
        >
          Show deposit history
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="text-cyan-100/70 border-b border-white/10">
            <tr className="text-left">
              <th className="py-3 pr-4 font-semibold">Asset</th>
              <th className="py-3 pr-4 font-semibold">Deposited</th>
              <th className="py-3 pr-4 font-semibold">Interest Earned</th>
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
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 pr-4 font-medium">{pos.asset}</td>
                  <td className="py-4 pr-4 text-amber-300 font-semibold">{currentBalance}</td>
                  <td className="py-4 pr-4 text-green-300 font-semibold">{interestEarned}</td>
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
