import type { PoolAssetSymbol } from "../../features/lending/types";
import type { UserPosition } from "../../features/lending/types";

type Address = string | undefined | null;

const DEFAULT_ADDRESS = "0x0f97e5774fa2d0ad786ee0a562c4f65762e141397e469a736703351df85383cc";

const addressToPositions: Record<string, UserPosition[]> = {
  [DEFAULT_ADDRESS]: [
    { address: DEFAULT_ADDRESS, asset: "USDC", shares: 5000n, balanceFormatted: "5,000 USDC" },
    { address: DEFAULT_ADDRESS, asset: "SUI", shares: 1200n, balanceFormatted: "1,200 SUI" },
  ],
};

export function getSyntheticUserPositions(address: Address): UserPosition[] {
  if (!address) return [];
  return addressToPositions[address] ?? addressToPositions[DEFAULT_ADDRESS] ?? [];
}

export function getSyntheticBalanceFormatted(
  address: Address,
  asset: PoolAssetSymbol
): string | undefined {
  const positions = getSyntheticUserPositions(address);
  const pos = positions.find((p) => p.asset === asset);
  return pos?.balanceFormatted;
}


