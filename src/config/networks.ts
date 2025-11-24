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
export const TESTNET_INDEXERS: IndexerOption[] = [
  // {
  //   label: "Localhost",
  //   url: "http://localhost:9008",
  // },
  {
    label: "Dummy Data",
    url: "http://3.135.85.195:9008",
  },
  // {
  //   label: "Mysten Labs",
  //   url: "https://deepbook-indexer.testnet.mystenlabs.com",
  // },
];

// For development with bun --hot --serve, we'll use defaults that can be overridden
// by creating a .env file. However, since bun's dev server doesn't inject env vars
// into the browser bundle, we hardcode sensible defaults here.
// 
// To use localhost for development, simply edit this file directly.
const IS_LOCAL_DEV = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const DEFAULT_TESTNET_SERVER_URL = IS_LOCAL_DEV 
  ? "http://localhost:9008"  // Default to localhost in dev
  : "https://deepbook-indexer.testnet.mystenlabs.com";

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

