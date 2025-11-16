import { Transaction } from "@mysten/sui/transactions";
import type { PaginatedCoins, SuiClient } from "@mysten/sui/client";

import { supply, withdraw } from "../contracts/deepbook_margin/margin_pool";
import { ONE_BILLION, GAS_AMOUNT_MIST } from "../constants";


type DepositOptions = {
  amount: bigint;
  owner: string;
  coinType: string;
  poolId: string;
  registryId: string;
  referralId?: string;
  poolType: string;
  suiClient: SuiClient;
  decimals: number; // Asset decimals (9 for SUI, 6 for DBUSDC)
};

type WithdrawOptions = {
  poolId: string;
  registryId: string;
  poolType: string;
  owner: string;
  suiClient: SuiClient;
};

type WithdrawAmountOptions = {
  amount: bigint;
  poolId: string;
  registryId: string;
  poolType: string;
  owner: string;
  suiClient: SuiClient;
  decimals: number; // Asset decimals (9 for SUI, 6 for DBUSDC)
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
  decimals,
}: DepositOptions) {
  const tx = new Transaction();
  tx.setSender(owner);

  // Validate amount is positive
  if (amount <= 0n) {
    throw new Error("Deposit amount must be greater than 0");
  }

  // Get coins for the asset we're depositing
  const coins: PaginatedCoins = await suiClient.getCoins({
    owner,
    coinType,
    limit: 200,
  });

  if (!coins.data.length) {
    throw new Error(`No ${coinType} coins available to deposit`);
  }

  // Calculate total balance
  const totalBalance = coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);

  let coinForDeposit;

  // For SUI deposits, need to ensure we have enough for both deposit AND gas
  if (coinType === "0x2::sui::SUI") {
    const gasAmount = BigInt(GAS_AMOUNT_MIST); // 0.2 SUI for gas
    const totalNeeded = amount + gasAmount;
    
    if (totalBalance < totalNeeded) {
      const totalBalanceFormatted = Number(totalBalance) / ONE_BILLION;
      const totalNeededFormatted = Number(totalNeeded) / ONE_BILLION;
      const amountFormatted = Number(amount) / ONE_BILLION;
      throw new Error(
        `Insufficient SUI balance. Need ${totalNeededFormatted.toFixed(4)} SUI ` +
        `(${amountFormatted.toFixed(4)} for deposit + 0.2 for gas) but have ${totalBalanceFormatted.toFixed(4)} SUI.`
      );
    }
    
    // Find a coin large enough for the deposit amount, or use the first coin
    const depositCoin = coins.data.find(c => BigInt(c.balance) >= amount) ?? coins.data[0];
    
    const source = tx.object(depositCoin.coinObjectId);
    [coinForDeposit] = tx.splitCoins(source, [amount]);
  } else {
    // For non-SUI deposits, just check we have enough of the asset
    if (totalBalance < amount) {
      const totalBalanceFormatted = Number(totalBalance) / (10 ** decimals);
      const amountFormatted = Number(amount) / (10 ** decimals);
      throw new Error(
        `Insufficient balance. Need ${amountFormatted.toFixed(decimals)} but have ${totalBalanceFormatted.toFixed(decimals)}.`
      );
    }
    
    // Split from the first coin (or merge if needed)
    const source = tx.object(coins.data[0].coinObjectId);
    [coinForDeposit] = tx.splitCoins(source, [amount]);
  }

  const referralArg = referralId
    ? tx.pure.option("address", referralId)
    : tx.pure.option("address", null);

  supply({
    arguments: {
      self: poolId,
      registry: registryId,
      coin: coinForDeposit,
      referral: referralArg,
    },
    typeArguments: [poolType],
  })(tx);

  // Set gas budget to 0.5 SUI
  tx.setGasBudget(500_000_000n);

  // Explicitly set gas payment
  const suiCoins = await suiClient.getCoins({
    owner,
    coinType: "0x2::sui::SUI",
    limit: 200,
  });
  
  if (suiCoins.data.length === 0) {
    throw new Error("No SUI available for gas payment");
  }

  // For SUI deposits, try to use a different coin for gas
  if (coinType === "0x2::sui::SUI") {
    const depositCoin = coins.data.find(c => BigInt(c.balance) >= amount) ?? coins.data[0];
    const gasCoin = suiCoins.data.find(c => c.coinObjectId !== depositCoin.coinObjectId) ?? suiCoins.data[0];
    
    tx.setGasPayment([{
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    }]);
  } else {
    // For non-SUI deposits, use the first SUI coin for gas
    const gasCoin = suiCoins.data[0];
    tx.setGasPayment([{
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    }]);
  }

  return tx;
}

export async function buildWithdrawTransaction({
  amount,
  poolId,
  registryId,
  poolType,
  owner,
  suiClient,
  decimals,
}: WithdrawAmountOptions) {
  const tx = new Transaction();
  tx.setSender(owner);

  // Validate amount is positive
  if (amount <= 0n) {
    throw new Error("Withdraw amount must be greater than 0");
  }

  // Call withdraw function with specific amount
  const [withdrawnCoin] = withdraw({
    arguments: {
      self: poolId,
      registry: registryId,
      amount: tx.pure.option("u64", amount),
    },
    typeArguments: [poolType],
  })(tx);

  // Transfer the withdrawn coin to the owner
  tx.transferObjects([withdrawnCoin], owner);

  // Set gas budget to 0.5 SUI
  tx.setGasBudget(500_000_000n);

  // Explicitly set gas payment
  const suiCoins = await suiClient.getCoins({
    owner,
    coinType: "0x2::sui::SUI",
    limit: 200,
  });
  
  if (suiCoins.data.length === 0) {
    throw new Error("No SUI available for gas payment");
  }

  const gasCoin = suiCoins.data[0];
  tx.setGasPayment([{
    objectId: gasCoin.coinObjectId,
    version: gasCoin.version,
    digest: gasCoin.digest,
  }]);

  return tx;
}

export async function buildWithdrawAllTransaction({
  poolId,
  registryId,
  poolType,
  owner,
  suiClient,
}: WithdrawOptions) {
  const tx = new Transaction();
  tx.setSender(owner);

  // Call withdraw function with null amount (withdraw all)
  const [withdrawnCoin] = withdraw({
    arguments: {
      self: poolId,
      registry: registryId,
      amount: tx.pure.option("u64", null),
    },
    typeArguments: [poolType],
  })(tx);

  // Transfer the withdrawn coin to the owner
  tx.transferObjects([withdrawnCoin], owner);

  // Set gas budget to 0.5 SUI
  tx.setGasBudget(500_000_000n);

  // Explicitly set gas payment
  const suiCoins = await suiClient.getCoins({
    owner,
    coinType: "0x2::sui::SUI",
    limit: 200,
  });
  
  if (suiCoins.data.length === 0) {
    throw new Error("No SUI available for gas payment");
  }

  const gasCoin = suiCoins.data[0];
  tx.setGasPayment([{
    objectId: gasCoin.coinObjectId,
    version: gasCoin.version,
    digest: gasCoin.digest,
  }]);

  return tx;
}

