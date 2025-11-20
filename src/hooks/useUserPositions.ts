import React from 'react';
import { usePoolData } from './usePoolData';
import { CONTRACTS } from '../config/contracts';
import type { UserPosition } from '../features/lending/types';

export type UserPositionsResult = {
  data: UserPosition[];
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
};

export function useUserPositions(userAddress: string | undefined): UserPositionsResult {
  // Fetch pool data which includes user positions
  const suiPoolData = usePoolData(CONTRACTS.testnet.SUI_MARGIN_POOL_ID, userAddress);
  const dbusdcPoolData = usePoolData(CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID, userAddress);

  // Aggregate positions from both pools
  const positions = React.useMemo(() => {
    const allPositions: UserPosition[] = [];
    
    if (suiPoolData.userPosition) {
      allPositions.push(suiPoolData.userPosition);
    }
    if (dbusdcPoolData.userPosition) {
      allPositions.push(dbusdcPoolData.userPosition);
    }
    
    return allPositions;
  }, [suiPoolData.userPosition, dbusdcPoolData.userPosition]);

  // Determine loading and error states
  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const error = suiPoolData.error || dbusdcPoolData.error;

  // Refetch function that calls both pool refetch functions
  const refetch = React.useCallback(() => {
    suiPoolData.refetch();
    dbusdcPoolData.refetch();
  }, [suiPoolData.refetch, dbusdcPoolData.refetch]);

  return {
    data: positions,
    error,
    isLoading,
    refetch,
  };
}
