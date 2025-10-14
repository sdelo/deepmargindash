import type { PoolAssetSymbol } from "../../features/lending/types";

export type SyntheticHistoryItem = {
  kind: "deposit" | "withdraw";
  asset: PoolAssetSymbol;
  amount: number;
  shares: number;
  timestamp: number;
};

const DEFAULT_ADDR = "0x0f97e5774fa2d0ad786ee0a562c4f65762e141397e469a736703351df85383cc";

const addressToHistory: Record<string, SyntheticHistoryItem[]> = {
  [DEFAULT_ADDR]: [
    { kind: "deposit", asset: "DBUSDC", amount: 2500, shares: 2500, timestamp: Date.now() / 1000 - 86400 * 5 },
    { kind: "deposit", asset: "SUI", amount: 1200, shares: 1200, timestamp: Date.now() / 1000 - 86400 * 3 },
    { kind: "withdraw", asset: "DBUSDC", amount: 300, shares: 300, timestamp: Date.now() / 1000 - 86400 * 2 },
  ],
};

export function getSyntheticHistory(address?: string | null): SyntheticHistoryItem[] {
  if (!address) return addressToHistory[DEFAULT_ADDR] ?? [];
  return addressToHistory[address] ?? addressToHistory[DEFAULT_ADDR] ?? [];
}

















