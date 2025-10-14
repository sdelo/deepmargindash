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
  console.log(`🎣 useUserPositions hook called with address: ${userAddress}`);
  
  // Use the updated usePoolData hooks that now include user positions
  const suiPoolData = usePoolData(CONTRACTS.testnet.SUI_MARGIN_POOL_ID, userAddress);
  const dbusdcPoolData = usePoolData(CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID, userAddress);

  // Aggregate positions from both pools
  const positions = React.useMemo(() => {
    console.log(`🔄 Aggregating positions from pools:`, {
      suiUserPosition: suiPoolData.userPosition,
      dbusdcUserPosition: dbusdcPoolData.userPosition,
    });
    
    const allPositions: UserPosition[] = [];
    
    if (suiPoolData.userPosition) {
      allPositions.push(suiPoolData.userPosition);
      console.log(`✅ Added SUI position to aggregate`);
    }
    if (dbusdcPoolData.userPosition) {
      allPositions.push(dbusdcPoolData.userPosition);
      console.log(`✅ Added DBUSDC position to aggregate`);
    }
    
    console.log(`📊 Final aggregated positions:`, allPositions);
    return allPositions;
  }, [suiPoolData.userPosition, dbusdcPoolData.userPosition]);

  // Determine loading and error states
  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const error = suiPoolData.error || dbusdcPoolData.error;

  console.log(`📈 Hook state:`, {
    isLoading,
    hasError: !!error,
    positionsCount: positions.length,
    suiPoolLoading: suiPoolData.isLoading,
    dbusdcPoolLoading: dbusdcPoolData.isLoading,
  });

  // Refetch function that calls both pool refetch functions
  const refetch = React.useCallback(() => {
    console.log(`🔄 Refetching user positions...`);
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
