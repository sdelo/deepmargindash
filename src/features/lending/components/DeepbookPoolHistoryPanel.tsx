import type { FC } from "react";
import React from "react";
import {
  fetchDeepbookPoolRegistered,
  fetchDeepbookPoolConfigUpdated,
  type DeepbookPoolRegisteredEventResponse,
  type DeepbookPoolConfigUpdatedEventResponse,
} from "../api/events";
import { useAppNetwork } from "../../../context/AppNetworkContext";

interface Props {
  poolId?: string;
  onClose: () => void;
}

type PoolConfigEvent = (
  | DeepbookPoolRegisteredEventResponse
  | DeepbookPoolConfigUpdatedEventResponse
) & {
  eventType: "registered" | "updated";
};

function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatRiskRatio(value: number): string {
  return ((value / 1_000_000_000) * 100).toFixed(2) + "%";
}

function formatTimestamp(onchainTimestamp: number): string {
  return new Date(onchainTimestamp * 1000).toLocaleString();
}

export const DeepbookPoolHistoryPanel: FC<Props> = ({ poolId, onClose }) => {
  const { serverUrl } = useAppNetwork();
  const [events, setEvents] = React.useState<PoolConfigEvent[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchHistory() {
      if (!poolId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const [registeredEvents, configUpdatedEvents] = await Promise.all([
          fetchDeepbookPoolRegistered({ pool_id: poolId }),
          fetchDeepbookPoolConfigUpdated({ pool_id: poolId }),
        ]);

        const allEvents: PoolConfigEvent[] = [
          ...registeredEvents.map((e) => ({
            ...e,
            eventType: "registered" as const,
          })),
          ...configUpdatedEvents.map((e) => ({
            ...e,
            eventType: "updated" as const,
          })),
        ].sort((a, b) => b.onchain_timestamp - a.onchain_timestamp);

        setEvents(allEvents);
      } catch (err) {
        console.error("Error fetching deepbook pool history:", err);
        setError(err instanceof Error ? err.message : "Failed to load history");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [poolId, serverUrl]);

  if (!poolId) {
    return (
      <div className="p-8 text-center text-indigo-200/60">No pool selected</div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white/5 rounded-2xl p-4 border border-white/10 animate-pulse"
            >
              <div className="h-4 w-32 bg-white/10 rounded mb-2" />
              <div className="h-3 w-full bg-white/10 rounded mb-1" />
              <div className="h-3 w-3/4 bg-white/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-400 mb-2">Error Loading History</div>
        <div className="text-sm text-indigo-200/60">{error}</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="p-8 text-center text-indigo-200/60">
        No configuration history found for this pool
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-white">
            DeepBook Pool Config History
          </h2>
          <button
            onClick={onClose}
            className="text-indigo-300 hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 text-sm text-indigo-200/80">
          <span className="font-mono">{formatAddress(poolId)}</span>
          <a
            href={`https://suivision.xyz/object/${poolId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-300 hover:text-purple-100 transition-colors"
          >
            <svg
              className="w-4 h-4"
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
      </div>

      {/* Event Timeline */}
      <div className="space-y-4">
        {events.map((event, index) => {
          const config = event.config_json;
          const isLatest = index === 0;

          // Skip events without proper config data
          if (!config) {
            return null;
          }

          return (
            <div
              key={`${event.eventType}-${event.onchain_timestamp}-${index}`}
              className={`
                relative rounded-2xl p-5 border transition-all
                ${
                  isLatest
                    ? "bg-purple-500/10 border-purple-400/50 shadow-lg"
                    : "bg-white/5 border-white/10"
                }
              `}
            >
              {isLatest && (
                <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Latest
                </div>
              )}

              {/* Event Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.eventType === "registered"
                        ? "bg-green-500/20 text-green-300"
                        : "bg-blue-500/20 text-blue-300"
                    }`}
                  >
                    {event.eventType === "registered" ? "🎉" : "⚙️"}
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      {event.eventType === "registered"
                        ? "Pool Registered"
                        : "Config Updated"}
                    </div>
                    <div className="text-xs text-indigo-200/60">
                      {formatTimestamp(event.onchain_timestamp)}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                    config?.enabled
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {config?.enabled ? "Enabled" : "Disabled"}
                </div>
              </div>

              {/* Transaction Info */}
              <div className="mb-4 p-3 bg-black/20 rounded-lg">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-indigo-200/60 mb-1">Transaction</div>
                    <a
                      href={`https://suivision.xyz/txblock/${event.digest}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 hover:text-cyan-100 transition-colors font-mono flex items-center gap-1"
                    >
                      {formatAddress(event.digest)}
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
                  <div>
                    <div className="text-indigo-200/60 mb-1">Sender</div>
                    <div className="text-white font-mono">
                      {formatAddress(event.sender)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Ratios */}
              <div className="mb-4">
                <div className="text-sm font-semibold text-indigo-200 mb-2">
                  Risk Ratios
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Min Borrow Risk
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {config?.risk_ratios?.min_borrow_risk_ratio
                        ? formatRiskRatio(
                            config.risk_ratios.min_borrow_risk_ratio
                          )
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Liquidation Risk
                    </div>
                    <div className="text-sm font-semibold text-amber-300">
                      {config?.risk_ratios?.liquidation_risk_ratio
                        ? formatRiskRatio(
                            config.risk_ratios.liquidation_risk_ratio
                          )
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Min Withdraw Risk
                    </div>
                    <div className="text-sm font-semibold text-white">
                      {config?.risk_ratios?.min_withdraw_risk_ratio
                        ? formatRiskRatio(
                            config.risk_ratios.min_withdraw_risk_ratio
                          )
                        : "N/A"}
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-xs text-indigo-200/60 mb-1">
                      Target Liquidation
                    </div>
                    <div className="text-sm font-semibold text-green-300">
                      {config?.risk_ratios?.target_liquidation_risk_ratio
                        ? formatRiskRatio(
                            config.risk_ratios.target_liquidation_risk_ratio
                          )
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Liquidation Rewards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-xs text-indigo-200/60 mb-1">
                    Pool Liquidation Reward
                  </div>
                  <div className="text-sm font-semibold text-cyan-300">
                    {config?.pool_liquidation_reward
                      ? formatRiskRatio(config.pool_liquidation_reward)
                      : "N/A"}
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3">
                  <div className="text-xs text-indigo-200/60 mb-1">
                    User Liquidation Reward
                  </div>
                  <div className="text-sm font-semibold text-cyan-300">
                    {config?.user_liquidation_reward
                      ? formatRiskRatio(config.user_liquidation_reward)
                      : "N/A"}
                  </div>
                </div>
              </div>

              {/* Margin Pool IDs */}
              {config?.base_margin_pool_id && config?.quote_margin_pool_id && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-xs text-indigo-200/60 mb-2">
                    Associated Margin Pools
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-indigo-200/60 mb-1">Base</div>
                      <a
                        href={`https://suivision.xyz/object/${config.base_margin_pool_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-100 transition-colors font-mono flex items-center gap-1"
                      >
                        {formatAddress(config.base_margin_pool_id)}
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
                    <div>
                      <div className="text-indigo-200/60 mb-1">Quote</div>
                      <a
                        href={`https://suivision.xyz/object/${config.quote_margin_pool_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-300 hover:text-purple-100 transition-colors font-mono flex items-center gap-1"
                      >
                        {formatAddress(config.quote_margin_pool_id)}
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
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DeepbookPoolHistoryPanel;
