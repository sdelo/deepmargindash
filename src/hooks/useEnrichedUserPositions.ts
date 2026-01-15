import React from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchUserCurrentSupply } from '../api/onChainReads';
import { fetchUserOriginalValue } from '../api/userHistory';
import { getContracts } from '../config/contracts';
import { useAppNetwork } from '../context/AppNetworkContext';
import type { UserPosition, PoolOverview } from '../features/lending/types';

export type EnrichedUserPosition = UserPosition & {
  currentValueFromChain: string | null;
  originalValueFromEvents: string | null;
  interestEarned: string | null;
  isLoading: boolean;
  error: Error | null;
};

type EnrichedDataEntry = {
  currentValue: bigint | null;
  originalValue: bigint | null;
  isLoading: boolean;
  error: Error | null;
  shares: number;  // Track shares to detect when position changes
};

/**
 * Hook to enrich user positions with live on-chain data and event-based cost basis.
 */
export function useEnrichedUserPositions(
  positions: UserPosition[],
  pools: PoolOverview[]
): EnrichedUserPosition[] {
  const suiClient = useSuiClient();
  const { network } = useAppNetwork();
  const [enrichedData, setEnrichedData] = React.useState<Map<string, EnrichedDataEntry>>(new Map());
  
  // Use ref to track in-flight requests to avoid duplicate fetching
  const inFlightRef = React.useRef<Set<string>>(new Set());
  
  // Use ref to access current enrichedData without adding it to dependencies
  const enrichedDataRef = React.useRef(enrichedData);
  enrichedDataRef.current = enrichedData;

  React.useEffect(() => {
    // Create a unique run ID for debugging
    const runId = Math.random().toString(36).slice(2, 8);
    console.log(`[useEnrichedUserPositions][${runId}] Effect starting`, {
      positionsCount: positions.length,
      poolsCount: pools.length,
    });

    if (positions.length === 0 || pools.length === 0) {
      console.log(`[useEnrichedUserPositions][${runId}] Skipping - no positions or pools`);
      return;
    }

    // Process each position
    for (const position of positions) {
      const key = `${position.supplierCapId}-${position.asset}`;
      
      // Skip if already in flight
      if (inFlightRef.current.has(key)) {
        console.log(`[useEnrichedUserPositions][${runId}] Skipping ${key} - already in flight`);
        continue;
      }

      // Skip if already successfully loaded AND shares haven't changed
      const existingData = enrichedDataRef.current.get(key);
      if (existingData && !existingData.isLoading && existingData.currentValue !== null && existingData.originalValue !== null && !existingData.error) {
        // Check if shares changed (deposit/withdraw happened)
        if (existingData.shares === position.shares) {
          console.log(`[useEnrichedUserPositions][${runId}] Skipping ${key} - already loaded, shares unchanged`);
          continue;
        } else {
          console.log(`[useEnrichedUserPositions][${runId}] Shares changed for ${key}: ${existingData.shares} -> ${position.shares}, re-fetching`);
        }
      }

      // Find the pool for this position
      const pool = pools.find(p => p.asset === position.asset);
      if (!pool) {
        console.log(`[useEnrichedUserPositions][${runId}] Pool not found for ${position.asset}`);
        continue;
      }

      // Mark as in-flight
      inFlightRef.current.add(key);

      console.log(`[useEnrichedUserPositions][${runId}] Fetching data for ${key}`);

      // Async IIFE to handle each position
      (async () => {
        try {
          const contracts = getContracts(network);
          const packageId = contracts.MARGIN_PACKAGE_ID;

          // Fetch current value from chain
          const currentValue = await fetchUserCurrentSupply(
            suiClient,
            pool.contracts.marginPoolId,
            position.supplierCapId,
            pool.contracts.marginPoolType,
            packageId
          );

          // Calculate original value from events
          // Ensure shares is converted to BigInt properly (handles string or number)
          const sharesAsBigInt = typeof position.shares === 'bigint' 
            ? position.shares 
            : BigInt(Math.floor(Number(position.shares)));
            
          const originalValue = await fetchUserOriginalValue(
            position.supplierCapId,
            pool.contracts.marginPoolId,
            sharesAsBigInt
          );

          // Log results (convert to string to avoid serialization issues)
          // Explicitly convert to BigInt to avoid "Cannot mix BigInt and other types" errors
          let interestCalc = 'pending';
          if (currentValue !== null && originalValue !== null) {
            const currentBigInt = BigInt(currentValue);
            const originalBigInt = BigInt(originalValue);
            interestCalc = (currentBigInt - originalBigInt).toString();
          }
          console.log(`[useEnrichedUserPositions][${runId}] ${position.asset} result:`, {
            currentValue: currentValue !== null ? String(currentValue) : null,
            originalValue: originalValue !== null ? String(originalValue) : null,
            interest: interestCalc
          });

          // Update state with functional update to avoid stale closure
          // Ensure all values are BigInt (convert if needed)
          const currentBigInt = currentValue !== null ? BigInt(currentValue) : null;
          const originalBigInt = originalValue !== null ? BigInt(originalValue) : null;
          
          setEnrichedData(prev => {
            const next = new Map(prev);
            next.set(key, {
              currentValue: currentBigInt,
              originalValue: originalBigInt,
              isLoading: false,
              error: null,
              shares: position.shares,  // Track shares to detect changes
            });
            return next;
          });
        } catch (error) {
          console.error(`[useEnrichedUserPositions][${runId}] Error for ${position.asset}:`, error);
          
          setEnrichedData(prev => {
            const next = new Map(prev);
            next.set(key, {
              currentValue: null,
              originalValue: null,
              isLoading: false,
              error: error instanceof Error ? error : new Error(String(error)),
              shares: position.shares,
            });
            return next;
          });
        } finally {
          // Remove from in-flight
          inFlightRef.current.delete(key);
        }
      })();
    }
  }, [positions, pools, suiClient, network]);

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
        isLoading: inFlightRef.current.has(key),
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
    let interestEarnedFormatted: string | null = null;
    
    if (enriched.currentValue !== null && enriched.originalValue !== null) {
      // Both values available - calculate interest
      const interestAmount = (Number(enriched.currentValue) - Number(enriched.originalValue)) / divisor;
      
      // Format based on the size of the interest
      // For very small amounts, use more decimal places
      let formattedInterest: string;
      if (Math.abs(interestAmount) < 0.0001) {
        // Very small - show in scientific notation or full precision
        formattedInterest = interestAmount.toFixed(9).replace(/\.?0+$/, '');
        if (formattedInterest === '0' || formattedInterest === '-0') {
          formattedInterest = interestAmount.toExponential(4);
        }
      } else if (Math.abs(interestAmount) < 0.01) {
        // Small - show 6 decimals
        formattedInterest = interestAmount.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 6,
        });
      } else {
        // Normal - show 4 decimals
        formattedInterest = interestAmount.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 4,
        });
      }
      interestEarnedFormatted = formattedInterest + ` ${position.asset}`;
    } else if (enriched.currentValue !== null && enriched.originalValue === null) {
      // Current value available but no event data
      interestEarnedFormatted = '— (indexer pending)';
    } else {
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
