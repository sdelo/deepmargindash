import React from 'react';
import { type AtRiskPosition } from '../../../hooks/useAtRiskPositions';
import { TransactionDetailsModal } from '../../../components/TransactionButton/TransactionDetailsModal';
import { PositionHistoryModal } from './PositionHistoryModal';
import { CONTRACTS } from '../../../config/contracts';
import { useSuiClientContext } from '@mysten/dapp-kit';
import { HarpoonIcon, HealthyAnchorIcon, BoltIcon } from '../../../components/ThemedIcons';

interface AtRiskPositionsTableProps {
  positions: AtRiskPosition[];
  isLoading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

/**
 * Format address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Format USD value
 */
function formatUsd(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Get status badge based on risk level
 */
function getRiskBadge(position: AtRiskPosition): { label: string; className: string } {
  if (position.isLiquidatable) {
    return {
      label: 'LIQUIDATABLE',
      className: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
    };
  }
  if (position.distanceToLiquidation < 5) {
    return {
      label: 'CRITICAL',
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    };
  }
  if (position.distanceToLiquidation < 15) {
    return {
      label: 'WARNING',
      className: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
    };
  }
  return {
    label: 'WATCH',
    className: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  };
}

/**
 * At-Risk Positions Table Component
 */
export function AtRiskPositionsTable({
  positions,
  isLoading,
  lastUpdated,
  onRefresh,
}: AtRiskPositionsTableProps) {
  const { network } = useSuiClientContext();
  const [selectedPosition, setSelectedPosition] = React.useState<AtRiskPosition | null>(null);
  const [showTxModal, setShowTxModal] = React.useState(false);
  const [showHistoryModal, setShowHistoryModal] = React.useState(false);
  const [historyPosition, setHistoryPosition] = React.useState<AtRiskPosition | null>(null);
  const [sortField, setSortField] = React.useState<'riskRatio' | 'totalDebtUsd' | 'distanceToLiquidation'>('riskRatio');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Get contract addresses based on network
  const contracts = network === 'mainnet' ? CONTRACTS.mainnet : CONTRACTS.testnet;

  // Sort positions
  const sortedPositions = React.useMemo(() => {
    return [...positions].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      return (a[sortField] - b[sortField]) * multiplier;
    });
  }, [positions, sortField, sortDirection]);

  // Handle sort click
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle liquidate button click
  const handleLiquidateClick = (position: AtRiskPosition) => {
    setSelectedPosition(position);
    setShowTxModal(true);
  };

  // Handle row click to view history
  const handleRowClick = (position: AtRiskPosition) => {
    setHistoryPosition(position);
    setShowHistoryModal(true);
  };

  // Transaction info for the modal
  const transactionInfo = selectedPosition ? {
    action: 'Liquidate Position',
    packageId: contracts.MARGIN_PACKAGE_ID,
    module: 'margin_manager',
    function: 'liquidate',
    summary: `Liquidate margin manager ${formatAddress(selectedPosition.marginManagerId)} with ${formatUsd(selectedPosition.totalDebtUsd)} debt. Expected reward: ~${formatUsd(selectedPosition.estimatedRewardUsd)} (${((selectedPosition.userLiquidationRewardPct + selectedPosition.poolLiquidationRewardPct) * 100).toFixed(1)}%)`,
    sourceCodeUrl: `https://suivision.xyz/package/${contracts.MARGIN_PACKAGE_ID}`,
    arguments: [
      { name: 'Margin Manager', value: formatAddress(selectedPosition.marginManagerId) },
      { name: 'Risk Ratio', value: selectedPosition.riskRatio.toFixed(4) },
      { name: 'Total Debt', value: formatUsd(selectedPosition.totalDebtUsd) },
      { name: 'Est. Reward', value: formatUsd(selectedPosition.estimatedRewardUsd) },
    ],
  } : null;

