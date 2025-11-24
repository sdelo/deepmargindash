import React from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";

export function NetworkSwitcher() {
  const { network, selectNetwork } = useSuiClientContext();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-cyan-200">Network:</span>
      <select
        value={network}
        onChange={(e) => selectNetwork(e.target.value)}
        className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600"
      >
        <option value="testnet">Testnet</option>
        <option value="mainnet">Mainnet</option>
      </select>
    </div>
  );
}
