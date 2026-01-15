import type { FC } from "react";
import React from "react";
import type { PoolOverview } from "../types";
import { Tooltip } from "../../../components/Tooltip";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useSuiClient } from "@mysten/dapp-kit";
import { MarginPool } from "../../../contracts/deepbook_margin/deepbook_margin/margin_pool";
import DeepBookPoolCard from "./DeepBookPoolCard";

function formatNumber(n: number | bigint) {
  return Intl.NumberFormat("en-US").format(Number(n));
}

type Props = {
  pools: PoolOverview[];
  onDepositClick?: (poolId: string) => void;
  selectedPoolId?: string | null;
  onSelectPool?: (poolId: string) => void;
  onAdminAuditClick?: (poolId: string) => void;
  onDeepbookPoolHistoryClick?: (poolId: string) => void;
  isLoading?: boolean;
};

export const PoolCarousel: FC<Props> = ({
  pools,
  onDepositClick,
  selectedPoolId,
  onSelectPool,
  onAdminAuditClick,
  onDeepbookPoolHistoryClick,
  isLoading = false,
}) => {
  const { explorerUrl } = useAppNetwork();
  const suiClient = useSuiClient();
  const [vaultBalances, setVaultBalances] = React.useState<
    Record<string, number>
  >({});
  const [allowedDeepbookPools, setAllowedDeepbookPools] = React.useState<
    Record<string, string[]>
  >({});

  const ICONS: Record<string, string> = {
    SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
    DBUSDC:
      "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
  };
  const getIcon = (asset: string) => ICONS[asset] || "";

  const getRiskLevel = (utilization: number) => {
    if (utilization >= 80)
      return {
        label: "Low Liquidity",
        color: "text-red-400",
        barColor: "bg-red-500",
      };
    if (utilization >= 50)
      return {
        label: "Optimal",
        color: "text-amber-400",
        barColor: "bg-amber-500",
      };
    return {
      label: "High Liquidity",
      color: "text-emerald-400",
      barColor: "bg-emerald-500",
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

          // Extract allowed deepbook pools
          const deepbookPools = marginPool.allowed_deepbook_pools.contents.map(
            (addr) => (typeof addr === "string" ? addr : `0x${addr}`)
          );
          setAllowedDeepbookPools((prev) => ({
            ...prev,
            [pool.id]: deepbookPools,
          }));
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
        {/* Nav indicators skeleton */}
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 animate-pulse"
            >
              <div className="w-5 h-5 rounded-full bg-white/10" />
              <div className="h-3 w-12 bg-white/10 rounded" />
            </div>
          ))}
        </div>

        {/* Card skeleton */}
        <div className="relative rounded-3xl p-6 border bg-white/5 border-white/10 animate-pulse">
          <div className="flex justify-between mb-6">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10" />
              <div className="space-y-2">
                <div className="h-4 w-20 bg-white/10 rounded" />
                <div className="h-3 w-16 bg-white/10 rounded" />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <div className="h-3 w-12 bg-white/10 rounded ml-auto" />
              <div className="h-6 w-16 bg-white/10 rounded ml-auto" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-2 w-full bg-white/10 rounded-full" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-white/10 rounded" />
              <div className="h-10 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="p-8 text-center border border-white/10 rounded-3xl bg-white/5">
        <p className="text-cyan-100/70">No pools available at the moment.</p>
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
  const supplyCap = Number(
    currentPool.protocolConfig.margin_pool_config.supply_cap
  );
  const supplyCapPct = (currentPool.state.supply / supplyCap) * 100;
  const deepbookPoolIds = allowedDeepbookPools[currentPool.id] || [];

  // Calculate borrow APR
  const interestConfig = currentPool.protocolConfig.interest_config;
  const optimalUtilization = interestConfig.optimal_utilization;
  const currentUtilization = utilizationPct / 100;
  let borrowApr: number;
  if (currentUtilization <= optimalUtilization) {
    borrowApr =
      interestConfig.base_rate + interestConfig.base_slope * currentUtilization;
  } else {
    borrowApr =
      interestConfig.base_rate +
      interestConfig.base_slope * optimalUtilization +
      interestConfig.excess_slope * (currentUtilization - optimalUtilization);
  }
  const borrowAprPct = borrowApr * 100;

  return (
    <div className="relative">
      {/* Pool Navigation - Container bar matching right side tabs */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex gap-1 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
          {pools.map((pool) => {
            const isActive = pool.id === selectedPoolId;
            return (
              <button
                key={pool.id}
                onClick={() => onSelectPool?.(pool.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                  isActive
                    ? "bg-amber-400 text-slate-900"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                <img
                  src={getIcon(pool.asset)}
                  alt={`${pool.asset} logo`}
                  className="w-4 h-4 rounded-full"
                />
                <span className="text-sm font-medium">
                  {pool.asset}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg
              className="w-5 h-5 text-white"
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
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 hover:scale-110 shadow-lg"
          >
            <svg
              className="w-5 h-5 text-white"
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

        {/* Cards Grid: Stacked on mobile, 2/3 + 1/3 on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Margin Pool Card - Full width on mobile, 2/3 on desktop */}
          <div className="lg:col-span-2">
            <div className="relative rounded-3xl p-6 border transition-all duration-300 bg-white/10 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)] h-full">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={getIcon(currentPool.asset)}
                      alt={`${currentPool.asset} logo`}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <svg
                        className="w-2.5 h-2.5 text-slate-900"
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
                    <h3 className="text-xl font-bold text-white">
                      {currentPool.asset} Margin Pool
                    </h3>
                    <div className="flex items-center gap-2 text-xs">
                      <span className={`${risk.color} font-medium`}>
                        {risk.label}
                      </span>
                      <Tooltip content="Liquidity status based on utilization rate. High utilization means higher APY but potential withdrawal delays.">
                        <span className="text-white/40 cursor-help">ⓘ</span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-cyan-200/70 mb-1">
                    Supply APY
                  </div>
                  <div className="text-3xl font-extrabold text-cyan-300">
                    {Number(currentPool.ui.aprSupplyPct).toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-4">
                {/* Utilization Bar */}
                <div>
                  <div className="flex justify-between text-xs text-indigo-200/60 mb-2">
                    <span>Utilization</span>
                    <span>{utilizationPct.toFixed(2)}%</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${risk.barColor}`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-2">
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Total Supplied
                    </div>
                    <div className="text-white font-semibold tabular-nums text-sm">
                      {formatNumber(currentPool.state.supply)}{" "}
                      <span className="text-xs text-white/50">
                        {currentPool.asset}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Total Borrowed
                    </div>
                    <div className="text-white font-semibold tabular-nums text-sm">
                      {formatNumber(currentPool.state.borrow)}{" "}
                      <span className="text-xs text-white/50">
                        {currentPool.asset}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Available
                    </div>
                    <div className="text-green-300 font-semibold tabular-nums text-sm">
                      {formatNumber(vaultBalance)}{" "}
                      <span className="text-xs text-white/50">
                        {currentPool.asset}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional metrics from Analytics */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Borrow APR
                    </div>
                    <div className="text-amber-300 font-semibold">
                      {borrowAprPct.toFixed(3)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Supply Cap Usage
                    </div>
                    <div className="text-white font-semibold">
                      {supplyCapPct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Pool Configuration Metrics */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Referral Spread
                    </div>
                    <div className="text-white font-semibold">
                      {(
                        currentPool.protocolConfig.margin_pool_config
                          .protocol_spread * 100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Max Utilization Rate
                    </div>
                    <div className="text-white font-semibold">
                      {(
                        currentPool.protocolConfig.margin_pool_config
                          .max_utilization_rate * 100
                      ).toFixed(2)}
                      %
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <a
                    href={`${explorerUrl}/object/${currentPool.contracts?.marginPoolId || currentPool.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="text-xs text-indigo-300 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <span>View Contract</span>
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>

                  {currentPool.maintainerCapId && (
                    <a
                      href={`${explorerUrl}/object/${currentPool.maintainerCapId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="text-xs text-purple-300 hover:text-purple-100 transition-colors flex items-center gap-1"
                    >
                      <span>Maintainer Cap</span>
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAdminAuditClick?.(currentPool.id);
                    }}
                    className="text-xs text-amber-300 hover:text-amber-100 transition-colors flex items-center gap-1"
                  >
                    <span>⚙️ Admin History</span>
                  </button>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDepositClick?.(currentPool.id);
                  }}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold transition-all bg-amber-400 text-slate-900 hover:bg-amber-300"
                >
                  Deposit Now
                </button>
              </div>
            </div>
          </div>

          {/* DeepBook Pool Card - Full width on mobile, 1/3 on desktop */}
          <div className="lg:col-span-1">
            <DeepBookPoolCard
              poolIds={deepbookPoolIds}
              linkedMarginPools={pools.map(p => p.asset)}
              onHistoryClick={onDeepbookPoolHistoryClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PoolCarousel;
