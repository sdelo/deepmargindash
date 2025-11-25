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
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          {isLoading ? 'Loading positions...' : 'Calculating interest...'}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-red-400 text-base">
          Error loading positions: {error.message}
        </div>
      </div>
    );
  }

  if (!userAddress) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          Connect your wallet to view positions
        </div>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div
        className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
        style={{
          borderColor:
            "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
          <button
            className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white"
            onClick={onShowHistory}
          >
            Show deposit history
          </button>
        </div>
        <div className="text-center py-16 text-cyan-100/70 text-base">
          No positions found
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-3xl p-6 bg-white/5 border min-h-[400px]"
      style={{
        borderColor:
          "color-mix(in oklab, var(--color-amber-400) 30%, transparent)",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="text-lg font-semibold text-cyan-100/90">My Positions</div>
        <button
          className="text-sm text-cyan-200 underline decoration-cyan-400/40 hover:text-white transition-colors"
          onClick={onShowHistory}
        >
          Show deposit history
        </button>
      </div>

      {/* SupplierCap Selector (only show if multiple caps exist) */}
      {uniqueCapIds.length > 1 && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <label className="text-sm font-medium text-cyan-100/90">
              SupplierCap:
            </label>
            <select
              value={selectedCapId || ""}
              onChange={(e) => setSelectedCapId(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-cyan-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
            >
              {uniqueCapIds.map((capId) => (
                <option key={capId} value={capId}>
                  {truncateAddress(capId)}
                </option>
              ))}
            </select>
            <button
              onClick={() => copyToClipboard(selectedCapId || "")}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-cyan-200 transition-colors"
              title="Copy SupplierCap ID"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-cyan-200/70 flex items-center gap-1">
            <span>ℹ️</span>
            <span>
              SupplierCap is a transferable NFT that allows you to supply/withdraw. One cap works across all pools.
            </span>
          </div>
        </div>
      )}

      {/* SupplierCap Info (show for single cap) */}
      {uniqueCapIds.length === 1 && (
        <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-cyan-100/90">SupplierCap:</span>
            <a
              href={`${explorerUrl}/object/${uniqueCapIds[0]}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-300 hover:text-cyan-200 underline text-sm font-mono"
            >
              {truncateAddress(uniqueCapIds[0])}
            </a>
            <button
              onClick={() => copyToClipboard(uniqueCapIds[0])}
              className="px-2 py-0.5 text-xs bg-white/10 hover:bg-white/20 rounded border border-white/20 text-cyan-200 transition-colors"
              title="Copy SupplierCap ID"
            >
              Copy
            </button>
          </div>
          <div className="text-xs text-cyan-200/70 flex items-center gap-1">
            <span>ℹ️</span>
            <span>
              SupplierCap is a transferable NFT that allows you to supply/withdraw. One cap works across all pools.
            </span>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="text-cyan-100/70 border-b border-white/10">
            <tr className="text-left">
              <th className="py-3 pr-4 font-semibold">Asset</th>
              <th className="py-3 pr-4 font-semibold">Current Balance</th>
              <th className="py-3 pr-4 font-semibold">Interest Earned</th>
              {uniqueCapIds.length > 1 && (
                <th className="py-3 pr-4 font-semibold">SupplierCap</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredPositions.map((pos) => {
              // Use the enriched data if available, otherwise fall back to static data
              const currentBalance = pos.currentValueFromChain || pos.balanceFormatted;
              const interestEarned = pos.interestEarned || "—";
              const isIndexerPending = interestEarned.includes('indexer pending');

              return (
                <tr
                  key={`${pos.supplierCapId}-${pos.asset}`}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="py-4 pr-4 font-medium">{pos.asset}</td>
                  <td className="py-4 pr-4 text-amber-300 font-semibold">
                    {currentBalance}
                    {pos.isLoading && <span className="ml-2 text-xs text-cyan-300 animate-pulse">updating...</span>}
                  </td>
                  <td className="py-4 pr-4 text-green-300 font-semibold">
                    {interestEarned}
                    {isIndexerPending && (
                      <span 
                        className="ml-1 text-xs text-cyan-400/70 cursor-help" 
                        title="Interest calculation requires event history from the indexer. The indexer is currently behind or not running. Interest will display once events are available."
                      >
                        ⓘ
                      </span>
                    )}
                  </td>
                  {uniqueCapIds.length > 1 && (
                    <td className="py-4 pr-4">
                      <a
                        href={`${explorerUrl}/object/${pos.supplierCapId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-200 underline text-sm font-mono"
                      >
                        {truncateAddress(pos.supplierCapId)}
                      </a>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PersonalPositions;
