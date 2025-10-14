import { MarginPool } from '../contracts/deepbook_margin/margin_pool';
import { calculatePoolRates } from './interestRates';
import { CONTRACTS } from '../config/contracts';
import type { PoolOverview } from '../features/lending/types';

/**
 * Converts blockchain values from smallest units to human-readable units
 * Example: 1000000000 MIST (1e9) -> 1 SUI
 */
function convertFromSmallestUnits(value: string | number | bigint, decimals: number): number {
  const divisor = Number(10 ** decimals);
  return Number(value) / divisor;
}

/**
 * Converts 9-decimal format to percentage (for interest rates and config values)
 * Example: 900000000 (9 decimals) = 0.9 (90%)
 */
function nineDecimalToPercent(nineDecimal: string | number | bigint): number {
  return Number(nineDecimal) / 1_000_000_000;
}

/**
 * Transforms raw BCS data into a PoolOverview object
 * Handles unit conversion, type conversion, and rate calculations
 */
export function transformMarginPoolData(
  marginPool: typeof MarginPool["$inferInput"], // The parsed MarginPool object from BCS
  poolId: string,
  assetType: string
): PoolOverview {
  // Determine asset type
  const isSui = assetType.includes('0x2::sui::SUI');
  const asset: 'SUI' | 'USDC' = isSui ? 'SUI' : 'USDC';

  // Get the appropriate decimal places for this asset
  const decimals = isSui ? 9 : 6; // SUI has 9 decimals, DBUSDC has 6 decimals

  
  // Access the parsed MarginPool object fields
  const state = {
    supply: convertFromSmallestUnits(marginPool.state.total_supply, decimals),
    borrow: convertFromSmallestUnits(marginPool.state.total_borrow, decimals),
    supply_shares: convertFromSmallestUnits(marginPool.state.supply_shares, decimals),
    borrow_shares: convertFromSmallestUnits(marginPool.state.borrow_shares, decimals),
    last_update_timestamp: Number(marginPool.state.last_update_timestamp), 
  };

  const protocolConfig = {
    margin_pool_config: {
      // Supply cap and min borrow are in smallest units of the underlying token
      supply_cap: convertFromSmallestUnits(marginPool.config.margin_pool_config.supply_cap, decimals),
      min_borrow: convertFromSmallestUnits(marginPool.config.margin_pool_config.min_borrow, decimals),
      // Config values are always in 9-decimal format regardless of underlying token decimals
      max_utilization_rate: nineDecimalToPercent(marginPool.config.margin_pool_config.max_utilization_rate),
      protocol_spread: nineDecimalToPercent(marginPool.config.margin_pool_config.referral_spread),
    },
    interest_config: {
      // Interest rates are in 9-decimal format
      base_rate: nineDecimalToPercent(marginPool.config.interest_config.base_rate),
      base_slope: nineDecimalToPercent(marginPool.config.interest_config.base_slope),
      optimal_utilization: nineDecimalToPercent(marginPool.config.interest_config.optimal_utilization),
      excess_slope: nineDecimalToPercent(marginPool.config.interest_config.excess_slope),
    },
  };

  // Get contract metadata based on asset type
  const contracts = isSui 
    ? {
        registryId: CONTRACTS.testnet.MARGIN_REGISTRY_ID,
        marginPoolId: CONTRACTS.testnet.SUI_MARGIN_POOL_ID,
        marginPoolType: CONTRACTS.testnet.SUI_MARGIN_POOL_TYPE,
        referralId: CONTRACTS.testnet.SUI_MARGIN_POOL_REFERRAL,
        coinType: CONTRACTS.testnet.SUI_MARGIN_POOL_TYPE,
        coinDecimals: 9,
        coinDepositSourceId: CONTRACTS.testnet.SUI_ID,
      }
    : {
        registryId: CONTRACTS.testnet.MARGIN_REGISTRY_ID,
        marginPoolId: CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID,
        marginPoolType: CONTRACTS.testnet.DBUSDC_MARGIN_POOL_TYPE,
        referralId: CONTRACTS.testnet.DBUSDC_MARGIN_POOL_REFERRAL,
        coinType: CONTRACTS.testnet.DBUSDC_MARGIN_POOL_TYPE,
        coinDecimals: 6,
        coinDepositSourceId: CONTRACTS.testnet.DBUSDC_ID,
      };

  // Create temporary pool object for rate calculations
  const tempPool: PoolOverview = {
    id: poolId,
    asset,
    state,
    protocolConfig,
    contracts,
    ui: {
      aprSupplyPct: 0, // Will be calculated below
      depositors: 0,
      ageDays: 0,
      deepbookPoolId: '0x…DB00',
    },
  };

  // Calculate rates using utility function
  const { supplyApr } = calculatePoolRates(tempPool);

  // Return final pool overview with calculated rates
  return {
    ...tempPool,
    ui: {
      ...tempPool.ui,
      aprSupplyPct: supplyApr,
    },
  };
}
