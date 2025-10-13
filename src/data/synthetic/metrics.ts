export type TimePoint = { t: number; supply: number; borrow: number };
export type RateChange = { t: number };

export type HistoricalActivity = {
  points: TimePoint[];
  rateChanges: RateChange[];
};

export type DepositorTop = { address: string; sharePct: number; color: 'cyan' | 'amber' | 'teal' | 'emerald' | 'purple' | 'lavender' };
export type DepositorDistribution = {
  unique_count: number;
  top10_share: number;
  gini: number;
  hhi: number;
  topSuppliers: DepositorTop[];
};

export type DailyFee = { t: number; amount: number };
export type LiquidationEventPoint = { t: number; pool_reward: number; pool_default: number };
export type FeesMetrics = {
  total: number;
  last_24h: number;
  last_7d: number;
  spread: number;
  liq_pool_reward: number;
  liq_pool_default: number;
  dailyFees: DailyFee[];
  liquidations: LiquidationEventPoint[];
};

export const historicalByPool: Record<string, HistoricalActivity> = {
  '0xpool_usdc': {
    points: [
      { t: 0, supply: 230, borrow: 240 },
      { t: 1, supply: 220, borrow: 235 },
      { t: 2, supply: 200, borrow: 225 },
      { t: 3, supply: 210, borrow: 230 },
      { t: 4, supply: 190, borrow: 220 },
      { t: 5, supply: 180, borrow: 210 },
      { t: 6, supply: 170, borrow: 205 },
      { t: 7, supply: 150, borrow: 190 },
      { t: 8, supply: 140, borrow: 185 },
      { t: 9, supply: 130, borrow: 180 },
      { t: 10, supply: 120, borrow: 175 },
      { t: 11, supply: 110, borrow: 170 },
      { t: 12, supply: 100, borrow: 165 },
    ],
    rateChanges: [{ t: 4 }, { t: 9 }],
  },
  '0xpool_sui': {
    points: [
      { t: 0, supply: 240, borrow: 245 },
      { t: 1, supply: 232, borrow: 242 },
      { t: 2, supply: 220, borrow: 238 },
      { t: 3, supply: 210, borrow: 234 },
      { t: 4, supply: 205, borrow: 230 },
      { t: 5, supply: 196, borrow: 228 },
      { t: 6, supply: 190, borrow: 226 },
      { t: 7, supply: 182, borrow: 222 },
      { t: 8, supply: 176, borrow: 218 },
      { t: 9, supply: 170, borrow: 215 },
      { t: 10, supply: 164, borrow: 212 },
      { t: 11, supply: 158, borrow: 210 },
      { t: 12, supply: 155, borrow: 208 },
    ],
    rateChanges: [{ t: 5 }],
  },
};

export const depositorByPool: Record<string, DepositorDistribution> = {
  '0xpool_usdc': {
    unique_count: 312,
    top10_share: 58.2,
    gini: 0.41,
    hhi: 1180,
    topSuppliers: [
      { address: '0xA4…7C2F', sharePct: 28.0, color: 'cyan' },
      { address: '0x19…B0E1', sharePct: 18.0, color: 'amber' },
      { address: '0xF3…99AA', sharePct: 12.0, color: 'teal' },
      { address: '0x8D…1120', sharePct: 10.0, color: 'emerald' },
      { address: '0x77…4C11', sharePct: 8.0, color: 'purple' },
      { address: '0xEA…D7F5', sharePct: 24.0, color: 'lavender' },
    ],
  },
  '0xpool_sui': {
    unique_count: 188,
    top10_share: 52.5,
    gini: 0.36,
    hhi: 990,
    topSuppliers: [
      { address: '0xA8…DD2B', sharePct: 22.0, color: 'cyan' },
      { address: '0x21…0ABE', sharePct: 16.0, color: 'amber' },
      { address: '0x3F…1133', sharePct: 11.0, color: 'teal' },
      { address: '0xB7…4499', sharePct: 9.0, color: 'emerald' },
      { address: '0x42…77AC', sharePct: 7.0, color: 'purple' },
      { address: '0x9C…00F1', sharePct: 25.0, color: 'lavender' },
    ],
  },
};

export const feesByPool: Record<string, FeesMetrics> = {
  '0xpool_usdc': {
    total: 42580,
    last_24h: 620,
    last_7d: 4110,
    spread: 28400,
    liq_pool_reward: 11600,
    liq_pool_default: 1250,
    dailyFees: [
      { t: 0, amount: 40 },
      { t: 1, amount: 50 },
      { t: 2, amount: 55 },
      { t: 3, amount: 45 },
      { t: 4, amount: 60 },
      { t: 5, amount: 65 },
    ],
    liquidations: [
      { t: 2, pool_reward: 20, pool_default: 10 },
      { t: 5, pool_reward: 25, pool_default: 10 },
    ],
  },
  '0xpool_sui': {
    total: 39880,
    last_24h: 540,
    last_7d: 3820,
    spread: 26800,
    liq_pool_reward: 10200,
    liq_pool_default: 900,
    dailyFees: [
      { t: 0, amount: 38 },
      { t: 1, amount: 45 },
      { t: 2, amount: 50 },
      { t: 3, amount: 44 },
      { t: 4, amount: 57 },
      { t: 5, amount: 62 },
    ],
    liquidations: [
      { t: 1, pool_reward: 18, pool_default: 8 },
      { t: 4, pool_reward: 22, pool_default: 9 },
    ],
  },
};