  // Sort indicator
  const SortIndicator = ({ field }: { field: typeof sortField }) => (
    <span className="ml-1 text-xs">
      {sortField === field ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <HarpoonIcon size={22} />
            At-Risk Positions
            {positions.filter(p => p.isLiquidatable).length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-full animate-pulse">
                {positions.filter(p => p.isLiquidatable).length} LIQUIDATABLE
              </span>
            )}
          </h3>
          <p className="text-sm text-white/60 mt-1">
            Positions sorted by proximity to liquidation threshold
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-white/40">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        {isLoading && positions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-white/60">Loading at-risk positions...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-3 flex justify-center">
              <HealthyAnchorIcon size={48} />
            </div>
            <p className="text-lg font-semibold text-white">No At-Risk Positions</p>
            <p className="text-sm text-white/60 mt-2">
              All positions are healthy with comfortable margins
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 text-white/60 font-semibold">Manager ID</th>
                  <th 
                    className="text-right py-3 px-4 text-white/60 font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('riskRatio')}
                  >
                    Risk Ratio <SortIndicator field="riskRatio" />
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-white/60 font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('distanceToLiquidation')}
                  >
                    Distance to Liq <SortIndicator field="distanceToLiquidation" />
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-white/60 font-semibold cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('totalDebtUsd')}
                  >
                    Total Debt <SortIndicator field="totalDebtUsd" />
                  </th>
                  <th className="text-right py-3 px-4 text-white/60 font-semibold">Est. Reward</th>
                  <th className="text-center py-3 px-4 text-white/60 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedPositions.map((position) => {
                  const badge = getRiskBadge(position);
                  return (
                    <tr
                      key={position.marginManagerId}
                      onClick={() => handleRowClick(position)}
                      className={`border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${
                        position.isLiquidatable ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded border ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://suivision.xyz/object/${position.marginManagerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-cyan-300 hover:text-cyan-200 transition-colors"
                        >
                          {formatAddress(position.marginManagerId)}
                        </a>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-bold ${
                          position.isLiquidatable ? 'text-rose-400' :
                          position.distanceToLiquidation < 5 ? 'text-amber-400' :
                          position.distanceToLiquidation < 15 ? 'text-amber-300' :
                          'text-white'
                        }`}>
                          {position.riskRatio.toFixed(4)}
                        </span>
                        <span className="text-white/40 ml-1 text-xs">
                          (liq: {position.liquidationThreshold.toFixed(2)})
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-semibold ${
                          position.distanceToLiquidation < 0 ? 'text-rose-400' :
                          position.distanceToLiquidation < 5 ? 'text-amber-400' :
                          position.distanceToLiquidation < 15 ? 'text-amber-300' :
                          'text-cyan-400'
                        }`}>
                          {position.distanceToLiquidation < 0 ? '' : '+'}
                          {position.distanceToLiquidation.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="font-semibold text-white">
                          {formatUsd(position.totalDebtUsd)}
                        </div>
                        <div className="text-xs text-white/40">
                          {position.baseDebt > 0 && `${(position.baseDebt / 1e9).toFixed(2)} ${position.baseAssetSymbol}`}
                          {position.baseDebt > 0 && position.quoteDebt > 0 && ' + '}
                          {position.quoteDebt > 0 && `${(position.quoteDebt / 1e6).toFixed(2)} ${position.quoteAssetSymbol}`}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-green-400 font-semibold">
                          {formatUsd(position.estimatedRewardUsd)}
                        </span>
                        <span className="text-white/40 text-xs ml-1">
                          ({((position.userLiquidationRewardPct + position.poolLiquidationRewardPct) * 100).toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row click
                            handleLiquidateClick(position);
                          }}
                          disabled={!position.isLiquidatable}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                            position.isLiquidatable
                              ? 'bg-rose-500 hover:bg-rose-400 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40'
                              : 'bg-white/10 text-white/40 cursor-not-allowed'
                          }`}
                        >
                          {position.isLiquidatable ? (
                            <>
                              <BoltIcon size={14} />
                              LIQUIDATE
                            </>
                          ) : 'Not Yet'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs text-white/60">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-rose-500/50" />
            <span>Liquidatable (&lt;1.05)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-500/50" />
            <span>Critical (&lt;5%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-400/40" />
            <span>Warning (&lt;15%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-cyan-500/50" />
            <span>Watch</span>
          </div>
        </div>
        <div className="text-white/40">
          Click any row to view position history
        </div>
      </div>

      {/* Transaction Modal */}
      {transactionInfo && (
        <TransactionDetailsModal
          isOpen={showTxModal}
          onClose={() => {
            setShowTxModal(false);
            setSelectedPosition(null);
          }}
          onContinue={() => {
            // TODO: Implement actual liquidation transaction
            console.log('Liquidate position:', selectedPosition?.marginManagerId);
            setShowTxModal(false);
            setSelectedPosition(null);
          }}
          transactionInfo={transactionInfo}
          disabled={!selectedPosition?.isLiquidatable}
        />
      )}

      {/* Position History Modal */}
      {historyPosition && (
        <PositionHistoryModal
          position={historyPosition}
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setHistoryPosition(null);
          }}
        />
      )}
    </div>
  );
}

