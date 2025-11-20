import { apiClient } from '../../../lib/api/client';
import type { QueryParams, ApiEventResponse } from './types';
import { getDefaultTimeRange } from './types';

/**
 * API Event Response Types
 * These match the JSON structure returned by the backend
 */

// Loan Borrowed Event Response
export interface LoanBorrowedEventResponse extends ApiEventResponse<{
  margin_manager_id: string;
  margin_pool_id: string;
  loan_amount: string;
  loan_shares: string;
}> {}

// Loan Repaid Event Response
export interface LoanRepaidEventResponse extends ApiEventResponse<{
  margin_manager_id: string;
  margin_pool_id: string;
  repay_amount: string;
  repay_shares: string;
}> {}

// Liquidation Event Response
export interface LiquidationEventResponse extends ApiEventResponse<{
  margin_manager_id: string;
  margin_pool_id: string;
  liquidation_amount: string;
  pool_reward: string;
  pool_default: string;
  risk_ratio: string;
}> {}

// Asset Supplied Event Response
export interface AssetSuppliedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  asset_type: string;
  supplier: string;
  amount: string;
  shares: string;
}> {}

// Asset Withdrawn Event Response
export interface AssetWithdrawnEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  asset_type: string;
  supplier: string;
  amount: string;
  shares: string;
}> {}

// Interest Params Updated Event Response
export interface InterestParamsUpdatedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  pool_cap_id: string;
  interest_config: {
    base_rate: string;
    base_slope: string;
    optimal_utilization: string;
    excess_slope: string;
  };
}> {}

// Margin Pool Config Updated Event Response
export interface MarginPoolConfigUpdatedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  pool_cap_id: string;
  margin_pool_config: {
    supply_cap: string;
    max_utilization_rate: string;
    protocol_spread: string;
    min_borrow: string;
  };
}> {}

// Margin Pool Created Event Response
export interface MarginPoolCreatedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  maintainer_cap_id: string;
  asset_type: string;
  config_json: unknown; // JSON string or object
}> {}

// Deepbook Pool Updated Event Response
export interface DeepbookPoolUpdatedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  deepbook_pool_id: string;
  pool_cap_id: string;
  enabled: boolean;
}> {}

// Maintainer Fees Withdrawn Event Response
export interface MaintainerFeesWithdrawnEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  margin_pool_cap_id: string;
  maintainer_fees: string;
}> {}

// Protocol Fees Withdrawn Event Response
export interface ProtocolFeesWithdrawnEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  protocol_fees: string;
}> {}

// Protocol Fees Increased Event Response
export interface ProtocolFeesIncreasedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  new_protocol_fee_rate: string;
}> {}

// Referral Fees Claimed Event Response
export interface ReferralFeesClaimedEventResponse extends ApiEventResponse<{
  margin_pool_id: string;
  referral_id: string;
  amount: string;
}> {}

// Margin Manager Created Event Response
export interface MarginManagerCreatedEventResponse extends ApiEventResponse<{
  margin_manager_id: string;
  balance_manager_id: string;
  deepbook_pool_id: string | null;
  base_margin_pool_id?: string | null;
  quote_margin_pool_id?: string | null;
}> {}

// Margin Managers Info Response
export interface MarginManagersInfoResponse {
  margin_manager_id: string;
  deepbook_pool_id: string | null;
  base_asset_id: string | null;
  base_asset_symbol: string | null;
  quote_asset_id: string | null;
  quote_asset_symbol: string | null;
  base_margin_pool_id: string | null;
  quote_margin_pool_id: string | null;
}

// Margin Manager States Response (returns JSON directly)
export type MarginManagerStatesResponse = unknown[];

/**
 * Helper function to build query string from params
 * Automatically adds default time range (1 year) if start_time/end_time are not provided
 */
