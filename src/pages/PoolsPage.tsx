import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { syntheticPools } from "../data/synthetic/pools";
import PoolCards from "../features/lending/components/PoolCards";
import DepositWithdrawPanel from "../features/lending/components/DepositWithdrawPanel";
import PersonalPositions from "../features/lending/components/PersonalPositions";
import HistoricalActivity from "../features/lending/components/HistoricalActivity";
import DepositorDistribution from "../features/lending/components/DepositorDistribution";
import ProtocolFees from "../features/lending/components/ProtocolFees";
import YieldCurve from "../features/lending/components/YieldCurve";
import SlidePanel from "../features/shared/components/SlidePanel";
import PoolAdmin from "../features/lending/components/PoolAdmin";
import DepositHistory from "../features/lending/components/DepositHistory";
import { getSyntheticUserPositions } from "../data/synthetic/users";
import { useCoinBalance } from "../hooks/useCoinBalance";
import {
  ONE_BILLION,
  GAS_AMOUNT_MIST,
  MIN_GAS_BALANCE_SUI,
} from "../constants";
import {
  buildDepositTransaction,
  buildWithdrawTransaction,
  buildWithdrawAllTransaction,
} from "../lib/suiTransactions";
import { DebugInfo } from "../components/DebugInfo";

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();
  const [selectedPoolId, setSelectedPoolId] = React.useState(
    syntheticPools[0]!.id
  );
  const selected =
    syntheticPools.find((p) => p.id === selectedPoolId) ?? syntheticPools[0]!;
  const [adminOpen, setAdminOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [txStatus, setTxStatus] = React.useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [txError, setTxError] = React.useState<string | null>(null);
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showObjectChanges: true,
        },
      }),
  });
  const coinBalance = useCoinBalance(
    account?.address,
    selected.contracts.coinType,
    selected.contracts.coinDecimals
  );

  // Get SUI balance for gas fees
  const suiBalance = useCoinBalance(account?.address, "0x2::sui::SUI", 9);

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account) return;

      // Check if user has enough SUI for gas
      const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus("error");
        setTxError(
          "Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs."
        );
        return;
      }

      // For SUI deposits, check if user has enough SUI for both deposit and gas
      if (selected.contracts.coinType === "0x2::sui::SUI") {
        try {
          const suiCoins = await suiClient.getCoins({
            owner: account.address,
            coinType: "0x2::sui::SUI",
          });

          // Calculate total SUI balance
          const totalSuiBalance = suiCoins.data.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );
          const gasAmount = BigInt(GAS_AMOUNT_MIST); // 0.2 SUI for gas
          const depositAmount = BigInt(Math.round(amount * ONE_BILLION));
          const totalNeeded = gasAmount + depositAmount;

          if (totalSuiBalance < totalNeeded) {
            setTxStatus("error");
            setTxError(
              `Insufficient SUI balance. Need ${
                Number(totalNeeded) / 1e9
              } SUI (${
                Number(depositAmount) / 1e9
              } for deposit + 0.2 for gas) but have ${
                Number(totalSuiBalance) / 1e9
              } SUI.`
            );
            return;
          }
        } catch (error) {
          console.error("Error checking SUI coins:", error);
        }
      }

      // Check if user has enough of the asset to deposit
      const assetBalanceNum =
        parseFloat(coinBalance?.raw || "0") /
        Math.pow(10, selected.contracts.coinDecimals);
      if (amount > assetBalanceNum) {
        setTxStatus("error");
        setTxError(
          `Insufficient ${selected.asset} balance. You have ${
            coinBalance?.formatted || "0"
          } but trying to deposit ${amount.toLocaleString()}.`
        );
        return;
      }

      try {
        setTxStatus("pending");
        setTxError(null);
        const poolContracts = selected.contracts;

        const finalAmount = BigInt(Math.round(amount * ONE_BILLION));

        const tx = await buildDepositTransaction({
          amount: finalAmount,
          owner: account.address,
          coinType: poolContracts.coinType,
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          referralId: poolContracts.referralId,
          poolType: poolContracts.marginPoolType,
          suiClient,
        });

        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });
        setTxStatus("success");
        console.log("Deposit successful:", result.digest);
      } catch (error) {
        setTxStatus("error");
        setTxError(
          error instanceof Error ? error.message : "Transaction failed"
        );
        console.error("Deposit failed:", error);
      }
    },
    [
      account,
      selected,
      signAndExecute,
      suiClient,
      network,
      suiBalance,
      coinBalance,
    ]
  );

  const handleWithdraw = React.useCallback(
    async (amount: number) => {
      if (!account) return;

      // Check if user has enough SUI for gas
      const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus("error");
        setTxError(
          "Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs."
        );
        return;
      }

      try {
        setTxStatus("pending");
        setTxError(null);
        const poolContracts = selected.contracts;
        const tx = await buildWithdrawTransaction({
          amount: BigInt(Math.round(amount * ONE_BILLION)),
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          poolType: poolContracts.marginPoolType,
          owner: account.address,
          suiClient,
        });
        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });
        setTxStatus("success");
        console.log("Withdraw successful:", result.digest);
      } catch (error) {
        setTxStatus("error");
        setTxError(
          error instanceof Error ? error.message : "Transaction failed"
        );
        console.error("Withdraw failed:", error);
      }
    },
    [account, selected, signAndExecute, network, suiBalance]
  );

  const handleWithdrawAll = React.useCallback(async () => {
    if (!account) return;

    // Check if user has enough SUI for gas
    const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
    if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
      setTxStatus("error");
      setTxError(
        "Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs."
      );
      return;
    }

    try {
      setTxStatus("pending");
      setTxError(null);
      const poolContracts = selected.contracts;
      const tx = await buildWithdrawAllTransaction({
        poolId: poolContracts.marginPoolId,
        registryId: poolContracts.registryId,
        poolType: poolContracts.marginPoolType,
        owner: account.address,
        suiClient,
      });
      const result = await signAndExecute({
        transaction: tx,
        chain: `sui:${network}`,
      });
      setTxStatus("success");
      console.log("Withdraw all successful:", result.digest);
    } catch (error) {
      setTxStatus("error");
      setTxError(error instanceof Error ? error.message : "Transaction failed");
      console.error("Withdraw all failed:", error);
    }
  }, [account, selected, signAndExecute, network, suiBalance]);

  return (
    <div className="max-w-[1400px] mx-auto px-4 text-white space-y-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-wide text-cyan-200 drop-shadow">
          Available Pools
        </h1>
      </div>

      {/* Three columns: pool selection, deposit/withdraw, my positions */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        <div className="space-y-6">
          <PoolCards
            pools={syntheticPools}
            selectedPoolId={selectedPoolId}
            onSelectPool={setSelectedPoolId}
            onDepositClick={(id) => setSelectedPoolId(id)}
            onAdminAuditClick={(id) => {
              setSelectedPoolId(id);
              setAdminOpen(true);
            }}
          />
        </div>
        <div>
          <DepositWithdrawPanel
            asset={selected.asset}
            minBorrow={Number(
              selected.protocolConfig.fields.margin_pool_config.fields
                .min_borrow
            )}
            supplyCap={Number(
              selected.protocolConfig.fields.margin_pool_config.fields
                .supply_cap
            )}
            balance={coinBalance?.formatted}
            suiBalance={suiBalance?.formatted}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onWithdrawAll={handleWithdrawAll}
            txStatus={txStatus}
            txError={txError}
          />
        </div>
        <div>
          {account ? (
            <PersonalPositions
              positions={getSyntheticUserPositions(account.address)}
              onShowHistory={() => setHistoryOpen(true)}
            />
          ) : (
            <div className="card-surface text-center py-10 border border-white/10 text-cyan-100/80">
              Connect wallet to view positions
            </div>
          )}
        </div>
      </div>

      {/* Charts: 1/3 vs 2/3 rows */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
          <YieldCurve pool={selected} />
        </div>
        <div className="md:col-span-2">
          <DepositorDistribution poolId={selected.id} />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-start">
        <div className="md:col-span-1">
          <HistoricalActivity poolId={selected.id} />
        </div>
        <div className="md:col-span-2">
          <ProtocolFees poolId={selected.id} />
        </div>
      </div>

      <SlidePanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title="Pool Admin Updates"
        width={"50vw"}
      >
        <PoolAdmin poolId={selected.id} />
      </SlidePanel>

      <SlidePanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Deposit / Withdraw History"
        width={"50vw"}
      >
        <DepositHistory address={account?.address} />
      </SlidePanel>

      {/* Debug Info - Remove this after fixing balance issues */}
      <DebugInfo />
    </div>
  );
}
