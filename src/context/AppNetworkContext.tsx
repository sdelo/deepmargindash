import React, { createContext, useContext, useEffect, useState } from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";
import {
  NETWORK_CONFIGS,
  AppNetwork,
  DEFAULT_NETWORK,
} from "../config/networks";
import { apiClient } from "../lib/api/client";

interface AppNetworkContextType {
  network: AppNetwork;
  serverUrl: string;
  explorerUrl: string;
  useLocalServer: boolean;
  setUseLocalServer: (use: boolean) => void;
}

const AppNetworkContext = createContext<AppNetworkContextType | null>(null);

export function AppNetworkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { network: suiNetwork } = useSuiClientContext();

  // Safe cast or fallback
  const currentNetwork = (suiNetwork as AppNetwork) || DEFAULT_NETWORK;

  // Configuration is now fully driven by environment variables and src/config/networks.ts
  const config =
    NETWORK_CONFIGS[currentNetwork] || NETWORK_CONFIGS[DEFAULT_NETWORK];
  const { serverUrl, explorerUrl } = config;

  useEffect(() => {
    apiClient.setBaseUrl(serverUrl);
  }, [serverUrl]);

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
