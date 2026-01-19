import type { PoolOverview } from '../../features/lending/types';
import { CONTRACTS } from '../../config/contracts';

function createState({ supply, borrow, supplyShares, borrowShares, lastUpdate }: { supply: number ; borrow: number ; supplyShares: number ; borrowShares: number ; lastUpdate: number ; }) {
  return {
    supply: supply,
    borrow: borrow,
    supply_shares: supplyShares,
    borrow_shares: borrowShares,
    last_update_timestamp: lastUpdate,
  };
}

function createProtocolConfig({ supplyCap, maxUtilizationRate, protocolSpread, minBorrow, baseRate, baseSlope, optimalUtilization, excessSlope }: {
  supplyCap: number ;
  maxUtilizationRate: number ;
  protocolSpread: number ;
  minBorrow: number ;
  baseRate: number ;
  baseSlope: number ;
  optimalUtilization: number ;
  excessSlope: number ;
}) {
  return {
    margin_pool_config: {
      supply_cap: supplyCap,
      max_utilization_rate: maxUtilizationRate,
      protocol_spread: protocolSpread,
      min_borrow: minBorrow,
    },
    interest_config: {
      base_rate: baseRate,
      base_slope: baseSlope,
      optimal_utilization: optimalUtilization,
      excess_slope: excessSlope,
    },
  };
}

const now = Math.floor(Date.now() / 1000);
const contracts = CONTRACTS.testnet;

export const syntheticPools: PoolOverview[] = [
  {
    id: '0xpool_dbusdc',
    asset: 'DBUSDC',
    state: createState({ supply: 1_250_000, borrow: 820_000, supplyShares: 1_250_000, borrowShares: 820_000, lastUpdate: now }),
    protocolConfig: createProtocolConfig({
      supplyCap: 2_000_000,
      maxUtilizationRate: 9000, // 90.00%
      protocolSpread: 150, // 1.50%
      minBorrow: 100,
      baseRate: 200, // 2%
      baseSlope: 600,
      optimalUtilization: 7000, // 70%
      excessSlope: 1500,
    }),
    contracts: {
      registryId: contracts.MARGIN_REGISTRY_ID,
      marginPoolId: contracts.DBUSDC_MARGIN_POOL_ID,
      marginPoolType: contracts.DBUSDC_MARGIN_POOL_TYPE,
      referralId: contracts.DBUSDC_MARGIN_POOL_REFERRAL,
      coinType: contracts.DBUSDC_MARGIN_POOL_TYPE,
      coinDecimals: 6,
      coinDepositSourceId: contracts.DBUSDC_ID,
    },
    ui: {
      aprSupplyPct: 7.8,
      depositors: 312,
      ageDays: 34,
      deepbookPoolId: '0x…DB00',
    },
  },
  {
    id: '0xpool_sui',
    asset: 'SUI',
    state: createState({ supply: 980_000, borrow: 620_000, supplyShares: 980_000, borrowShares: 620_000, lastUpdate: now }),
    protocolConfig: createProtocolConfig({
      supplyCap: 2_500_000,
      maxUtilizationRate: 9200,
      protocolSpread: 140,
      minBorrow: 50,
      baseRate: 180,
      baseSlope: 650,
      optimalUtilization: 6800,
      excessSlope: 1600,
    }),
    contracts: {
      registryId: contracts.MARGIN_REGISTRY_ID,
      marginPoolId: contracts.SUI_MARGIN_POOL_ID,
      marginPoolType: contracts.SUI_MARGIN_POOL_TYPE,
      referralId: contracts.SUI_MARGIN_POOL_REFERRAL,
      coinType: contracts.SUI_MARGIN_POOL_TYPE,
      coinDecimals: 9,
      coinDepositSourceId: contracts.SUI_ID,
    },
    ui: {
      aprSupplyPct: 8.6,
      depositors: 188,
      ageDays: 21,
      deepbookPoolId: '0x…DB11',
    },
  },
];

export function formatNumber(n: number | number) {
  return Intl.NumberFormat('en-US').format(Number(n));
}

/**
 * Format currency with consistent decimal places
 * For amounts >= $1000: show no decimals ($10,051)
 * For amounts < $1000: show 2 decimals ($31.40)
 */
export function formatCurrency(n: number | number) {
  const num = Number(n);
  if (num >= 1000) {
    return Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
  }
  return Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
}

export function utilizationPct(supply: number, borrow: number) {
  if (supply === 0) return 0;
  return Number(((borrow / supply) * 100).toFixed(2));
}

