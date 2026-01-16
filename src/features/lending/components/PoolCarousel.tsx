import type { FC } from "react";
import React from "react";
import type { PoolOverview } from "../types";
import { InfoTooltip } from "../../../components/InfoTooltip";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useSuiClient } from "@mysten/dapp-kit";
import { MarginPool } from "../../../contracts/deepbook_margin/deepbook_margin/margin_pool";
import { fetchLatestDeepbookPoolConfig } from "../api/events";
import { MarketStats } from "./MarketStats";
import { ChevronDownIcon, ChevronUpIcon, ArrowRightIcon } from "@heroicons/react/24/outline";

function formatNumber(n: number | bigint, decimals: number = 2) {
  const num = Number(n);
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(2) + 'M';
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(2) + 'K';
  }
  return num.toLocaleString('en-US', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
}

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRiskRatio(value: number): string {
  const multiplier = value / 1_000_000_000;
  return multiplier.toFixed(2) + "x";
}

function formatRewardPercent(value: number): string {
  return ((value / 1_000_000_000) * 100).toFixed(2) + "%";
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
  const { explorerUrl, serverUrl } = useAppNetwork();
  const suiClient = useSuiClient();
  const [vaultBalances, setVaultBalances] = React.useState<
    Record<string, number>
  >({});
  const [allowedDeepbookPools, setAllowedDeepbookPools] = React.useState<
    Record<string, string[]>
  >({});
  const [deepbookConfigs, setDeepbookConfigs] = React.useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = React.useState(false);

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

  // Fetch vault balances and deepbook pools for all pools
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

  // Fetch deepbook pool configs
  React.useEffect(() => {
    async function fetchDeepbookConfigs() {
      const currentPool = currentIndex >= 0 ? pools[currentIndex] : pools[0];
      if (!currentPool) return;
      
      const poolIds = allowedDeepbookPools[currentPool.id] || [];
      if (poolIds.length === 0) return;

      const configs: Record<string, any> = {};
      await Promise.all(
        poolIds.map(async (poolId) => {
          try {
            const config = await fetchLatestDeepbookPoolConfig(poolId);
            configs[poolId] = config;
          } catch (error) {
            console.error(`Error fetching config for pool ${poolId}:`, error);
          }
        })
      );
      setDeepbookConfigs(configs);
    }

    fetchDeepbookConfigs();
  }, [allowedDeepbookPools, pools, serverUrl]);

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
  const supplyCap = Number(
    currentPool.protocolConfig.margin_pool_config.supply_cap
  );
  const supplyCapPct = (currentPool.state.supply / supplyCap) * 100;
  const deepbookPoolIds = allowedDeepbookPools[currentPool.id] || [];
  const linkedPools = pools.map(p => p.asset);

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

  // Get deepbook config for display
  const currentDeepbookPoolId = deepbookPoolIds[0];
  const currentDeepbookConfig = currentDeepbookPoolId ? deepbookConfigs[currentDeepbookPoolId]?.config_json : null;
  const marginEnabled = currentDeepbookConfig?.enabled ?? false;

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

        {/* Unified Margin Pool Card - institutional glass */}
        <div className={`card-hero overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'min-h-[420px]' : 'min-h-[72px]'}`}>
          {/* Condensed Header - Always visible */}
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Asset info */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={getIcon(currentPool.asset)}
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
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${risk.bgColor} ${risk.color}`}>
                      {risk.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: Key metrics inline */}
              <div className="flex items-center gap-4 lg:gap-6">
                {/* Supply APY */}
                <div className="text-center">
                  <div className="stat-label mb-0.5 flex items-center justify-center gap-1">
                    Supply APY
                    <InfoTooltip tooltip="supplyAPY" size="sm" />
                  </div>
                  <div className="stat-hero text-teal-400">
                    {Number(currentPool.ui.aprSupplyPct).toFixed(2)}%
                  </div>
                </div>

                {/* Supply/Borrow Stats - visible in header */}
                <div className="hidden md:flex items-center gap-3">
                  <div className="text-center px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">Supplied</div>
                    <div className="text-sm font-semibold text-white tabular-nums">
                      {formatNumber(currentPool.state.supply)} <span className="text-[10px] text-slate-500">{currentPool.asset}</span>
                    </div>
                  </div>
                  <div className="text-center px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-[9px] text-slate-400 uppercase">Borrowed</div>
                    <div className="text-sm font-semibold text-teal-400 tabular-nums">
                      {formatNumber(currentPool.state.borrow)} <span className="text-[10px] text-slate-500">{currentPool.asset}</span>
                    </div>
                  </div>
                </div>

                {/* Utilization Bar - Inline */}
                <div className="hidden lg:block w-24">
                  <div className="flex justify-between text-[9px] text-indigo-200/60 mb-0.5">
                    <span className="flex items-center">
                      Util.
                      <InfoTooltip tooltip="utilizationRate" size="sm" />
                    </span>
                    <span className="font-medium">{utilizationPct.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${risk.barColor}`}
                      style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Expand toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 hover:text-white transition-all"
              >
                <span>{isExpanded ? "Less" : "Details"}</span>
                {isExpanded ? (
                  <ChevronUpIcon className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDownIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Details - Collapsible */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-2 border-t border-white/5 animate-fade-in">
              {/* Margin Pool Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5">
                    Total Supplied
                  </div>
                  <div className="text-sm text-white font-semibold tabular-nums">
                    {formatNumber(currentPool.state.supply)}{" "}
                    <span className="text-xs text-white/40">
                      {currentPool.asset}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5">
                    Total Borrowed
                  </div>
                  <div className="text-sm text-white font-semibold tabular-nums">
                    {formatNumber(currentPool.state.borrow)}{" "}
                    <span className="text-xs text-white/40">
                      {currentPool.asset}
                    </span>
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2.5">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5">
                    Available
                  </div>
                  <div className="text-sm text-emerald-300 font-semibold tabular-nums">
                    {formatNumber(vaultBalance)}{" "}
                    <span className="text-xs text-white/40">
                      {currentPool.asset}
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional Metrics Row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5 flex items-center">
                    Borrow APR
                    <InfoTooltip tooltip="borrowAPR" size="sm" />
                  </div>
                  <div className="text-sm text-teal-300 font-semibold">
                    {borrowAprPct.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5 flex items-center">
                    Cap Usage
                    <InfoTooltip tooltip="supplyCapUsage" size="sm" />
                  </div>
                  <div className="text-sm text-white font-semibold">
                    {supplyCapPct.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5 flex items-center">
                    Spread
                    <InfoTooltip tooltip="referralSpread" size="sm" />
                  </div>
                  <div className="text-sm text-white font-semibold">
                    {(
                      currentPool.protocolConfig.margin_pool_config
                        .protocol_spread * 100
                    ).toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <div className="text-[10px] text-indigo-200/60 mb-0.5 flex items-center">
                    Max Util.
                    <InfoTooltip tooltip="maxUtilizationRate" size="sm" />
                  </div>
                  <div className="text-sm text-white font-semibold">
                    {(
                      currentPool.protocolConfig.margin_pool_config
                        .max_utilization_rate * 100
                    ).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Trading Pool Section - Only if linked */}
              {deepbookPoolIds.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  {/* Funding Flow Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span className="font-medium">Funds Trading Pool</span>
                    </div>
                    <ArrowRightIcon className="w-4 h-4 text-cyan-400/60" />
                    <span className="text-xs text-white/70 font-medium">{linkedPools.join("/")}</span>
                    <div className={`ml-auto px-2 py-0.5 rounded text-[10px] font-medium ${
                      marginEnabled 
                        ? "bg-emerald-500/20 text-emerald-300" 
                        : "bg-red-500/20 text-red-300"
                    }`}>
                      {marginEnabled ? "Margin Enabled" : "Margin Disabled"}
                    </div>
                  </div>

                  {currentDeepbookConfig && (
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 mb-3">
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">Borrow Risk</div>
                        <div className="text-xs font-semibold text-white">
                          {currentDeepbookConfig?.risk_ratios?.min_borrow_risk_ratio
                            ? formatRiskRatio(currentDeepbookConfig.risk_ratios.min_borrow_risk_ratio)
                            : "N/A"}
                        </div>
                      </div>
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">Liq. Risk</div>
                        <div className="text-xs font-semibold text-teal-400">
                          {currentDeepbookConfig?.risk_ratios?.liquidation_risk_ratio
                            ? formatRiskRatio(currentDeepbookConfig.risk_ratios.liquidation_risk_ratio)
                            : "N/A"}
                        </div>
                      </div>
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">Withdraw Risk</div>
                        <div className="text-xs font-semibold text-white">
                          {currentDeepbookConfig?.risk_ratios?.min_withdraw_risk_ratio
                            ? formatRiskRatio(currentDeepbookConfig.risk_ratios.min_withdraw_risk_ratio)
                            : "N/A"}
                        </div>
                      </div>
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">Target Liq.</div>
                        <div className="text-xs font-semibold text-emerald-400">
                          {currentDeepbookConfig?.risk_ratios?.target_liquidation_risk_ratio
                            ? formatRiskRatio(currentDeepbookConfig.risk_ratios.target_liquidation_risk_ratio)
                            : "N/A"}
                        </div>
                      </div>
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">Pool Reward</div>
                        <div className="text-xs font-semibold text-cyan-400">
                          {currentDeepbookConfig?.pool_liquidation_reward
                            ? formatRewardPercent(currentDeepbookConfig.pool_liquidation_reward)
                            : "N/A"}
                        </div>
                      </div>
                      <div className="surface-inset rounded-lg p-2 border border-transparent">
                        <div className="text-[10px] stat-label mb-0.5">User Reward</div>
                        <div className="text-xs font-semibold text-cyan-400">
                          {currentDeepbookConfig?.user_liquidation_reward
                            ? formatRewardPercent(currentDeepbookConfig.user_liquidation_reward)
                            : "N/A"}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Market Stats - Inline with Trading Pool */}
                  <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
                    <MarketStats poolName="SUI_DBUSDC" compact />
                  </div>
                </div>
              )}

              {/* No Trading Pool */}
              {deepbookPoolIds.length === 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-center py-4 text-slate-500 text-xs">
                    <svg className="w-6 h-6 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                    No linked trading pool
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-4 border-t border-white/5 mt-4">
                <a
                  href={`${explorerUrl}/object/${currentPool.contracts?.marginPoolId || currentPool.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
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
                    onClick={(e) => e.stopPropagation()}
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
                  className="text-xs text-teal-300 hover:text-amber-100 transition-colors flex items-center gap-1"
                >
                  <span>⚙️ Admin History</span>
                </button>

                {deepbookPoolIds.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeepbookPoolHistoryClick?.(currentDeepbookPoolId);
                    }}
                    className="text-xs text-teal-400 hover:text-cyan-100 transition-colors flex items-center gap-1"
                  >
                    <span>📊 Trading Pool History</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoolCarousel;
