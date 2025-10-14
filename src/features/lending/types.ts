export type PoolAssetSymbol = 'USDC' | 'SUI';

export type StateFields = {
  supply: number;
  borrow: number;
  supply_shares: number;
  borrow_shares: number;
  last_update_timestamp: number;
};

export type ProtocolConfigFields = {
  margin_pool_config: {
    supply_cap: number;
    max_utilization_rate: number;
    protocol_spread: number;
    min_borrow: number;
  };
  interest_config: {
    base_rate: number;
    base_slope: number;
    optimal_utilization: number;
    excess_slope: number;
  };
};

export type PoolOverview = {
  id: string;
  asset: PoolAssetSymbol;
  state: StateFields;
  protocolConfig: ProtocolConfigFields;
  contracts: {
    registryId: string;
    marginPoolId: string;
    marginPoolType: string;
    referralId?: string;
    coinType: string;
    coinDecimals: number;
    coinDepositSourceId?: string;
  };
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
  shares: number;
  balanceFormatted: string;
};

