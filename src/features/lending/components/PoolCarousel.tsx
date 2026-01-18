import type { FC } from "react";
import React from "react";
import type { PoolOverview } from "../types";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { useSuiClient } from "@mysten/dapp-kit";
import { MarginPool } from "../../../contracts/deepbook_margin/deepbook_margin/margin_pool";

function formatNumber(n: number | bigint, decimals: number = 2) {
  const num = Number(n);
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + "K";
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

type Props = {
  pools: PoolOverview[];
  selectedPoolId?: string | null;
  onSelectPool?: (poolId: string) => void;
  isLoading?: boolean;
};

export const PoolCarousel: FC<Props> = ({
  pools,
  selectedPoolId,
  onSelectPool,
  isLoading = false,
}) => {
  const suiClient = useSuiClient();
  const [vaultBalances, setVaultBalances] = React.useState<
    Record<string, number>
  >({});

  // Fallback icons for when dynamic iconUrl is not available
  const FALLBACK_ICONS: Record<string, string> = {
    SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
    DBUSDC:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    USDC: "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
    DEEP: "https://assets.coingecko.com/coins/images/38087/standard/deep.png?1728614086",
    WAL: "https://assets.coingecko.com/coins/images/54016/standard/walrus.jpg?1737525627",
  };
  // Get icon from pool's dynamic iconUrl or fall back to static icons
  const getIcon = (pool: PoolOverview) =>
    pool.ui.iconUrl || FALLBACK_ICONS[pool.asset] || "";

  const getRiskLevel = (utilization: number) => {
    if (utilization >= 80)
      return {
        label: "Low Liquidity",
        color: "text-red-400",
        barColor: "bg-red-500",
        bgColor: "bg-red-500/20",
      };
    if (utilization >= 50)
      return {
        label: "Optimal",
        color: "text-teal-400",
        barColor: "bg-amber-500",
        bgColor: "bg-amber-500/20",
      };
    return {
      label: "High Liquidity",
      color: "text-emerald-400",
      barColor: "bg-emerald-500",
      bgColor: "bg-emerald-500/20",
    };
  };

  // Fetch vault balances for all pools
  React.useEffect(() => {
    async function fetchVaultBalance(pool: PoolOverview) {
      try {
        const response = await suiClient.getObject({
          id: pool.contracts.marginPoolId,
          options: {
            showBcs: true,
          },
        });

        if (
          response.data &&
          response.data.bcs &&
          response.data.bcs.dataType === "moveObject"
        ) {
          const marginPool = MarginPool.fromBase64(response.data.bcs.bcsBytes);
          const vaultValue =
            Number(marginPool.vault.value) / 10 ** pool.contracts.coinDecimals;
          setVaultBalances((prev) => ({ ...prev, [pool.id]: vaultValue }));
        }
      } catch (error) {
        console.error("Error fetching vault balance:", error);
      }
    }

    pools.forEach((pool) => fetchVaultBalance(pool));
    // Refresh every 15 seconds
    const interval = setInterval(() => {
      pools.forEach((pool) => fetchVaultBalance(pool));
    }, 15000);
    return () => clearInterval(interval);
  }, [pools, suiClient]);

  // Find current index
  const currentIndex = React.useMemo(() => {
    return pools.findIndex((p) => p.id === selectedPoolId);
  }, [pools, selectedPoolId]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onSelectPool?.(pools[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < pools.length - 1) {
      onSelectPool?.(pools[currentIndex + 1].id);
    }
  };

  if (isLoading) {
    return (
      <div className="relative">
        <div className="relative rounded-2xl p-4 border bg-white/5 border-white/10 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-24 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/10 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="h-8 w-24 bg-white/10 rounded" />
              <div className="h-2 w-32 bg-white/10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="p-6 text-center border border-white/10 rounded-2xl bg-white/5">
        <p className="text-white/50">No pools available at the moment.</p>
      </div>
    );
  }

  const currentPool = currentIndex >= 0 ? pools[currentIndex] : pools[0];
  const utilizationPct =
    currentPool.state.supply > 0
      ? (currentPool.state.borrow / currentPool.state.supply) * 100
      : 0;
  const risk = getRiskLevel(utilizationPct);
  const vaultBalance =
    vaultBalances[currentPool.id] ??
    currentPool.state.supply - currentPool.state.borrow;

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {currentIndex < pools.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Unified Margin Pool Card - HERO ELEMENT (Tier 2 styling) */}
        <div className="surface-tier-2 rounded-2xl">
          {/* Pool Header */}
          <div className="p-4">
            <div className="flex items-center gap-4">
              {/* Left: Asset info */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="relative">
                  <img
                    src={getIcon(currentPool)}
                    alt={`${currentPool.asset} logo`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-teal-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <svg
                      className="w-2 h-2 text-slate-900"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {currentPool.asset} Margin Pool
                  </h3>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${risk.bgColor} ${risk.color}`}
                    >
                      {risk.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Unified Pool Snapshot */}
              <div className="hidden md:flex flex-1 justify-center">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-800/60 rounded-xl border border-white/10">
                  {/* Supply APY - Primary metric */}
                  <div className="text-center px-3 py-1 border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                      APY
                      <InfoTooltip tooltip="supplyAPY" size="sm" />
                    </div>
                    <div className="text-lg font-bold text-teal-400 tabular-nums animate-value-pulse">
                      {Number(currentPool.ui.aprSupplyPct).toFixed(2)}%
                    </div>
                  </div>

                  {/* Supplied */}
                  <div className="text-center px-3 py-1 border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">
                      Supplied
                    </div>
                    <div className="text-sm font-semibold text-white tabular-nums">
                      {formatNumber(currentPool.state.supply)}
                    </div>
                  </div>

                  {/* Borrowed */}
                  <div className="text-center px-3 py-1 border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">
                      Borrowed
                    </div>
                    <div className="text-sm font-semibold text-amber-400 tabular-nums">
                      {formatNumber(currentPool.state.borrow)}
                    </div>
                  </div>

                  {/* Available Liquidity - KEY CONFIDENCE METRIC */}
                  <div className="text-center px-3 py-1 border-r border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                      Available
                      <InfoTooltip tooltip="availableLiquidity" size="sm" />
                    </div>
                    <div className="text-sm font-semibold text-emerald-400 tabular-nums">
                      {formatNumber(vaultBalance)}
                    </div>
                  </div>

                  {/* Utilization */}
                  <div className="text-center px-3 py-1">
                    <div className="text-[9px] text-slate-400 uppercase flex items-center justify-center gap-0.5">
                      Util
                      <InfoTooltip tooltip="utilizationRate" size="sm" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="text-sm font-semibold text-white tabular-nums">
                        {utilizationPct.toFixed(0)}%
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-8 h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${risk.barColor}`}
                          style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile: Simplified view */}
              <div className="flex md:hidden items-center gap-3">
                <div className="text-center">
                  <div className="text-[9px] text-slate-400">APY</div>
                  <div className="text-lg font-bold text-teal-400">
                    {Number(currentPool.ui.aprSupplyPct).toFixed(2)}%
                  </div>
                </div>
                <div className="text-center px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                  <div className="text-[9px] text-emerald-400">Available</div>
                  <div className="text-sm font-semibold text-emerald-400">
                    {formatNumber(vaultBalance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolCarousel;
