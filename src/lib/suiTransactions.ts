import { Transaction } from "@mysten/sui/transactions";
import type { PaginatedCoins, SuiClient } from "@mysten/sui/client";

import { supply, withdraw } from "../contracts/deepbook_margin/margin_pool";

type DepositOptions = {
  amount: bigint;
  owner: string;
  coinType: string;
  poolId: string;
  registryId: string;
  referralId?: string;
  poolType: string;
  suiClient: SuiClient;
};

type WithdrawOptions = {
  poolId: string;
  registryId: string;
  poolType: string;
};

export async function buildDepositTransaction({
  amount,
  owner,
  coinType,
  poolId,
  registryId,
  referralId,
  poolType,
  suiClient,
}: DepositOptions) {
  const tx = new Transaction();

  const coins: PaginatedCoins = await suiClient.getCoins({
    owner,
    coinType,
  });

  const coin = coins.data[0];
  if (!coin) {
    throw new Error("No available balance to deposit");
  }

  const [coinForDeposit] = tx.splitCoins(
    tx.objectRef({
      objectId: coin.coinObjectId,
      digest: coin.digest,
      version: coin.version,
    }),
    [amount]
  );

  supply({
    arguments: {
      self: poolId,
      registry: registryId,
      coin: coinForDeposit,
      referral: referralId ?? null,
    },
    typeArguments: [poolType],
  })(tx);

  return tx;
}

export function buildWithdrawAllTransaction({
  poolId,
  registryId,
  poolType,
}: WithdrawOptions) {
  const tx = new Transaction();

  withdraw({
    arguments: {
      self: poolId,
      registry: registryId,
      amount: null,
    },
    typeArguments: [poolType],
  })(tx);

  return tx;
}

