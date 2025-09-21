export type InterestUpdate = {
  pool: string;
  timestamp: string;
  before: { base_rate: string; base_slope: string; optimal_u: string; excess_slope: string };
  after: { base_rate: string; base_slope: string; optimal_u: string; excess_slope: string };
};

export type PoolConfigUpdate = {
  pool: string;
  timestamp: string;
  before: { supply_cap: string; max_util: string; protocol_spread: string; min_borrow: string };
  after: { supply_cap: string; max_util: string; protocol_spread: string; min_borrow: string };
};

export type DeepbookUpdate = {
  pool: string;
  timestamp: string;
  deepbook_pool_id: string;
  pool_cap_id: string;
  enabled: boolean;
};

export type AdminChangeLog = {
  totals: { total: number; interest: number; pool: number; deepbook: number };
  interestUpdates: InterestUpdate[];
  poolConfigUpdates: PoolConfigUpdate[];
  deepbookUpdates: DeepbookUpdate[];
};

export const syntheticAdminLog: Record<string, AdminChangeLog> = {
  '0xpool_usdc': {
    totals: { total: 28, interest: 12, pool: 9, deepbook: 7 },
    interestUpdates: [
      {
        pool: '0x…AB12',
        timestamp: '2025‑09‑20 13:40',
        before: { base_rate: '2.0%', base_slope: '12%', optimal_u: '70%', excess_slope: '35%' },
        after: { base_rate: '2.5%', base_slope: '14%', optimal_u: '65%', excess_slope: '40%' },
      },
    ],
    poolConfigUpdates: [
      {
        pool: '0x…CD44',
        timestamp: '2025‑09‑18 08:23',
        before: { supply_cap: '1,000,000', max_util: '90%', protocol_spread: '10%', min_borrow: '100' },
        after: { supply_cap: '2,000,000', max_util: '92%', protocol_spread: '12%', min_borrow: '200' },
      },
    ],
    deepbookUpdates: [
      { pool: '0x…71AF', timestamp: '2025‑09‑16 17:02', deepbook_pool_id: '0x…DB00', pool_cap_id: '0x…PC01', enabled: true },
    ],
  },
  '0xpool_sui': {
    totals: { total: 22, interest: 9, pool: 8, deepbook: 5 },
    interestUpdates: [
      {
        pool: '0x…CD44',
        timestamp: '2025‑09‑15 10:11',
        before: { base_rate: '1.8%', base_slope: '11%', optimal_u: '68%', excess_slope: '36%' },
        after: { base_rate: '2.1%', base_slope: '12%', optimal_u: '70%', excess_slope: '38%' },
      },
    ],
    poolConfigUpdates: [
      {
        pool: '0x…EF55',
        timestamp: '2025‑09‑12 07:45',
        before: { supply_cap: '1,800,000', max_util: '88%', protocol_spread: '9%', min_borrow: '50' },
        after: { supply_cap: '2,500,000', max_util: '90%', protocol_spread: '10%', min_borrow: '60' },
      },
    ],
    deepbookUpdates: [
      { pool: '0x…9AA1', timestamp: '2025‑09‑10 12:30', deepbook_pool_id: '0x…DB11', pool_cap_id: '0x…PC11', enabled: true },
    ],
  },
};


