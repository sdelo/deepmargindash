import React from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchUserCurrentSupply } from '../api/onChainReads';
import { fetchUserOriginalValue } from '../api/userHistory';
import { CONTRACTS } from '../config/contracts';
import type { UserPosition, PoolOverview } from '../features/lending/types';

export type EnrichedUserPosition = UserPosition & {
  currentValueFromChain: string | null;
  originalValueFromEvents: string | null;
  interestEarned: string | null;
  isLoading: boolean;
  error: Error | null;
};

/**
 * Hook to enrich user positions with live on-chain data and event-based cost basis.
 * 
 * METHODOLOGY:
 * ============
 * The Move contract uses a share-based system where:
 * - User shares remain constant
 * - The share-to-amount ratio increases over time as interest accrues
 * 
 * To calculate interest earned:
 * 1. Current Value: Call user_supply_amount() view function (shares × current_ratio)
 * 2. Original Value: Calculate weighted average cost from AssetSupplied/AssetWithdrawn events
 * 3. Interest Earned: Current Value - Original Value
 * 
 * The AssetSupplied events contain both supply_amount and supply_shares, giving us
 * the exact ratio at deposit time, which is required to calculate the cost basis.
 */
export function useEnrichedUserPositions(
  positions: UserPosition[],
  pools: PoolOverview[]
): EnrichedUserPosition[] {
  const suiClient = useSuiClient();
  const [enrichedData, setEnrichedData] = React.useState<Map<string, {
    currentValue: bigint | null;
    originalValue: bigint | null;
    isLoading: boolean;
    error: Error | null;
  }>>(new Map());

  React.useEffect(() => {
    async function enrichPositions() {
      const newEnrichedData = new Map();

      for (const position of positions) {
        const key = `${position.supplierCapId}-${position.asset}`;
        
        // Skip if already loading or loaded
        if (enrichedData.has(key)) {
          newEnrichedData.set(key, enrichedData.get(key));
          continue;
        }

        // Mark as loading
        newEnrichedData.set(key, {
          currentValue: null,
          originalValue: null,
          isLoading: true,
          error: null,
        });

        // Find the pool for this position
        const pool = pools.find(p => p.asset === position.asset);
        if (!pool) {
          newEnrichedData.set(key, {
            currentValue: null,
            originalValue: null,
            isLoading: false,
            error: new Error('Pool not found'),
          });
          continue;
        }

        try {
          const packageId = CONTRACTS.testnet.MARGIN_PACKAGE_ID;

          // Fetch current value from chain (shares × current_ratio)
          const currentValue = await fetchUserCurrentSupply(
            suiClient,
            pool.contracts.marginPoolId,
            position.supplierCapId,
            pool.contracts.marginPoolType,
            packageId
          );

          // Calculate original value from events (weighted average cost basis)
          // This uses AssetSupplied events which contain both supply_amount and supply_shares
          const originalValue = await fetchUserOriginalValue(
            position.supplierCapId,
            pool.contracts.marginPoolId,
            BigInt(position.shares)
          );

          console.log(`[useEnrichedUserPositions] ${position.asset}:`, {
            shares: position.shares,
            currentValue: currentValue?.toString(),
            originalValue: originalValue?.toString(),
            interest: currentValue && originalValue 
              ? (currentValue - originalValue).toString() 
              : 'pending'
          });

          newEnrichedData.set(key, {
            currentValue,
            originalValue,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          newEnrichedData.set(key, {
            currentValue: null,
            originalValue: null,
            isLoading: false,
            error: error as Error,
          });
        }
      }

      setEnrichedData(newEnrichedData);
    }

    if (positions.length > 0 && pools.length > 0) {
      enrichPositions();
    }
  }, [positions, pools, suiClient]);

  // Merge the enriched data with positions
  return positions.map(position => {
    const key = `${position.supplierCapId}-${position.asset}`;
    const enriched = enrichedData.get(key);
    const pool = pools.find(p => p.asset === position.asset);

    if (!enriched || !pool) {
      return {
        ...position,
        currentValueFromChain: null,
        originalValueFromEvents: null,
        interestEarned: null,
        isLoading: false,
        error: null,
      };
    }

    // Format the values
    const decimals = pool.contracts.coinDecimals;
    const divisor = 10 ** decimals;
    
    const currentValueFormatted = enriched.currentValue !== null
      ? (Number(enriched.currentValue) / divisor).toLocaleString() + ` ${position.asset}`
      : null;
    
    const originalValueFormatted = enriched.originalValue !== null
      ? (Number(enriched.originalValue) / divisor).toLocaleString() + ` ${position.asset}`
      : null;

    // Calculate interest earned
    // If current value is available but original value is not, the indexer is behind
    let interestEarnedFormatted: string | null = null;
    
    if (enriched.currentValue !== null && enriched.originalValue !== null) {
      // Both values available - calculate interest
      const interestAmount = (Number(enriched.currentValue) - Number(enriched.originalValue)) / divisor;
      interestEarnedFormatted = interestAmount.toLocaleString() + ` ${position.asset}`;
    } else if (enriched.currentValue !== null && enriched.originalValue === null) {
      // Current value available but no event data - indexer not running or behind
      interestEarnedFormatted = '— (indexer pending)';
    } else {
      // No data available
      interestEarnedFormatted = null;
    }

    return {
      ...position,
      currentValueFromChain: currentValueFormatted,
      originalValueFromEvents: originalValueFormatted,
      interestEarned: interestEarnedFormatted,
      isLoading: enriched.isLoading,
      error: enriched.error,
    };
  });
}

