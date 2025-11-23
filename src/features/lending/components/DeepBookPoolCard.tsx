import type { FC } from "react";
import React from "react";
import type {
  DeepbookPoolRegisteredEventResponse,
  DeepbookPoolConfigUpdatedEventResponse,
} from "../api/events";
import { fetchLatestDeepbookPoolConfig } from "../api/events";
import { useAppNetwork } from "../../../context/AppNetworkContext";

interface Props {
  poolIds: string[];
  onHistoryClick?: (poolId: string) => void;
}

type PoolConfig = DeepbookPoolRegisteredEventResponse | DeepbookPoolConfigUpdatedEventResponse | null;

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRiskRatio(value: number): string {
  // Risk ratios are in 9-decimal format (like config values)
  return ((value / 1_000_000_000) * 100).toFixed(2) + "%";
}

export const DeepBookPoolCard: FC<Props> = ({ poolIds, onHistoryClick }) => {
  const { explorerUrl } = useAppNetwork();
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [poolConfigs, setPoolConfigs] = React.useState<Record<string, PoolConfig>>({});
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch all pool configs
  React.useEffect(() => {
    async function fetchConfigs() {
      setIsLoading(true);
      const configs: Record<string, PoolConfig> = {};
      
      await Promise.all(
        poolIds.map(async (poolId) => {
          try {
            const config = await fetchLatestDeepbookPoolConfig(poolId);
            configs[poolId] = config;
          } catch (error) {
            console.error(`Error fetching config for pool ${poolId}:`, error);
            configs[poolId] = null;
          }
        })
      );
      
      setPoolConfigs(configs);
      setIsLoading(false);
    }

    if (poolIds.length > 0) {
      fetchConfigs();
    } else {
      setIsLoading(false);
    }
  }, [poolIds]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(poolIds.length - 1, prev + 1));
  };

  if (isLoading) {
    return (
      <div className="relative rounded-3xl p-6 border bg-white/5 border-white/10 animate-pulse h-full">
        <div className="space-y-4">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-4 w-full bg-white/10 rounded" />
          <div className="h-4 w-3/4 bg-white/10 rounded" />
        </div>
      </div>
    );
  }

  if (poolIds.length === 0) {
    return (
      <div className="relative rounded-3xl p-6 border bg-white/5 border-white/10 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-indigo-200/60">No DeepBook pools configured</p>
        </div>
      </div>
    );
  }

  const currentPoolId = poolIds[currentIndex];
  const currentConfig = poolConfigs[currentPoolId];

  if (!currentConfig) {
    return (
      <div className="relative rounded-3xl p-6 border bg-white/5 border-white/10 h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-400">Error loading pool configuration</p>
        </div>
      </div>
    );
  }

  const config = currentConfig.config_json;
  const enabled = config.enabled;

  return (
    <div className="relative rounded-3xl p-6 border bg-white/5 border-purple-400/30 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-purple-400">📊</span>
            DeepBook Pool
          </h3>
          <p className="text-xs text-indigo-200/60 mt-1">
            {poolIds.length} pool{poolIds.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${
          enabled
            ? "bg-green-500/20 text-green-300"
            : "bg-red-500/20 text-red-300"
        }`}>
          {enabled ? "Enabled" : "Disabled"}
        </div>
      </div>

      {/* Carousel Navigation */}
      {poolIds.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3 h-3 text-white"
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
          
          <div className="flex-1 text-center">
            <span className="text-xs text-indigo-200/80">
              {currentIndex + 1} / {poolIds.length}
            </span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentIndex === poolIds.length - 1}
            className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg
              className="w-3 h-3 text-white"
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
        </div>
      )}

      {/* Pool ID */}
      <div className="mb-4">
        <div className="text-xs text-indigo-200/60 mb-1">Pool ID</div>
        <a
          href={`${explorerUrl}/object/${currentPoolId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-purple-300 hover:text-purple-100 transition-colors font-mono flex items-center gap-1"
        >
          {formatAddress(currentPoolId)}
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
      </div>

      {/* Risk Ratios */}
      <div className="space-y-3 flex-1">
        <div className="text-xs text-indigo-200/60 font-semibold mb-2">Risk Ratios</div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">Min Borrow</div>
            <div className="text-xs font-semibold text-white">
              {formatRiskRatio(config.risk_ratios.min_borrow_risk_ratio)}
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">Liquidation</div>
            <div className="text-xs font-semibold text-amber-300">
              {formatRiskRatio(config.risk_ratios.liquidation_risk_ratio)}
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">Min Withdraw</div>
            <div className="text-xs font-semibold text-white">
              {formatRiskRatio(config.risk_ratios.min_withdraw_risk_ratio)}
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">Target Liq.</div>
            <div className="text-xs font-semibold text-green-300">
              {formatRiskRatio(config.risk_ratios.target_liquidation_risk_ratio)}
            </div>
          </div>
        </div>

        {/* Liquidation Rewards */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">Pool Reward</div>
            <div className="text-xs font-semibold text-cyan-300">
              {formatRiskRatio(config.pool_liquidation_reward)}
            </div>
          </div>
          
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-[10px] text-indigo-200/60 mb-1">User Reward</div>
            <div className="text-xs font-semibold text-cyan-300">
              {formatRiskRatio(config.user_liquidation_reward)}
            </div>
          </div>
        </div>
      </div>

      {/* History Button */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <button
          onClick={() => onHistoryClick?.(currentPoolId)}
          className="w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-400/30"
        >
          📜 View Config History
        </button>
      </div>
    </div>
  );
};

export default DeepBookPoolCard;

