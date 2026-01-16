import React from 'react';
import {
  fetchLiquidations,
  type LiquidationEventResponse,
} from '../api/events';
import { type TimeRange, timeRangeToParams } from '../api/types';
import TimeRangeSelector from '../../../components/TimeRangeSelector';
import { useAppNetwork } from '../../../context/AppNetworkContext';
import { TridentIcon, HealthyAnchorIcon, ErrorIcon } from '../../../components/ThemedIcons';

interface LiquidatorStats {
  address: string;
  liquidationCount: number;
  totalVolumeRaw: number;        // In smallest units
  totalVolume: number;           // Normalized (divided by 1e9)
  totalRewardsEarned: number;    // Pool rewards (approximation)
  averageLiquidationSize: number;
  lastLiquidationTime: number;
  rank: number;
}

interface LiquidatorLeaderboardProps {
  className?: string;
}

/**
 * Format address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 16) return address || 'Unknown';
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Get medal emoji for rank
 */
function getRankDisplay(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

/**
 * Liquidator Leaderboard Component
 */
export function LiquidatorLeaderboard({ className = '' }: LiquidatorLeaderboardProps) {
  const { serverUrl } = useAppNetwork();
  const [timeRange, setTimeRange] = React.useState<TimeRange>('1M');
  const [liquidators, setLiquidators] = React.useState<LiquidatorStats[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch and aggregate liquidation data
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        
        const params = timeRangeToParams(timeRange);
        const liquidations = await fetchLiquidations({ ...params, limit: 10000 });

        // Aggregate by liquidator (sender)
        const liquidatorMap = new Map<string, {
          count: number;
          totalVolume: number;
          totalRewards: number;
          lastTime: number;
        }>();

        liquidations.forEach((liq: LiquidationEventResponse) => {
          const liquidator = liq.sender;
          if (!liquidator) return;

          const existing = liquidatorMap.get(liquidator) || {
            count: 0,
            totalVolume: 0,
            totalRewards: 0,
            lastTime: 0,
          };

          existing.count += 1;
          existing.totalVolume += parseFloat(liq.liquidation_amount);
          existing.totalRewards += parseFloat(liq.pool_reward);
          existing.lastTime = Math.max(existing.lastTime, liq.checkpoint_timestamp_ms);

          liquidatorMap.set(liquidator, existing);
        });

        // Convert to array and sort by volume
        const sorted: LiquidatorStats[] = Array.from(liquidatorMap.entries())
          .map(([address, stats], index) => ({
            address,
            liquidationCount: stats.count,
            totalVolumeRaw: stats.totalVolume,
            totalVolume: stats.totalVolume / 1e9,
            totalRewardsEarned: stats.totalRewards / 1e9,
            averageLiquidationSize: (stats.totalVolume / 1e9) / stats.count,
            lastLiquidationTime: stats.lastTime,
            rank: 0, // Will be set after sorting
          }))
          .sort((a, b) => b.totalVolume - a.totalVolume)
          .map((item, index) => ({ ...item, rank: index + 1 }));

        setLiquidators(sorted);
      } catch (err) {
        console.error('Error fetching liquidator data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [timeRange, serverUrl]);

  // Calculate totals
  const totalVolume = liquidators.reduce((sum, l) => sum + l.totalVolume, 0);
  const totalLiquidations = liquidators.reduce((sum, l) => sum + l.liquidationCount, 0);
  const uniqueLiquidators = liquidators.length;

  return (
    <div className={`bg-white/5 rounded-2xl p-6 border border-white/10 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <TridentIcon size={22} />
            Liquidator Leaderboard
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Top liquidators by volume
          </p>
        </div>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white/5 rounded-xl p-3 border border-amber-500/30">
          <div className="text-2xl font-bold text-teal-400">
            {uniqueLiquidators}
          </div>
          <div className="text-xs text-white/60">Active Liquidators</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">
            {totalLiquidations.toLocaleString()}
          </div>
          <div className="text-xs text-white/60">Total Liquidations</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">
            {totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-white/60">Total Volume</div>
        </div>
      </div>

      {/* Leaderboard Table */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full" />
            <span className="text-white/60">Loading leaderboard...</span>
          </div>
        </div>
      ) : error ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-2 flex justify-center">
              <ErrorIcon size={32} />
            </div>
            <div className="text-rose-400">Error loading data</div>
            <div className="text-white/60 text-sm mt-1">{error.message}</div>
          </div>
        </div>
      ) : liquidators.length === 0 ? (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-3 flex justify-center">
              <HealthyAnchorIcon size={48} />
            </div>
            <div className="text-white font-semibold">No Liquidations Yet</div>
            <div className="text-white/60 text-sm mt-1">
              No liquidations recorded in this time period
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-2 px-3 text-white/60 font-semibold w-16">Rank</th>
                <th className="text-left py-2 px-3 text-white/60 font-semibold">Liquidator</th>
                <th className="text-right py-2 px-3 text-white/60 font-semibold">Liquidations</th>
                <th className="text-right py-2 px-3 text-white/60 font-semibold">Volume</th>
                <th className="text-right py-2 px-3 text-white/60 font-semibold">Avg Size</th>
                <th className="text-right py-2 px-3 text-white/60 font-semibold">Last Active</th>
              </tr>
            </thead>
            <tbody>
              {liquidators.slice(0, 10).map((liquidator) => {
                const isTopThree = liquidator.rank <= 3;
                const volumePercent = (liquidator.totalVolume / totalVolume) * 100;
                
                return (
                  <tr
                    key={liquidator.address}
                    className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                      isTopThree ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span className={`text-lg ${isTopThree ? '' : 'text-white/60'}`}>
                        {getRankDisplay(liquidator.rank)}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <a
                        href={`https://suivision.xyz/account/${liquidator.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
                      >
                        {formatAddress(liquidator.address)}
                      </a>
                      {isTopThree && (
                        <div className="w-full h-1 mt-1 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                            style={{ width: `${volumePercent}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-white">
                        {liquidator.liquidationCount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className={`font-bold ${isTopThree ? 'text-teal-400' : 'text-white'}`}>
                        {liquidator.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <span className="text-white/40 text-xs ml-1">
                        ({volumePercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-white/80">
                      {liquidator.averageLiquidationSize.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 px-3 text-right text-white/60 text-xs">
                      {new Date(liquidator.lastLiquidationTime).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {liquidators.length > 10 && (
            <div className="text-center py-3 text-white/40 text-sm">
              + {liquidators.length - 10} more liquidators
            </div>
          )}
        </div>
      )}

      {/* Note about data */}
      {liquidators.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/40">
            Volume shown in native asset units. The <code className="text-cyan-400">sender</code> field
            of liquidation events identifies who executed the liquidation transaction.
          </p>
        </div>
      )}
    </div>
  );
}

