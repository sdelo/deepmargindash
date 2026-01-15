export const CONTRACTS = {
  testnet: {
    // Published package - from pool object type
    MARGIN_PACKAGE_ID: "0xb8620c24c9ea1a4a41e79613d2b3d1d93648d1bb6f6b789a7c8f261c94110e4b",

    // Registry Object (shared object from package init)
    MARGIN_REGISTRY_ID: "0x48d7640dfae2c6e9ceeada197a7a1643984b5a24c55a0c6c023dac77e0339f75",
    
    // Coins
    DEEP_ID: "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8",
    SUI_ID: "0x0000000000000000000000000000000000000000000000000000000000000002",
    DBUSDC_ID: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7",
    
    // Margin Pools - Updated from indexer /margin_pool_created endpoint
    SUI_MARGIN_POOL_ID: "0xcdbbe6a72e639b647296788e2e4b1cac5cea4246028ba388ba1332ff9a382eea",
    SUI_MARGIN_POOL_TYPE: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    DBUSDC_MARGIN_POOL_ID: "0xf08568da93834e1ee04f09902ac7b1e78d3fdf113ab4d2106c7265e95318b14d",
    DBUSDC_MARGIN_POOL_TYPE: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC",

    // Referrals - set to undefined until new referrals are created for current pools
    // (Old referral IDs were from a different package version)
    SUI_MARGIN_POOL_REFERRAL: undefined,
    DBUSDC_MARGIN_POOL_REFERRAL: undefined,
  },
  mainnet: {
    MARGIN_PACKAGE_ID: "0x97d9473771b01f77b0940c589484184b49f6444627ec121314fae6a6d36fb86b",

    // Registry Object
    MARGIN_REGISTRY_ID: "0x851e63bd0a3e25a12f02df82f0a1683064ee7ed0b1297dcd18707aa22b382ad3",
    
    // Coins
    DEEP_ID: "0x36dbef866a1d62bf7328989a10fb2f07d769f4ee587c0de4a0a256e57e0a58a8",
    SUI_ID: "0x0000000000000000000000000000000000000000000000000000000000000002",
    DBUSDC_ID: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7",
    
    // Margin Pools
    SUI_MARGIN_POOL_ID: "0x52fae759e70a7fd35f2a4538589a949ad120dc67fa1bda7bf0b12dcc650b173a",
    SUI_MARGIN_POOL_TYPE: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
    DBUSDC_MARGIN_POOL_ID: "0xfca47443db2177b3e7d93fdb4b3a7d33c3102688419146c9bac2628d735a7545",
    DBUSDC_MARGIN_POOL_TYPE: "0xf7152c05930480cd740d7311b5b8b45c6f488e3a53a11c3f74a6fac36a52e0d7::DBUSDC::DBUSDC",

    // Generated Referrals
    SUI_MARGIN_POOL_REFERRAL: "0x27723f851291153be05e1e3d9e590fad7f79e8bae37a63a22ca48f93ef0ec6ea",
    DBUSDC_MARGIN_POOL_REFERRAL: "0xd9f5b995d213258be1ed7c0d3e78435ffc55cd6042e98ca23910374de329bffe",
  },
} as const;

// Legacy exports for backward compatibility
export const DEEPBOOK_MARGIN_PACKAGE_IDS = {
  testnet: CONTRACTS.testnet.MARGIN_PACKAGE_ID,
  mainnet: CONTRACTS.mainnet.MARGIN_PACKAGE_ID,
} as const;

export const DEEPBOOK_MARGIN_PACKAGE_NAME = "@local-pkg/deepbook-margin" as const;

// Helper to get contracts for a specific network
export type NetworkType = "testnet" | "mainnet";
export function getContracts(network: NetworkType) {
  return CONTRACTS[network];
}
