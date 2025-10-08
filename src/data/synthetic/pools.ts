import type { PoolOverview } from '../../features/lending/types';
import { CONTRACTS } from '../../config/contracts';

function u64(n: number | bigint) {
  return BigInt(n);
}

function createState({ supply, borrow, supplyShares, borrowShares, lastUpdate }: { supply: number | bigint; borrow: number | bigint; supplyShares: number | bigint; borrowShares: number | bigint; lastUpdate: number | bigint; }) {
  return {
    fields: {
      supply: u64(supply),
      borrow: u64(borrow),
      supply_shares: u64(supplyShares),
      borrow_shares: u64(borrowShares),
      last_update_timestamp: u64(lastUpdate),
    },
  };
}

function createProtocolConfig({ supplyCap, maxUtilizationRate, protocolSpread, minBorrow, baseRate, baseSlope, optimalUtilization, excessSlope }: {
  supplyCap: number | bigint;
  maxUtilizationRate: number | bigint;
  protocolSpread: number | bigint;
  minBorrow: number | bigint;
  baseRate: number | bigint;
  baseSlope: number | bigint;
  optimalUtilization: number | bigint;
  excessSlope: number | bigint;
}) {
  return {
    fields: {
      margin_pool_config: {
        fields: {
          supply_cap: u64(supplyCap),
          max_utilization_rate: u64(maxUtilizationRate),
          protocol_spread: u64(protocolSpread),
          min_borrow: u64(minBorrow),
        },
      },
      interest_config: {
        fields: {
          base_rate: u64(baseRate),
          base_slope: u64(baseSlope),
          optimal_utilization: u64(optimalUtilization),
          excess_slope: u64(excessSlope),
        },
      },
    },
  };
}

const now = Math.floor(Date.now() / 1000);
const contracts = CONTRACTS.testnet;

export const syntheticPools: PoolOverview[] = [
  {
    id: '0xpool_usdc',
    asset: 'USDC',
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

export function formatNumber(n: number | bigint) {
  return Intl.NumberFormat('en-US').format(Number(n));
}

export function utilizationPct(supply: bigint, borrow: bigint) {
  if (supply === 0n) return 0;
  return Number((borrow * 10000n) / supply) / 100; // two decimals
}

