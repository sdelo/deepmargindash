import React from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { fetchMarginPool } from '../api/poolData';
import type { PoolOverview } from '../features/lending/types';

export type PoolDataResult = {
  data: PoolOverview | null;
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function usePoolData(poolId: string): PoolDataResult {
  const suiClient = useSuiClient();
  const [data, setData] = React.useState<PoolOverview | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = React.useCallback(async () => {
    if (!poolId) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchMarginPool(suiClient, poolId);
      setData(result);
    } catch (err) {
      setError(err as Error);
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [suiClient, poolId]);

  // Initial fetch
  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up automatic refetching every 15 seconds
  React.useEffect(() => {
    if (!poolId) return;
    
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [fetchData, poolId]);

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  };
}
