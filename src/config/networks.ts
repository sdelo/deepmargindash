export type AppNetwork = "testnet" | "mainnet";

export interface NetworkConfig {
  serverUrl: string;
  explorerUrl: string;
}

export interface IndexerOption {
  label: string;
  url: string;
}

// Available testnet indexers
// The first one in this list will be used as the default
export const TESTNET_INDEXERS: IndexerOption[] = [
  {
    label: "Dummy Data",
    url: "https://deepmargindash.duckdns.org",
  },
  {
    label: "Deepbook Indexer Testnet",
    url: "https://deepbook-indexer.testnet.mystenlabs.com",
  },
];

// Default to the first indexer in the list for consistency across all environments
const DEFAULT_TESTNET_SERVER_URL = TESTNET_INDEXERS[0]?.url || "https://deepbook-indexer.testnet.mystenlabs.com";

const MAINNET_SERVER_URL = "https://deepbook-indexer.mainnet.mystenlabs.com";

export const NETWORK_CONFIGS: Record<AppNetwork, NetworkConfig> = {
  testnet: {
    serverUrl: DEFAULT_TESTNET_SERVER_URL,
    explorerUrl: "https://testnet.suivision.xyz",
  },
  mainnet: {
    serverUrl: MAINNET_SERVER_URL,
    explorerUrl: "https://suivision.xyz",
  },
};

export const DEFAULT_NETWORK: AppNetwork = "testnet";

