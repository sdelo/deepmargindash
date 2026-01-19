import type { FC } from "react";
import React from "react";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import type { PoolOverview } from "../types";

function formatNumber(n: number, decimals: number = 2) {
  if (n >= 1_000_000) {
    return (n / 1_000_000).toFixed(1) + "M";
  }
  if (n >= 1_000) {
    return (n / 1_000).toFixed(1) + "k";
  }
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type Props = {
  pools: PoolOverview[];
  selectedPoolId: string | null;
  onSelectPool: (poolId: string) => void;
};

export const PoolCompareTable: FC<Props> = ({
  pools,
  selectedPoolId,
  onSelectPool,
}) => {
  if (pools.length === 0) {
    return (
      <div className="p-4 text-center text-white/40 text-sm">
        No pools available
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg">
      <table className="w-full">
        <thead>
          <tr className="text-[10px] text-white/40 uppercase tracking-wider">
            <th className="text-left font-medium pb-2.5 pl-3">Asset</th>
            <th className="text-right font-medium pb-2.5">APY</th>
            <th className="text-right font-medium pb-2.5">Util</th>
            <th className="text-right font-medium pb-2.5">Available</th>
            <th className="w-8 pb-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/[0.04]">
          {pools.map((pool, index) => {
            const isSelected = pool.id === selectedPoolId;
            const utilizationPct =
              pool.state.supply > 0
                ? (pool.state.borrow / pool.state.supply) * 100
                : 0;
            const available = pool.state.supply - pool.state.borrow;
            const isEven = index % 2 === 0;

            return (
              <tr
                key={pool.id}
                onClick={() => onSelectPool(pool.id)}
                className={`
                  cursor-pointer transition-all duration-150 group
                  ${isSelected 
                    ? "bg-[#2dd4bf]/15 ring-1 ring-inset ring-[#2dd4bf]/30" 
                    : isEven 
                      ? "bg-white/[0.02] hover:bg-white/[0.06]" 
                      : "bg-transparent hover:bg-white/[0.06]"
                  }
                `}
              >
                <td className="py-3 pl-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={
                        pool.ui.iconUrl ||
                        `https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png`
                      }
                      alt={pool.asset}
                      className={`w-5 h-5 rounded-full transition-transform ${isSelected ? "scale-110" : "group-hover:scale-105"}`}
                    />
                    <span
                      className={`text-sm font-medium transition-colors ${
                        isSelected ? "text-white" : "text-white/70 group-hover:text-white"
                      }`}
                    >
                      {pool.asset}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`text-sm font-mono ${
                      isSelected ? "text-[#2dd4bf] font-semibold" : "text-emerald-400/80"
                    }`}
                  >
                    {pool.ui.aprSupplyPct.toFixed(2)}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`text-sm font-mono ${
                      utilizationPct > 80
                        ? "text-red-400"
                        : utilizationPct > 50
                        ? "text-amber-400"
                        : "text-white/60"
                    }`}
                  >
                    {utilizationPct.toFixed(0)}%
                  </span>
                </td>
                <td className="py-3 text-right">
                  <span
                    className={`text-sm font-mono ${
                      isSelected ? "text-white" : "text-white/60"
                    }`}
                  >
                    {formatNumber(available, 1)}
                  </span>
                </td>
                <td className="py-3 pr-2 text-right">
                  <ChevronRightIcon 
                    className={`w-4 h-4 transition-all ${
                      isSelected 
                        ? "text-[#2dd4bf] translate-x-0" 
                        : "text-white/20 -translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0"
                    }`} 
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default PoolCompareTable;
