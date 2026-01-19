import React from "react";
import { useSuiClientContext } from "@mysten/dapp-kit";

export function NetworkSwitcher() {
  const { network, selectNetwork } = useSuiClientContext();

  return (
    <select
      value={network}
      onChange={(e) => selectNetwork(e.target.value)}
      className="w-full bg-[#0d1a1f] text-white px-3 py-2 rounded-lg text-sm border border-white/[0.1] focus:border-[#2dd4bf]/40 focus:outline-none transition-colors cursor-pointer"
    >
      <option value="testnet">Testnet</option>
      <option value="mainnet">Mainnet</option>
    </select>
  );
}
