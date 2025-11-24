import React from "react";
import { useAppNetwork } from "../context/AppNetworkContext";
import { TESTNET_INDEXERS } from "../config/networks";

export function IndexerSwitcher() {
  const { network, selectedIndexer, setSelectedIndexer } = useAppNetwork();

  // Only show when on testnet
  if (network !== "testnet") {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-cyan-200">Indexer:</span>
      <select
        value={selectedIndexer}
        onChange={(e) => setSelectedIndexer(e.target.value)}
        className="bg-gray-800 text-white px-2 py-1 rounded text-sm border border-gray-600"
      >
        {TESTNET_INDEXERS.map((indexer) => (
          <option key={indexer.url} value={indexer.url}>
            {indexer.label}
          </option>
        ))}
      </select>
    </div>
  );
}


