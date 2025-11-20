import React from 'react';
import {
  fetchMaintainerFeesWithdrawn,
  fetchProtocolFeesWithdrawn,
  fetchInterestParamsUpdated,
  fetchMarginPoolConfigUpdated,
  fetchDeepbookPoolUpdated,
  type MaintainerFeesWithdrawnEventResponse,
  type ProtocolFeesWithdrawnEventResponse,
  type InterestParamsUpdatedEventResponse,
  type MarginPoolConfigUpdatedEventResponse,
  type DeepbookPoolUpdatedEventResponse,
} from '../api/events';
import { type TimeRange, timeRangeToParams } from '../api/types';
import TimeRangeSelector from '../../../components/TimeRangeSelector';

export function AdministrativePanel({ poolId }: { poolId?: string }) {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('ALL');
  const [maintainerFees, setMaintainerFees] = React.useState<MaintainerFeesWithdrawnEventResponse[]>([]);
  const [protocolFees, setProtocolFees] = React.useState<ProtocolFeesWithdrawnEventResponse[]>([]);
  const [interestUpdates, setInterestUpdates] = React.useState<InterestParamsUpdatedEventResponse[]>([]);
  const [configUpdates, setConfigUpdates] = React.useState<MarginPoolConfigUpdatedEventResponse[]>([]);
  const [poolUpdates, setPoolUpdates] = React.useState<DeepbookPoolUpdatedEventResponse[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  // Fetch all administrative events
  React.useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const params = {
          ...timeRangeToParams(timeRange),
          ...(poolId && { margin_pool_id: poolId }),
          limit: 1000,
        };

        const [maintainer, protocol, interest, config, poolUpd] = await Promise.all([
          fetchMaintainerFeesWithdrawn(params),
          fetchProtocolFeesWithdrawn(params),
          fetchInterestParamsUpdated(params),
          fetchMarginPoolConfigUpdated(params),
          fetchDeepbookPoolUpdated(params),
        ]);

        setMaintainerFees(maintainer);
        setProtocolFees(protocol);
        setInterestUpdates(interest);
        setConfigUpdates(config);
        setPoolUpdates(poolUpd);
        setError(null);
      } catch (err) {
        console.error('Error fetching administrative data:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [timeRange, poolId]);

  // Calculate summary metrics
  const summary = React.useMemo(() => {
    const totalMaintainerFees = maintainerFees.reduce(
      (sum, event) => {
        const amount = parseFloat(event.maintainer_fees || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      },
      0
    );
    const totalProtocolFees = protocolFees.reduce(
      (sum, event) => {
        const amount = parseFloat(event.protocol_fees || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      },
      0
    );

    return {
      totalMaintainerFees: totalMaintainerFees / 1e9,
      totalProtocolFees: totalProtocolFees / 1e9,
      totalInterestUpdates: interestUpdates.length,
      totalConfigUpdates: configUpdates.length,
      totalPoolUpdates: poolUpdates.length,
    };
  }, [maintainerFees, protocolFees, interestUpdates, configUpdates, poolUpdates]);

  if (error) {
    return (
      <div className="card-surface p-6 rounded-3xl border border-red-500/20">
        <p className="text-red-400">Error loading administrative data: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-purple-200">Administrative Actions</h2>
        <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card-surface p-5 rounded-2xl border border-white/10">
          <div className="text-2xl mb-2">💰</div>
          <div className="text-xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-6 w-16 bg-white/10 rounded animate-pulse"></div>
            ) : (
              summary.totalMaintainerFees.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })
            )}
          </div>
          <div className="text-xs text-white/60">Maintainer Fees Withdrawn</div>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-white/10">
          <div className="text-2xl mb-2">🏛️</div>
          <div className="text-xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-6 w-16 bg-white/10 rounded animate-pulse"></div>
            ) : (
              summary.totalProtocolFees.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 6,
              })
            )}
          </div>
          <div className="text-xs text-white/60">Protocol Fees Withdrawn</div>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-white/10">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse"></div>
            ) : (
              summary.totalInterestUpdates
            )}
          </div>
          <div className="text-xs text-white/60">Interest Rate Updates</div>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-white/10">
          <div className="text-2xl mb-2">⚙️</div>
          <div className="text-xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse"></div>
            ) : (
              summary.totalConfigUpdates
            )}
          </div>
          <div className="text-xs text-white/60">Config Updates</div>
        </div>

        <div className="card-surface p-5 rounded-2xl border border-white/10">
          <div className="text-2xl mb-2">🔗</div>
          <div className="text-xl font-bold text-white mb-1">
            {isLoading ? (
              <div className="h-6 w-12 bg-white/10 rounded animate-pulse"></div>
            ) : (
              summary.totalPoolUpdates
            )}
          </div>
          <div className="text-xs text-white/60">DeepBook Pool Updates</div>
        </div>
      </div>

      {/* Fee Withdrawals */}
      <div className="card-surface p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-purple-200 mb-4">Fee Withdrawal History</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-white/5 rounded animate-pulse"></div>
            ))}
          </div>
        ) : maintainerFees.length === 0 && protocolFees.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📭</div>
            <p>No fee withdrawals in the selected time range</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {[
              ...maintainerFees.map(e => ({ ...e, type: 'Maintainer' as const })),
              ...protocolFees.map(e => ({ ...e, type: 'Protocol' as const })),
            ]
              .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
              .slice(0, 50)
              .map((event, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl border transition-colors ${
                    event.type === 'Maintainer'
                      ? 'bg-cyan-500/5 border-cyan-500/20'
                      : 'bg-purple-500/5 border-purple-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        event.type === 'Maintainer'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-purple-500/20 text-purple-300'
                      }`}>
                        {event.type}
                      </span>
                      <span className="text-sm text-white font-semibold">
                        {(() => {
                          const amount = parseFloat(
                            event.type === 'Maintainer' 
                              ? (event as any).maintainer_fees || '0'
                              : (event as any).protocol_fees || '0'
                          );
                          const displayAmount = isNaN(amount) ? 0 : amount / 1e9;
                          return displayAmount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 6,
                          });
                        })()}
                      </span>
                    </div>
                    <span className="text-xs text-white/60">
                      {new Date(event.checkpoint_timestamp_ms).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-white/60">
                    Pool: {event.margin_pool_id.slice(0, 8)}...{event.margin_pool_id.slice(-6)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Interest Rate Updates */}
      <div className="card-surface p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-purple-200 mb-4">Interest Rate Updates</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded animate-pulse"></div>
            ))}
          </div>
        ) : interestUpdates.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">📊</div>
            <p>No interest rate updates in the selected time range</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {interestUpdates
              .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
              .map((event, index) => (
                <div key={index} className="p-4 bg-cyan-500/5 rounded-xl border border-cyan-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-cyan-300">Interest Config Updated</span>
                    <span className="text-xs text-white/60">
                      {new Date(event.checkpoint_timestamp_ms).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-white/60 mb-1">Base Rate</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.interest_config.base_rate || '0');
                          return isNaN(value) ? '0.000%' : `${(value / 1e9 * 100).toFixed(3)}%`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Base Slope</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.interest_config.base_slope || '0');
                          return isNaN(value) ? '0.000%' : `${(value / 1e9 * 100).toFixed(3)}%`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Optimal Util</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.interest_config.optimal_utilization || '0');
                          return isNaN(value) ? '0.00%' : `${(value / 1e9 * 100).toFixed(2)}%`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Excess Slope</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.interest_config.excess_slope || '0');
                          return isNaN(value) ? '0.000%' : `${(value / 1e9 * 100).toFixed(3)}%`;
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs font-mono text-white/60">
                    Pool: {event.margin_pool_id.slice(0, 8)}...{event.margin_pool_id.slice(-6)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Pool Configuration Updates */}
      <div className="card-surface p-6 rounded-2xl border border-white/10">
        <h3 className="text-lg font-bold text-purple-200 mb-4">Pool Configuration Updates</h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-white/5 rounded animate-pulse"></div>
            ))}
          </div>
        ) : configUpdates.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <div className="text-4xl mb-2">⚙️</div>
            <p>No configuration updates in the selected time range</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {configUpdates
              .sort((a, b) => b.checkpoint_timestamp_ms - a.checkpoint_timestamp_ms)
              .map((event, index) => (
                <div key={index} className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-amber-300">Pool Config Updated</span>
                    <span className="text-xs text-white/60">
                      {new Date(event.checkpoint_timestamp_ms).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <div className="text-white/60 mb-1">Supply Cap</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.margin_pool_config.supply_cap || '0');
                          return isNaN(value) ? '0' : (value / 1e9).toLocaleString();
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Max Util Rate</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.margin_pool_config.max_utilization_rate || '0');
                          return isNaN(value) ? '0.00%' : `${(value / 1e9 * 100).toFixed(2)}%`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Protocol Spread</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.margin_pool_config.protocol_spread || '0');
                          return isNaN(value) ? '0.00%' : `${(value / 1e9 * 100).toFixed(2)}%`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="text-white/60 mb-1">Min Borrow</div>
                      <div className="text-white font-semibold">
                        {(() => {
                          const value = parseFloat(event.margin_pool_config.min_borrow || '0');
                          return isNaN(value) ? '0' : (value / 1e9).toLocaleString();
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs font-mono text-white/60">
                    Pool: {event.margin_pool_id.slice(0, 8)}...{event.margin_pool_id.slice(-6)}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

