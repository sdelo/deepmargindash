export type PoolAssetSymbol = 'USDC' | 'SUI';

export type StateFields = {
  supply: bigint;
  borrow: bigint;
  supply_shares: bigint;
  borrow_shares: bigint;
  last_update_timestamp: bigint;
};

export type ProtocolConfigFields = {
  margin_pool_config: {
    fields: {
      supply_cap: bigint;
      max_utilization_rate: bigint;
      protocol_spread: bigint;
      min_borrow: bigint;
    };
  };
  interest_config: {
    fields: {
      base_rate: bigint;
      base_slope: bigint;
      optimal_utilization: bigint;
      excess_slope: bigint;
    };
  };
};

export type PoolOverview = {
  id: string;
  asset: PoolAssetSymbol;
  state: { fields: StateFields };
  protocolConfig: { fields: ProtocolConfigFields };
  ui: {
    aprSupplyPct: number;
    depositors: number;
    ageDays: number;
    deepbookPoolId: string;
  };
};

export type UserPosition = {
  address: string;
  asset: PoolAssetSymbol;
  shares: bigint;
  balanceFormatted: string;
};

