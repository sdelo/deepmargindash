export type AppNetwork = "testnet" | "mainnet";

export interface NetworkConfig {
  serverUrl: string;
  explorerUrl: string;
}

// Read from environment variables with fallbacks
const TESTNET_SERVER_URL = process.env.TESTNET_SERVER_URL || "https://deepbook-indexer.testnet.mystenlabs.com";
const MAINNET_SERVER_URL = process.env.MAINNET_SERVER_URL || "https://deepbook-indexer.mainnet.mystenlabs.com";

export const NETWORK_CONFIGS: Record<AppNetwork, NetworkConfig> = {
  testnet: {
    serverUrl: TESTNET_SERVER_URL,
    explorerUrl: "https://testnet.suivision.xyz",
  },
  mainnet: {
    serverUrl: MAINNET_SERVER_URL,
    explorerUrl: "https://suivision.xyz",
  },
};

export const DEFAULT_NETWORK: AppNetwork = "testnet";

