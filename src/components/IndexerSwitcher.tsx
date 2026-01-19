import React from "react";
import { useAppNetwork } from "../context/AppNetworkContext";
import { TESTNET_INDEXERS } from "../config/networks";

export function IndexerSwitcher() {
  const { network, selectedIndexer, setSelectedIndexer } = useAppNetwork();

  // Only show when on testnet
  if (network !== "testnet") {
    return (
      <div className="text-xs text-white/40 py-2">
        Indexer selection available on testnet only
      </div>
    );
  }

  return (
    <select
      value={selectedIndexer}
      onChange={(e) => setSelectedIndexer(e.target.value)}
      className="w-full bg-[#0d1a1f] text-white px-3 py-2 rounded-lg text-sm border border-white/[0.1] focus:border-[#2dd4bf]/40 focus:outline-none transition-colors cursor-pointer"
    >
      {TESTNET_INDEXERS.map((indexer) => (
        <option key={indexer.url} value={indexer.url}>
          {indexer.label}
        </option>
      ))}
    </select>
  );
}











