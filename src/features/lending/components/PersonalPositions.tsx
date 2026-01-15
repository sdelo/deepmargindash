import type { FC } from "react";
import { useState, useMemo, useEffect } from "react";
import type { UserPosition, PoolOverview } from "../types";
import { useUserPositions } from "../../../hooks/useUserPositions";
import { useAppNetwork } from "../../../context/AppNetworkContext";
import { useEnrichedUserPositions } from "../../../hooks/useEnrichedUserPositions";

type Props = {
  userAddress: string | undefined;
  pools: PoolOverview[];
  onShowHistory?: () => void;
  positions?: UserPosition[]; // Optional prop to pass pre-fetched positions
};

export const PersonalPositions: FC<Props> = ({
  userAddress,
  pools,
  onShowHistory,
  positions: propPositions,
}) => {
  const { data: fetchedPositions, error, isLoading } = useUserPositions(
    propPositions ? undefined : userAddress
  );
  
  // Use passed positions if available, otherwise use fetched ones
  const positions = propPositions || fetchedPositions;
  
  // Enrich positions with live on-chain data
  const enrichedPositions = useEnrichedUserPositions(positions, pools);

  console.log("PersonalPositions rendered with:", { 
    positions, 
    enrichedPositions,
    error, 
    isLoading: propPositions ? false : isLoading, 
    userAddress 
  });
  const { explorerUrl } = useAppNetwork();
  
  // Extract unique SupplierCap IDs from enriched positions
  const uniqueCapIds = useMemo(() => {
    const capIds = new Set(
      enrichedPositions
        .map((pos) => pos.supplierCapId)
        .filter((id): id is string => id !== undefined)
    );
    return Array.from(capIds);
  }, [enrichedPositions]);

  // State for selected SupplierCap (default to first one)
  const [selectedCapId, setSelectedCapId] = useState<string | null>(
    uniqueCapIds.length > 0 ? uniqueCapIds[0] : null
  );

  // Update selectedCapId when uniqueCapIds changes (e.g., after refetch)
  useEffect(() => {
    if (uniqueCapIds.length > 0 && (!selectedCapId || !uniqueCapIds.includes(selectedCapId))) {
      setSelectedCapId(uniqueCapIds[0]);
    } else if (uniqueCapIds.length === 0) {
      setSelectedCapId(null);
    }
  }, [uniqueCapIds, selectedCapId]);

  // Filter positions by selected SupplierCap (or show all if only one cap)
  const filteredPositions = useMemo(() => {
    if (uniqueCapIds.length <= 1) {
      return enrichedPositions; // Show all positions if only one cap or no caps
    }
    if (!selectedCapId) {
      return [];
    }
    return enrichedPositions.filter((pos) => pos.supplierCapId === selectedCapId);
  }, [enrichedPositions, selectedCapId, uniqueCapIds.length]);

  // Helper function to get pool data for a position
  const getPoolForPosition = (
    position: UserPosition
  ): PoolOverview | undefined => {
    return pools.find((pool) => pool.asset === position.asset);
  };

  // Helper to truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Helper to copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Check if any enriched position is still loading
  const isEnriching = enrichedPositions.some(pos => pos.isLoading);

  if (isLoading || isEnriching) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">My Positions</div>
          <button
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={onShowHistory}
          >
            History
          </button>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          {isLoading ? 'Loading positions...' : 'Calculating interest...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">My Positions</div>
          <button
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={onShowHistory}
          >
            History
          </button>
        </div>
        <div className="text-center py-8 text-rose-400 text-sm">
          Error loading positions: {error.message}
        </div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">My Positions</div>
          <button
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={onShowHistory}
          >
            History
          </button>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          Connect your wallet to view positions
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-slate-300">My Positions</div>
          <button
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
            onClick={onShowHistory}
          >
            History
          </button>
        </div>
        <div className="text-center py-8 text-slate-400 text-sm">
          No positions found
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-300">My Positions</div>
        <button
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          onClick={onShowHistory}
        >
          History
        </button>
      </div>

      {/* SupplierCap Selector (only show if multiple caps exist) */}
      {uniqueCapIds.length > 1 && (
        <div className="p-2.5 bg-slate-700/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1.5">
            <label className="text-xs font-medium text-slate-400">
              Cap:
            </label>
            <select
              value={selectedCapId || ""}
              onChange={(e) => setSelectedCapId(e.target.value)}
              className="flex-1 px-2 py-1 bg-slate-800/60 border border-slate-600/50 rounded text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
            >
              {uniqueCapIds.map((capId) => (
                <option key={capId} value={capId}>
                  {truncateAddress(capId)}
                </option>
              ))}
            </select>
            <button
              onClick={() => copyToClipboard(selectedCapId || "")}
              className="px-1.5 py-0.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600/50 text-slate-300 transition-colors"
              title="Copy SupplierCap ID"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-slate-500">
            SupplierCap NFT allows supply/withdraw across all pools.
          </div>
        </div>
      )}

      {/* SupplierCap Info (show for single cap) */}
      {uniqueCapIds.length === 1 && (
        <div className="p-2.5 bg-slate-700/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Cap:</span>
            <a
              href={`${explorerUrl}/object/${uniqueCapIds[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
            >
              {truncateAddress(uniqueCapIds[0])}
              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button
              onClick={() => copyToClipboard(uniqueCapIds[0])}
              className="px-1.5 py-0.5 text-xs bg-slate-700/50 hover:bg-slate-600/50 rounded border border-slate-600/50 text-slate-300 transition-colors"
              title="Copy SupplierCap ID"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Positions List */}
      <div className="space-y-2">
        {filteredPositions.map((pos) => {
          // Use the enriched data if available, otherwise fall back to static data
          const currentBalance = pos.currentValueFromChain || pos.balanceFormatted;
          const interestEarned = pos.interestEarned || "—";
          const isIndexerPending = interestEarned.includes('indexer pending');

          return (
            <div
              key={`${pos.supplierCapId}-${pos.asset}`}
              className="p-3 bg-slate-700/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-200">{pos.asset}</span>
                {pos.isLoading && (
                  <span className="text-xs text-amber-400 animate-pulse">updating...</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500 mb-0.5">Balance</div>
                  <div className="text-amber-400 font-semibold">{currentBalance}</div>
                </div>
                <div>
                  <div className="text-slate-500 mb-0.5">Interest</div>
                  <div className="text-emerald-400 font-semibold flex items-center gap-1">
                    {interestEarned}
                    {isIndexerPending && (
                      <span 
                        className="text-slate-500 cursor-help" 
                        title="Interest calculation requires event history from the indexer."
                      >
                        ?
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {uniqueCapIds.length > 1 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50">
                  <a
                    href={`${explorerUrl}/object/${pos.supplierCapId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 text-xs flex items-center gap-1"
                  >
                    {truncateAddress(pos.supplierCapId)}
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PersonalPositions;