function buildQuery(params?: QueryParams): string {
  // Merge with default time range if not provided
  const defaultTimeRange = getDefaultTimeRange();
  const mergedParams: QueryParams = {
    start_time: defaultTimeRange.start_time,
    end_time: defaultTimeRange.end_time,
    ...params, // User-provided params override defaults
  };
  
  const searchParams = new URLSearchParams();
  
  Object.entries(mergedParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch loan borrowed events
 */
export async function fetchLoanBorrowed(
  params?: QueryParams
): Promise<LoanBorrowedEventResponse[]> {
  return apiClient.get<LoanBorrowedEventResponse[]>(`/loan_borrowed${buildQuery(params)}`);
}

/**
 * Fetch loan repaid events
 */
export async function fetchLoanRepaid(
  params?: QueryParams
): Promise<LoanRepaidEventResponse[]> {
  return apiClient.get<LoanRepaidEventResponse[]>(`/loan_repaid${buildQuery(params)}`);
}

/**
 * Fetch liquidation events
 */
export async function fetchLiquidations(
  params?: QueryParams
): Promise<LiquidationEventResponse[]> {
  return apiClient.get<LiquidationEventResponse[]>(`/liquidation${buildQuery(params)}`);
}

/**
 * Fetch asset supplied events
 */
export async function fetchAssetSupplied(
  params?: QueryParams
): Promise<AssetSuppliedEventResponse[]> {
  return apiClient.get<AssetSuppliedEventResponse[]>(`/asset_supplied${buildQuery(params)}`);
}

/**
 * Fetch asset withdrawn events
 */
export async function fetchAssetWithdrawn(
  params?: QueryParams
): Promise<AssetWithdrawnEventResponse[]> {
  return apiClient.get<AssetWithdrawnEventResponse[]>(`/asset_withdrawn${buildQuery(params)}`);
}

/**
 * Fetch interest params updated events
 */
export async function fetchInterestParamsUpdated(
  params?: QueryParams
): Promise<InterestParamsUpdatedEventResponse[]> {
  return apiClient.get<InterestParamsUpdatedEventResponse[]>(`/interest_params_updated${buildQuery(params)}`);
}

/**
 * Fetch margin pool config updated events
 */
export async function fetchMarginPoolConfigUpdated(
  params?: QueryParams
): Promise<MarginPoolConfigUpdatedEventResponse[]> {
  return apiClient.get<MarginPoolConfigUpdatedEventResponse[]>(`/margin_pool_config_updated${buildQuery(params)}`);
}

/**
 * Fetch margin pool created events
 */
export async function fetchMarginPoolCreated(
  params?: QueryParams
): Promise<MarginPoolCreatedEventResponse[]> {
  return apiClient.get<MarginPoolCreatedEventResponse[]>(`/margin_pool_created${buildQuery(params)}`);
}

/**
 * Fetch deepbook pool updated events
 */
export async function fetchDeepbookPoolUpdated(
  params?: QueryParams
): Promise<DeepbookPoolUpdatedEventResponse[]> {
  return apiClient.get<DeepbookPoolUpdatedEventResponse[]>(`/deepbook_pool_updated${buildQuery(params)}`);
}

/**
 * Fetch maintainer fees withdrawn events
 */
export async function fetchMaintainerFeesWithdrawn(
  params?: QueryParams
): Promise<MaintainerFeesWithdrawnEventResponse[]> {
  return apiClient.get<MaintainerFeesWithdrawnEventResponse[]>(`/maintainer_fees_withdrawn${buildQuery(params)}`);
}

/**
 * Fetch protocol fees withdrawn events
 */
export async function fetchProtocolFeesWithdrawn(
  params?: QueryParams
): Promise<ProtocolFeesWithdrawnEventResponse[]> {
  return apiClient.get<ProtocolFeesWithdrawnEventResponse[]>(`/protocol_fees_withdrawn${buildQuery(params)}`);
}

/**
 * Fetch protocol fees increased events
 */
export async function fetchProtocolFeesIncreased(
  params?: QueryParams
): Promise<ProtocolFeesIncreasedEventResponse[]> {
  return apiClient.get<ProtocolFeesIncreasedEventResponse[]>(`/protocol_fees_increased${buildQuery(params)}`);
}

/**
 * Fetch referral fees claimed events
 */
export async function fetchReferralFeesClaimed(
  params?: QueryParams
): Promise<ReferralFeesClaimedEventResponse[]> {
  return apiClient.get<ReferralFeesClaimedEventResponse[]>(`/referral_fees_claimed${buildQuery(params)}`);
}

/**
 * Fetch margin manager created events
 */
export async function fetchMarginManagerCreated(
  params?: QueryParams
): Promise<MarginManagerCreatedEventResponse[]> {
  return apiClient.get<MarginManagerCreatedEventResponse[]>(`/margin_manager_created${buildQuery(params)}`);
}

/**
 * Fetch margin managers info
 */
export async function fetchMarginManagersInfo(): Promise<MarginManagersInfoResponse[]> {
  return apiClient.get<MarginManagersInfoResponse[]>('/margin_managers_info');
}

/**
 * Fetch margin manager states
 */
export async function fetchMarginManagerStates(
  params?: QueryParams
): Promise<MarginManagerStatesResponse> {
  return apiClient.get<MarginManagerStatesResponse>(`/margin_manager_states${buildQuery(params)}`);
}

