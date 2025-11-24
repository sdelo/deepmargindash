import React, { createContext, useContext, useEffect, useState } from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import {
  NETWORK_CONFIGS,
  AppNetwork,
  DEFAULT_NETWORK,
  TESTNET_INDEXERS,
} from "../config/networks";
import { apiClient } from "../lib/api/client";

const INDEXER_STORAGE_KEY = "deepdashboard_selected_indexer";

interface AppNetworkContextType {
  network: AppNetwork;
  serverUrl: string;
  explorerUrl: string;
  useLocalServer: boolean;
  setUseLocalServer: (use: boolean) => void;
  selectedIndexer: string;
  setSelectedIndexer: (indexerUrl: string) => void;
}

const AppNetworkContext = createContext<AppNetworkContextType | null>(null);

export function AppNetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { network: suiNetwork } = useSuiClientContext();
  const queryClient = useQueryClient();

  // Safe cast or fallback
  const currentNetwork = (suiNetwork as AppNetwork) || DEFAULT_NETWORK;

  // Configuration is now fully driven by environment variables and src/config/networks.ts
  const config =
    NETWORK_CONFIGS[currentNetwork] || NETWORK_CONFIGS[DEFAULT_NETWORK];
  const { explorerUrl } = config;

  // Manage selected indexer with localStorage persistence
  const [selectedIndexer, setSelectedIndexerState] = useState<string>(() => {
    if (currentNetwork === "testnet") {
      const stored = localStorage.getItem(INDEXER_STORAGE_KEY);
      if (stored && TESTNET_INDEXERS.some((i) => i.url === stored)) {
        return stored;
      }
      return config.serverUrl;
    }
    return config.serverUrl;
  });

  // Use selected indexer for testnet, default for mainnet
  const serverUrl =
    currentNetwork === "testnet" ? selectedIndexer : config.serverUrl;

  const setSelectedIndexer = (indexerUrl: string) => {
    setSelectedIndexerState(indexerUrl);
    localStorage.setItem(INDEXER_STORAGE_KEY, indexerUrl);
    // Update API client immediately for responsiveness
    // The useEffect below will also update it and reset queries when serverUrl changes
    apiClient.setBaseUrl(indexerUrl);
  };

  // Update API client when serverUrl changes
  useEffect(() => {
    apiClient.setBaseUrl(serverUrl);
  }, [serverUrl]);

  // Reset all queries when serverUrl changes (handles both manual toggle and network changes)
  useEffect(() => {
    queryClient.resetQueries();
  }, [serverUrl, queryClient]);

  // Update selected indexer when network changes
  useEffect(() => {
    if (currentNetwork === "testnet") {
      const stored = localStorage.getItem(INDEXER_STORAGE_KEY);
      if (stored && TESTNET_INDEXERS.some((i) => i.url === stored)) {
        setSelectedIndexerState(stored);
      } else {
        setSelectedIndexerState(config.serverUrl);
      }
    } else {
      setSelectedIndexerState(config.serverUrl);
    }
    // Note: The serverUrl effect below will handle resetting queries
  }, [currentNetwork, config.serverUrl]);

  return (
    <AppNetworkContext.Provider
      value={{
        network: currentNetwork,
        serverUrl,
        explorerUrl,
        // Deprecated: Local server is now controlled via env vars (TESTNET_SERVER_URL)
        useLocalServer: serverUrl.includes("localhost"),
        setUseLocalServer: () =>
          console.warn("Use TESTNET_SERVER_URL env var to toggle local server"),
        selectedIndexer,
        setSelectedIndexer,
      }}
    >
      {children}
    </AppNetworkContext.Provider>
  );
}

export function useAppNetwork() {
  const context = useContext(AppNetworkContext);
  if (!context) {
    throw new Error("useAppNetwork must be used within AppNetworkProvider");
  }
  return context;
}
