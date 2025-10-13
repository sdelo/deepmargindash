import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import "./index.processed.css";
import "@mysten/dapp-kit/dist/index.css";
import App from "./App";
import { setTheme } from "./theme";
import {
  createNetworkConfig,
  SuiClientProvider,
  WalletProvider,
} from "@mysten/dapp-kit";
import { getFullnodeUrl } from "@mysten/sui/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  DEEPBOOK_MARGIN_PACKAGE_IDS,
  DEEPBOOK_MARGIN_PACKAGE_NAME,
} from "./config/contracts";

function Root() {
  useEffect(() => {
    setTheme("leviathan");
    // Expose a quick switch for manual testing in console: window.setTheme('leviathan'|'default')
    (window as any).setTheme = setTheme;
  }, []);
  return <App />;
}

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  testnet: {
    url: getFullnodeUrl("testnet"),
    mvr: {
      overrides: {
        packages: {
          [DEEPBOOK_MARGIN_PACKAGE_NAME]: DEEPBOOK_MARGIN_PACKAGE_IDS.testnet,
        },
      },
    },
  },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider
          autoConnect
          storageKey="deepdashboard:lastConnectedAccount"
        >
          <Root />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  </StrictMode>
);
