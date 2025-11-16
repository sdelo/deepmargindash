import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { timeRangeToParams, DEFAULT_TIME_RANGE } from '../api/types';
import type { QueryParams, TimeRange } from '../api/types';
import {
  fetchLoanBorrowed,
  fetchLoanRepaid,
  fetchLiquidations,
  fetchAssetSupplied,
  fetchAssetWithdrawn,
  fetchInterestParamsUpdated,
  fetchMarginPoolConfigUpdated,
} from '../api/events';
import {
  aggregateLoanEvents,
  aggregateSupplyWithdrawEvents,
  transformInterestRateHistory,
  type SupplyBorrowPoint,
  type InterestRatePoint,
  type TimeSeriesPoint,
} from '../utils/eventTransform';

/**
 * Hook to fetch and aggregate loan events (borrowed + repaid)
 */
export function useLoanEvents(
  poolId?: string,
  managerId?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    margin_manager_id: managerId,
    ...timeRangeToParams(timeRange), // Now defaults to 1 year
  };

  const borrowedQuery = useQuery({
    queryKey: ['loanBorrowed', params],
    queryFn: () => fetchLoanBorrowed(params),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const repaidQuery = useQuery({
    queryKey: ['loanRepaid', params],
    queryFn: () => fetchLoanRepaid(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const aggregated = React.useMemo(() => {
    if (!borrowedQuery.data || !repaidQuery.data) return null;
    
    // Determine decimals based on pool (default to 9 for SUI)
    const decimals = 9; // TODO: Get from pool config
    
    return aggregateLoanEvents(borrowedQuery.data, repaidQuery.data, 'day', decimals);
  }, [borrowedQuery.data, repaidQuery.data]);

  return {
    borrowed: borrowedQuery.data ?? [],
    repaid: repaidQuery.data ?? [],
    aggregated,
    isLoading: borrowedQuery.isLoading || repaidQuery.isLoading,
    error: borrowedQuery.error || repaidQuery.error,
    refetch: () => {
      borrowedQuery.refetch();
      repaidQuery.refetch();
    },
  };
}

/**
 * Hook to fetch liquidation events
 */
export function useLiquidationEvents(
  poolId?: string,
  managerId?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    margin_manager_id: managerId,
    ...timeRangeToParams(timeRange), // Now defaults to 1 year
  };

  return useQuery({
    queryKey: ['liquidation', params],
    queryFn: () => fetchLiquidations(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

/**
 * Hook to fetch supply/withdraw events and aggregate them
 */
export function useSupplyWithdrawEvents(
  poolId?: string,
  userAddress?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    supplier: userAddress,
    ...timeRangeToParams(timeRange), // Now defaults to 1 year
  };

  const suppliedQuery = useQuery({
    queryKey: ['assetSupplied', params],
    queryFn: () => fetchAssetSupplied(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const withdrawnQuery = useQuery({
    queryKey: ['assetWithdrawn', params],
    queryFn: () => fetchAssetWithdrawn(params),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });

  const aggregated = React.useMemo(() => {
    if (!suppliedQuery.data || !withdrawnQuery.data) return null;
    
    // Determine decimals based on pool (default to 9 for SUI)
    const decimals = 9; // TODO: Get from pool config
    
    return aggregateSupplyWithdrawEvents(
      suppliedQuery.data,
      withdrawnQuery.data,
      'day',
      decimals
    );
  }, [suppliedQuery.data, withdrawnQuery.data]);

  return {
    supplied: suppliedQuery.data ?? [],
    withdrawn: withdrawnQuery.data ?? [],
    aggregated,
    isLoading: suppliedQuery.isLoading || withdrawnQuery.isLoading,
    error: suppliedQuery.error || withdrawnQuery.error,
    refetch: () => {
      suppliedQuery.refetch();
      withdrawnQuery.refetch();
    },
  };
}

/**
 * Hook to fetch interest rate history
 */
export function useInterestRateHistory(
  poolId?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    ...timeRangeToParams(timeRange), // Now defaults to 1 year
  };

  const query = useQuery({
    queryKey: ['interestParamsUpdated', params],
    queryFn: () => fetchInterestParamsUpdated(params),
    staleTime: 60 * 1000, // Interest rates change less frequently
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  const transformed = React.useMemo(() => {
    if (!query.data) return null;
    return transformInterestRateHistory(query.data);
  }, [query.data]);

  return {
    ...query,
    data: query.data ?? [],
    transformed,
  };
}

/**
 * Hook to fetch pool config update history
 */
export function usePoolConfigHistory(
  poolId?: string,
  timeRange?: TimeRange
) {
  const params: QueryParams = {
    margin_pool_id: poolId,
    ...timeRangeToParams(timeRange), // Now defaults to 1 year
  };

  return useQuery({
    queryKey: ['marginPoolConfigUpdated', params],
    queryFn: () => fetchMarginPoolConfigUpdated(params),
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}

