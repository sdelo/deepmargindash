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
  tx.setSender(owner);

  // Get coins for the asset we're depositing
  const coins: PaginatedCoins = await suiClient.getCoins({
    owner,
    coinType,
    limit: 200,
  });

  if (!coins.data.length) {
    throw new Error("No available balance to deposit");
  }

  let coinForDeposit;

  // For SUI deposits, pick a specific SUI coin (not the gas coin)
  if (coinType === "0x2::sui::SUI") {
    const suiCoins = await suiClient.getCoins({
      owner,
      coinType: "0x2::sui::SUI",
      limit: 200,
    });
    
    // Calculate total SUI balance
    const totalSuiBalance = suiCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    const gasAmount = BigInt(GAS_AMOUNT_MIST); // 0.2 SUI for gas
    const depositAmount = amount;
    const totalNeeded = depositAmount + gasAmount;
    
    if (totalSuiBalance < totalNeeded) {
      throw new Error(`Insufficient SUI balance. Need ${Number(totalNeeded) / ONE_BILLION} SUI but have ${Number(totalSuiBalance) / ONE_BILLION} SUI.`);
    }
    
    // Choose a coin big enough for the deposit, or use the first available
    const depositCoin = suiCoins.data.find(c => BigInt(c.balance) >= amount) ?? suiCoins.data[0];
    
    const source = tx.object(depositCoin.coinObjectId);
    [coinForDeposit] = tx.splitCoins(source, [amount]);
  } else {
    // For non-SUI deposits, split from the specific coin
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

  // Explicitly set gas payment for SUI deposits
  if (coinType === "0x2::sui::SUI") {
    const suiCoins = await suiClient.getCoins({
      owner,
      coinType: "0x2::sui::SUI",
      limit: 200,
    });
    
    // Find a different coin for gas payment (not the one used for deposit)
    const depositCoin = suiCoins.data.find(c => BigInt(c.balance) >= amount) ?? suiCoins.data[0];
    const gasCoin = suiCoins.data.find(c => c.coinObjectId !== depositCoin.coinObjectId) ?? suiCoins.data[0];
    
    // Set explicit gas payment
    tx.setGasPayment([{
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    }]);
  } else {
    // For non-SUI deposits, get SUI coins for gas
    const suiCoins = await suiClient.getCoins({
      owner,
      coinType: "0x2::sui::SUI",
      limit: 200,
    });
    
    if (suiCoins.data.length > 0) {
      const gasCoin = suiCoins.data[0];
      tx.setGasPayment([{
        objectId: gasCoin.coinObjectId,
        version: gasCoin.version,
        digest: gasCoin.digest,
      }]);
    }
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
}: WithdrawAmountOptions) {
  const tx = new Transaction();
  tx.setSender(owner);

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
  
  if (suiCoins.data.length > 0) {
    const gasCoin = suiCoins.data[0];
    tx.setGasPayment([{
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    }]);
  }

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
  
  if (suiCoins.data.length > 0) {
    const gasCoin = suiCoins.data[0];
    tx.setGasPayment([{
      objectId: gasCoin.coinObjectId,
      version: gasCoin.version,
      digest: gasCoin.digest,
    }]);
  }

  return tx;
}

