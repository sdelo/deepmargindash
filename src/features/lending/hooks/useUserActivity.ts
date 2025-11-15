import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeRangeToParams } from '../api/types';
import type { QueryParams, TimeRange } from '../api/types';
import {
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  type AssetSuppliedEventResponse,
  type AssetWithdrawnEventResponse,
} from '../api/events';
import { convertFromSmallestUnits } from '../utils/eventTransform';

/**
 * User transaction type
 */
export type UserTransactionType = 'supply' | 'withdraw';

/**
 * User transaction record
 */
export interface UserTransaction {
  id: string; // event_digest
  timestamp: number;
  type: UserTransactionType;
  poolId: string;
  assetType: string;
  amount: number;
  shares: number;
  transactionDigest: string;
  formattedAmount: string; // Human-readable amount with asset symbol
}

/**
 * Hook to fetch and format all user-related activity
 */
export function useUserActivity(
  userAddress: string | undefined,
  poolId?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    supplier: userAddress,
    ...(timeRange ? timeRangeToParams(timeRange) : {}),
  };

  const suppliedQuery = useQuery({
    queryKey: ['assetSupplied', 'user', params],
    queryFn: () => fetchAssetSupplied(params),
    enabled: !!userAddress,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const withdrawnQuery = useQuery({
    queryKey: ['assetWithdrawn', 'user', params],
    queryFn: () => fetchAssetWithdrawn(params),
    enabled: !!userAddress,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const transactions = React.useMemo(() => {
    if (!userAddress) return [];

    const supplied: UserTransaction[] = (suppliedQuery.data ?? []).map((event) => {
      // Determine decimals based on asset type (9 for SUI, 6 for DBUSDC)
      const decimals = event.asset_type.includes('SUI') ? 9 : 6;
      const amount = convertFromSmallestUnits(event.amount, decimals);
      const assetSymbol = event.asset_type.includes('SUI') ? 'SUI' : 'DBUSDC';

      return {
        id: event.event_digest,
        timestamp: event.checkpoint_timestamp_ms,
        type: 'supply' as const,
        poolId: event.margin_pool_id,
        assetType: event.asset_type,
        amount,
        shares: Number(event.shares),
        transactionDigest: event.digest,
        formattedAmount: `${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${assetSymbol}`,
      };
    });

    const withdrawn: UserTransaction[] = (withdrawnQuery.data ?? []).map((event) => {
      const decimals = event.asset_type.includes('SUI') ? 9 : 6;
      const amount = convertFromSmallestUnits(event.amount, decimals);
      const assetSymbol = event.asset_type.includes('SUI') ? 'SUI' : 'DBUSDC';

      return {
        id: event.event_digest,
        timestamp: event.checkpoint_timestamp_ms,
        type: 'withdraw' as const,
        poolId: event.margin_pool_id,
        assetType: event.asset_type,
        amount,
        shares: Number(event.shares),
        transactionDigest: event.digest,
        formattedAmount: `${amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${assetSymbol}`,
      };
    });

    // Combine and sort by timestamp (most recent first)
    const all = [...supplied, ...withdrawn].sort((a, b) => b.timestamp - a.timestamp);

    return all;
  }, [userAddress, suppliedQuery.data, withdrawnQuery.data]);

  return {
    transactions,
    isLoading: suppliedQuery.isLoading || withdrawnQuery.isLoading,
    error: suppliedQuery.error || withdrawnQuery.error,
    refetch: () => {
      suppliedQuery.refetch();
      withdrawnQuery.refetch();
    },
  };
}

