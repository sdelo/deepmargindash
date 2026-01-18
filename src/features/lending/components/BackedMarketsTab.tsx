import React from "react";
import type { PoolOverview } from "../types";
import { useSuiClient } from "@mysten/dapp-kit";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveContainer, AreaChart, Area, YAxis } from "recharts";
import { MarginPool } from "../../../contracts/deepbook_margin/deepbook_margin/margin_pool";
import { fetchLatestDeepbookPoolConfig } from "../api/events";
import { fetchOHLCV, fetchPairSummary, parseCandles, type MarketSummary, type ParsedCandle } from "../api/marketData";
import { ChevronRightIcon } from "@heroicons/react/24/outline";

function formatRewardPercent(value: number): string {
  return ((value / 1_000_000_000) * 100).toFixed(1) + "%";
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toFixed(0);
}

// Mini Market Chart component
function MiniMarketChart({ poolName, priceUp }: { poolName: string; priceUp: boolean }) {
  const { data: candles, isLoading } = useQuery({
    queryKey: ['ohlcv-mini', poolName],
    queryFn: () => fetchOHLCV(poolName, { interval: '1h', limit: 24 }),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  const chartData: ParsedCandle[] = React.useMemo(() => {
    if (!candles || candles.length === 0) return [];
    return parseCandles(candles).sort((a, b) => a.timestamp - b.timestamp);
  }, [candles]);

  if (isLoading || chartData.length < 2) {
    return (
      <div className="w-20 h-8 bg-slate-700/20 rounded animate-pulse" />
    );
  }

  const chartPrices = chartData.map(c => c.close);
  const minClose = Math.min(...chartPrices);
  const maxClose = Math.max(...chartPrices);
  const priceRange = maxClose - minClose;
  const padding = priceRange > 0 ? priceRange * 0.1 : minClose * 0.01;

  return (
    <div className="w-20 h-8">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={`gradient-${poolName}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={priceUp ? "#10b981" : "#ef4444"} stopOpacity={0.4} />
              <stop offset="100%" stopColor={priceUp ? "#10b981" : "#ef4444"} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <YAxis domain={[minClose - padding, maxClose + padding]} hide />
          <Area
            type="monotone"
            dataKey="close"
            stroke={priceUp ? "#10b981" : "#ef4444"}
            strokeWidth={1.5}
            fill={`url(#gradient-${poolName})`}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

interface BackedMarketsTabProps {
  pool: PoolOverview;
  pools: PoolOverview[];
  onMarketClick?: (poolId: string) => void;
}

export function BackedMarketsTab({ pool, pools, onMarketClick }: BackedMarketsTabProps) {
  const suiClient = useSuiClient();
  const [deepbookPoolIds, setDeepbookPoolIds] = React.useState<string[]>([]);
  const [deepbookConfigs, setDeepbookConfigs] = React.useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [marketStats, setMarketStats] = React.useState<Record<string, MarketSummary | null>>({});

  // Fetch allowed deepbook pools from margin pool
  React.useEffect(() => {
    async function fetchDeepbookPools() {
      if (!pool?.contracts?.marginPoolId) return;
      
      try {
        setIsLoading(true);
        const response = await suiClient.getObject({
          id: pool.contracts.marginPoolId,
          options: { showBcs: true },
        });

        if (
          response.data &&
          response.data.bcs &&
          response.data.bcs.dataType === "moveObject"
        ) {
          const marginPool = MarginPool.fromBase64(response.data.bcs.bcsBytes);
          const poolIds = marginPool.allowed_deepbook_pools.contents.map(
            (addr) => (typeof addr === "string" ? addr : `0x${addr}`)
          );
          setDeepbookPoolIds(poolIds);
        }
      } catch (error) {
        console.error("Error fetching deepbook pools:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeepbookPools();
  }, [pool, suiClient]);

  // Fetch deepbook pool configs
  React.useEffect(() => {
    async function fetchConfigs() {
      if (deepbookPoolIds.length === 0) return;

      const configs: Record<string, any> = {};
      await Promise.all(
        deepbookPoolIds.map(async (poolId) => {
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

    fetchConfigs();
  }, [deepbookPoolIds]);

  // Build asset mapping
  const marginPoolIdToAsset = React.useMemo(() => {
    const mapping: Record<string, string> = {};
    pools.forEach((p) => {
      mapping[p.id] = p.asset;
      if (p.contracts?.marginPoolId) {
        mapping[p.contracts.marginPoolId] = p.asset;
      }
    });
    return mapping;
  }, [pools]);

  // Derive trading pairs from configs (filter out unknown ones)
  const tradingPairs = React.useMemo(() => {
    return deepbookPoolIds
      .map((poolId) => {
        const config = deepbookConfigs[poolId]?.config_json;
        const isEnabled = config?.enabled ?? false;
        
        // Calculate borrow share (simplified - equal distribution)
        const activeCount = deepbookPoolIds.filter(id => 
          deepbookConfigs[id]?.config_json?.enabled
        ).length;
        const borrowShare = isEnabled && activeCount > 0 
          ? Math.round(100 / activeCount) 
          : 0;

        if (config?.base_margin_pool_id && config?.quote_margin_pool_id) {
          const baseAsset = marginPoolIdToAsset[config.base_margin_pool_id];
          const quoteAsset = marginPoolIdToAsset[config.quote_margin_pool_id];
          
          // Skip if we can't resolve both assets
          if (!baseAsset || !quoteAsset) {
            return null;
          }
          
          return {
            poolId,
            display: `${baseAsset}/${quoteAsset}`,
            api: `${baseAsset}_${quoteAsset}`, // DeepBook API format: SUI_DBUSDC
            config,
            isEnabled,
            borrowShare,
          };
        }
        return null;
      })
      .filter((pair): pair is NonNullable<typeof pair> => pair !== null);
  }, [deepbookPoolIds, deepbookConfigs, marginPoolIdToAsset]);

  // Fetch market stats for each trading pair
  React.useEffect(() => {
    async function fetchMarketStats() {
      if (tradingPairs.length === 0) return;

      const stats: Record<string, MarketSummary | null> = {};
      await Promise.all(
        tradingPairs.map(async (pair) => {
          try {
            const summary = await fetchPairSummary(pair.api);
            stats[pair.poolId] = summary;
          } catch (error) {
            console.error(`Error fetching market stats for ${pair.api}:`, error);
            stats[pair.poolId] = null;
          }
        })
      );
      setMarketStats(stats);
    }

    fetchMarketStats();
  }, [tradingPairs]);

  // Summary stats
  const summaryStats = React.useMemo(() => {
    const activeMarkets = tradingPairs.filter(p => p.isEnabled);
    const pausedMarkets = tradingPairs.filter(p => !p.isEnabled);
    const topDriver = activeMarkets.length > 0 
      ? activeMarkets.reduce((max, p) => p.borrowShare > max.borrowShare ? p : max, activeMarkets[0])
      : null;
    
    return {
      topDriver,
      activeCount: activeMarkets.length,
      totalCount: tradingPairs.length,
      pausedCount: pausedMarkets.length,
    };
  }, [tradingPairs]);

  // Calculate volatility from actual market data
  const getVolatilityData = (poolId: string): { 
    level: "low" | "med" | "high"; 
    percent: number;
    priceChange: number;
    range: { low: number; high: number } | null;
  } => {
    const stats = marketStats[poolId];
    if (!stats || stats.last_price === 0) {
      return { level: "low", percent: 0, priceChange: 0, range: null };
    }

    // Calculate 24h range as % of price
    const rangePercent = ((stats.highest_price_24h - stats.lowest_price_24h) / stats.last_price) * 100;
    const priceChange = stats.price_change_percent_24h;
    
    // Determine volatility level
    // < 2% range = Low, 2-5% = Medium, > 5% = High
    let level: "low" | "med" | "high";
    if (rangePercent < 2) level = "low";
    else if (rangePercent < 5) level = "med";
    else level = "high";

    return {
      level,
      percent: rangePercent,
      priceChange,
      range: { low: stats.lowest_price_24h, high: stats.highest_price_24h },
    };
  };

  // Withdraw risk based on pool utilization
  const getWithdrawRisk = (): { level: "low" | "med" | "high"; label: string; utilization: number } => {
    const utilization = pool.state.supply > 0 
      ? (pool.state.borrow / pool.state.supply) * 100 
      : 0;
    if (utilization < 50) return { level: "low", label: "Low", utilization };
    if (utilization < 80) return { level: "med", label: "Med", utilization };
    return { level: "high", label: "High", utilization };
  };

  const withdrawRisk = getWithdrawRisk();

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-5 w-48 bg-slate-700/50 rounded" />
        <div className="h-4 w-64 bg-slate-700/30 rounded" />
        <div className="h-12 bg-slate-800/40 rounded-lg" />
        <div className="h-14 bg-slate-800/40 rounded-lg" />
      </div>
    );
  }

  if (deepbookPoolIds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-10 h-10 text-slate-600 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
        <h3 className="text-base font-medium text-slate-300 mb-1">No Linked Markets</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          This pool is not connected to any trading markets yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-base font-semibold text-white mb-0.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Backed Markets
        </h3>
        <p className="text-xs text-slate-500">
          These trading pools borrow from this margin pool.
        </p>
      </div>

      {/* Summary Row */}
      <div className="flex items-center gap-3 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/30">
        {summaryStats.topDriver && (
          <div className="flex items-center gap-2 pr-3 border-r border-slate-700/50">
            <span className="text-[10px] text-slate-500 uppercase">Top driver</span>
            <span className="text-xs font-semibold text-white">{summaryStats.topDriver.display}</span>
            <span className="text-[10px] text-amber-400 font-medium">({summaryStats.topDriver.borrowShare}%)</span>
          </div>
        )}
        <div className="flex items-center gap-2 pr-3 border-r border-slate-700/50">
          <span className="text-[10px] text-slate-500 uppercase">Active</span>
          <span className="text-xs font-semibold text-emerald-400">{summaryStats.activeCount}</span>
          <span className="text-[10px] text-slate-600">/ {summaryStats.totalCount}</span>
        </div>
        {summaryStats.pausedCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">Paused</span>
            <span className="text-xs font-semibold text-red-400">{summaryStats.pausedCount}</span>
          </div>
        )}
      </div>

      {/* Market Cards with Charts */}
      <div className="space-y-3">
        {tradingPairs.map((pair) => {
          const volData = getVolatilityData(pair.poolId);
          const stats = marketStats[pair.poolId];
          const poolReward = pair.config?.pool_liquidation_reward 
            ? formatRewardPercent(pair.config.pool_liquidation_reward)
            : "—";
          const priceUp = (stats?.price_change_percent_24h ?? 0) >= 0;
          const hasMarketData = stats && stats.last_price > 0;
          
          // Calculate spread if available
          const spread = stats && stats.lowest_ask > 0 && stats.highest_bid > 0 && stats.last_price > 0
            ? ((stats.lowest_ask - stats.highest_bid) / stats.last_price * 100).toFixed(3)
            : null;

          return (
            <button
              key={pair.poolId}
              onClick={() => onMarketClick?.(pair.poolId)}
              className="w-full group p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl border border-slate-700/30 hover:border-cyan-500/40 transition-all cursor-pointer text-left"
            >
              {/* Top Row: Market info + Status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${pair.isEnabled ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-base font-semibold text-white">{pair.display}</span>
                  <span className="text-[10px] text-slate-500 bg-slate-700/50 px-1.5 py-0.5 rounded">DeepBook</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    pair.isEnabled 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {pair.isEnabled ? 'Active' : 'Paused'}
                  </span>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </div>

              {/* Main Content: Chart + Stats */}
              <div className="flex items-stretch gap-4">
                {/* Left: Price Chart */}
                <div className="flex-shrink-0">
                  <MiniMarketChart poolName={pair.api} priceUp={priceUp} />
                </div>

                {/* Middle: Price Info */}
                <div className="flex-1 min-w-0">
                  {hasMarketData ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-white tabular-nums">
                          ${stats.last_price.toFixed(4)}
                        </span>
                        <span className={`text-sm font-medium ${priceUp ? 'text-emerald-400' : 'text-red-400'}`}>
                          {priceUp ? '+' : ''}{volData.priceChange.toFixed(2)}%
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        24h: ${stats.lowest_price_24h.toFixed(4)} — ${stats.highest_price_24h.toFixed(4)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No trading data</div>
                  )}
                </div>

                {/* Right: Stats Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                  {/* Volume */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Vol 24h</span>
                    <span className="text-slate-300 font-medium">
                      {hasMarketData ? formatVolume(stats.quote_volume) : '—'}
                    </span>
                  </div>
                  
                  {/* Spread */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Spread</span>
                    <span className="text-slate-300 font-medium">
                      {spread ? `${spread}%` : '—'}
                    </span>
                  </div>
                  
                  {/* Volatility */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Vol (24h)</span>
                    <span className={`font-medium ${
                      volData.level === 'low' ? 'text-emerald-400' : 
                      volData.level === 'med' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {volData.percent > 0 ? `${volData.percent.toFixed(1)}%` : '—'}
                    </span>
                  </div>
                  
                  {/* Reward */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Reward</span>
                    <span className="text-cyan-400 font-medium">{poolReward}</span>
                  </div>
                </div>
              </div>

              {/* Bottom: Borrow Share Bar */}
              <div className="mt-3 pt-3 border-t border-slate-700/30">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="text-slate-500">Borrow share from this pool</span>
                  <span className="text-amber-400 font-semibold">{pair.borrowShare}%</span>
                </div>
                <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{ width: `${pair.borrowShare}%` }}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* What This Tells You */}
      <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 mt-4">
        <h4 className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">
          What This Tells You
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-white/60">
          <div>
            <span className="text-white/80 font-medium">Borrow Demand</span>
            <p className="mt-1">
              Shows which markets are actively borrowing from this pool. Higher borrow share means 
              more trading activity and typically higher yield for suppliers.
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Volatility</span>
            <p className="mt-1">
              The 24h price range of each market. Higher volatility means more liquidation opportunities 
              (higher rewards) but also more potential for rapid utilization changes.
            </p>
          </div>
          <div>
            <span className="text-white/80 font-medium">Liquidation Rewards</span>
            <p className="mt-1">
              When positions are liquidated, a portion goes to pool suppliers. Higher volatile markets 
              typically have more liquidations = more rewards for you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BackedMarketsTab;
