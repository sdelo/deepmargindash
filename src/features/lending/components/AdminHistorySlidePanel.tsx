import type { FC } from "react";
import { useAdminHistory, type AdminEvent } from "../hooks/useAdminHistory";
import { useAppNetwork } from "../../../context/AppNetworkContext";

interface Props {
  poolId?: string;
  poolName?: string;
}

/**
 * Format 9-decimal values to percentage (e.g., 900000000 => 90%)
 */
function nineDecimalToPercent(value: string | bigint): string {
  const num = Number(value) / 1_000_000_000;
  return `${(num * 100).toFixed(2)}%`;
}

/**
 * Format large numbers with commas
 */
function formatNumber(n: string | number | bigint): string {
  return Intl.NumberFormat('en-US').format(Number(n));
}

/**
 * Format timestamp to readable date
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get relative time (e.g., "2 days ago")
 */
function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}

/**
 * Render event details based on type
 */
function EventDetails({ event }: { event: AdminEvent }) {
  switch (event.type) {
    case 'interest_params': {
      // Access data directly from event.data (it's flattened, not nested under 'parsed')
      const config = event.data.interest_config;
      if (!config) {
        return <div className="text-red-400 text-sm">Invalid event data structure</div>;
      }
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-indigo-200/60">Base Rate:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.base_rate)}</div>
            
            <div className="text-indigo-200/60">Base Slope:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.base_slope)}</div>
            
            <div className="text-indigo-200/60">Optimal Utilization:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.optimal_utilization)}</div>
            
            <div className="text-indigo-200/60">Excess Slope:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.excess_slope)}</div>
          </div>
          <div className="text-xs text-indigo-200/40 pt-2 border-t border-white/5">
            Pool Cap ID: <span className="font-mono">{event.data.pool_cap_id?.slice(0, 8) || 'N/A'}...</span>
          </div>
        </div>
      );
    }

    case 'pool_config': {
      // Access data directly from event.data
      const config = event.data.margin_pool_config;
      if (!config) {
        return <div className="text-red-400 text-sm">Invalid event data structure</div>;
      }
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-indigo-200/60">Supply Cap:</div>
            <div className="text-white font-mono">{formatNumber(config.supply_cap)}</div>
            
            <div className="text-indigo-200/60">Max Utilization:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.max_utilization_rate)}</div>
            
            <div className="text-indigo-200/60">Protocol Spread:</div>
            <div className="text-white font-mono">{nineDecimalToPercent(config.protocol_spread)}</div>
            
            <div className="text-indigo-200/60">Min Borrow:</div>
            <div className="text-white font-mono">{formatNumber(config.min_borrow)}</div>
          </div>
          <div className="text-xs text-indigo-200/40 pt-2 border-t border-white/5">
            Pool Cap ID: <span className="font-mono">{event.data.pool_cap_id?.slice(0, 8) || 'N/A'}...</span>
          </div>
        </div>
      );
    }

    case 'deepbook_pool': {
      // Access data directly from event.data
      const data = event.data;
      if (!data || !data.deepbook_pool_id) {
        return <div className="text-red-400 text-sm">Invalid event data structure</div>;
      }
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-indigo-200/60">DeepBook Pool:</div>
            <div className="text-white font-mono text-xs break-all">
              {data.deepbook_pool_id.slice(0, 16)}...
            </div>
            
            <div className="text-indigo-200/60">Status:</div>
            <div className={`font-semibold ${data.enabled ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.enabled ? '✓ Enabled' : '✗ Disabled'}
            </div>
          </div>
          <div className="text-xs text-indigo-200/40 pt-2 border-t border-white/5">
            Pool Cap ID: <span className="font-mono">{data.pool_cap_id?.slice(0, 8) || 'N/A'}...</span>
          </div>
        </div>
      );
    }

    case 'pool_created': {
      // Access data directly from event.data
      const data = event.data;
      if (!data) {
        return <div className="text-red-400 text-sm">Invalid event data structure</div>;
      }
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div className="text-indigo-200/60">Asset Type:</div>
            <div className="text-white font-mono text-xs break-all">{data.asset_type || 'N/A'}</div>
            
            <div className="text-indigo-200/60">Maintainer Cap:</div>
            <div className="text-white font-mono text-xs">
              {data.maintainer_cap_id?.slice(0, 16) || 'N/A'}...
            </div>
          </div>
          <div className="text-xs text-indigo-200/40 pt-2 border-t border-white/5">
            Initial pool creation event
          </div>
        </div>
      );
    }
  }
}

/**
 * Get event type display info
 */
function getEventTypeInfo(type: AdminEvent['type']): { icon: string; label: string; color: string } {
  switch (type) {
    case 'interest_params':
      return { icon: '📈', label: 'Interest Rate Update', color: 'text-cyan-400' };
    case 'pool_config':
      return { icon: '⚙️', label: 'Pool Config Update', color: 'text-amber-400' };
    case 'deepbook_pool':
      return { icon: '🔗', label: 'DeepBook Pool Update', color: 'text-purple-400' };
    case 'pool_created':
      return { icon: '🎉', label: 'Pool Created', color: 'text-emerald-400' };
  }
}

export const AdminHistorySlidePanel: FC<Props> = ({ poolId, poolName = 'Pool' }) => {
  const { events, isLoading, error } = useAdminHistory(poolId);
  const { explorerUrl } = useAppNetwork();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="text-cyan-200 mb-2">Loading admin history...</div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
            <div className="h-3 bg-white/10 rounded w-1/2 mb-2" />
            <div className="h-3 bg-white/10 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <div className="text-red-400 text-lg mb-2">⚠️ Error Loading History</div>
        <div className="text-red-200/60 text-sm">
          {error instanceof Error ? error.message : 'Failed to fetch admin events'}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">📋</div>
        <div className="text-cyan-200 text-lg mb-2">No Admin Changes Yet</div>
        <div className="text-indigo-200/60 text-sm">
          This pool has no recorded administrative configuration changes.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Admin Configuration History</h3>
            <p className="text-indigo-200/60 text-sm">
              {poolName} • {events.length} change{events.length !== 1 ? 's' : ''} recorded
            </p>
          </div>
          <div className="text-4xl">⚙️</div>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-3">
        {events.map((event, index) => {
          const typeInfo = getEventTypeInfo(event.type);
          const isFirst = index === 0;

          return (
            <div
              key={`${event.type}-${event.data.checkpoint_timestamp_ms}-${index}`}
              className={`
                relative bg-white/5 border border-white/10 rounded-xl p-4 transition-all duration-300
                hover:bg-white/10 hover:border-cyan-400/30 hover:shadow-lg
                ${isFirst ? 'ring-2 ring-cyan-400/20' : ''}
              `}
            >
              {/* Timeline dot */}
              <div className="absolute -left-1.5 top-6 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900" />
              
              {/* Event Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{typeInfo.icon}</span>
                  <div>
                    <div className={`font-semibold ${typeInfo.color}`}>{typeInfo.label}</div>
                    <div className="text-xs text-indigo-200/60">
                      {formatDate(event.data.checkpoint_timestamp_ms)} • {getRelativeTime(event.data.checkpoint_timestamp_ms)}
                    </div>
                  </div>
                </div>
                {isFirst && (
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded">
                    Latest
                  </span>
                )}
              </div>

              {/* Event Details */}
              <div className="ml-10 bg-black/20 rounded-lg p-3 border border-white/5">
                <EventDetails event={event} />
              </div>

              {/* Transaction Link */}
              <div className="ml-10 mt-2">
                <a
                  href={`${explorerUrl}/txblock/${event.data.digest}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-cyan-300 hover:text-cyan-100 flex items-center gap-1 transition-colors"
                >
                  <span>View Transaction</span>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-indigo-200/40 pt-4 border-t border-white/5">
        All times shown in your local timezone • Events from last 12 months
      </div>
    </div>
  );
};

export default AdminHistorySlidePanel;

