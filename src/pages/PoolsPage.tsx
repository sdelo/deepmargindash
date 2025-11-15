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
import { useCoinBalance } from "../hooks/useCoinBalance";
import { usePoolData } from "../hooks/usePoolData";
import { CONTRACTS } from "../config/contracts";
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
import { DashboardNav } from "../components/DashboardNav";
import type { PoolOverview } from "../features/lending/types";

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();

  // Fetch real pool data
  const suiPoolData = usePoolData(
    CONTRACTS.testnet.SUI_MARGIN_POOL_ID,
    account?.address
  );
  const dbusdcPoolData = usePoolData(
    CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID,
    account?.address
  );

  // Create pools array with real data, fallback to synthetic if loading/error
  const pools: PoolOverview[] = React.useMemo(() => {
    const realPools: PoolOverview[] = [];

    if (suiPoolData.data) {
      realPools.push(suiPoolData.data);
    } else if (!suiPoolData.isLoading && !suiPoolData.error) {
      // Fallback to synthetic data if no real data available
      realPools.push(syntheticPools.find((p) => p.asset === "SUI")!);
    }

    if (dbusdcPoolData.data) {
      realPools.push(dbusdcPoolData.data);
    } else if (!dbusdcPoolData.isLoading && !dbusdcPoolData.error) {
      // Fallback to synthetic data if no real data available
      realPools.push(syntheticPools.find((p) => p.asset === "DBUSDC")!);
    }

    return realPools.length > 0 ? realPools : syntheticPools;
  }, [
    suiPoolData.data,
    suiPoolData.isLoading,
    suiPoolData.error,
    dbusdcPoolData.data,
    dbusdcPoolData.isLoading,
    dbusdcPoolData.error,
  ]);

  const [selectedPoolId, setSelectedPoolId] = React.useState(
    syntheticPools[0]!.id
  );

  // Ensure we always have a valid selected pool
  const selected = React.useMemo(() => {
    return (
      pools.find((p) => p.id === selectedPoolId) ??
      pools[0] ??
      syntheticPools[0]!
    );
  }, [pools, selectedPoolId]);

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

  // Only fetch coin balance if we have a valid selected pool
  const coinBalance = useCoinBalance(
    account?.address,
    selected?.contracts?.coinType,
    selected?.contracts?.coinDecimals
  );

  // Get SUI balance for gas fees
  const suiBalance = useCoinBalance(account?.address, "0x2::sui::SUI", 9);

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account || !selected) return;

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
      if (!account || !selected) return;

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
    if (!account || !selected) return;

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

  // Show loading state if we're still fetching data
  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const hasError = suiPoolData.error || dbusdcPoolData.error;

  // Don't render until we have a valid selected pool with all required properties
  if (!selected || !selected.protocolConfig?.margin_pool_config) {
    return (
      <div className="max-w-[1400px] mx-auto pl-4 lg:pl-72 pr-4 text-white space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold tracking-wide text-cyan-200 drop-shadow">
            Available Pools
          </h1>
          <div className="text-sm text-cyan-100/80 mt-2">
            Loading pool data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pl-4 lg:pl-72 pr-4 text-white space-y-8">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold tracking-wide text-cyan-200 drop-shadow">
          Available Pools
        </h1>
        {isLoading && (
          <div className="text-sm text-cyan-100/80 mt-2">
            Loading live pool data from blockchain...
          </div>
        )}
        {hasError && (
          <div className="text-sm text-red-400 mt-2">
            Error loading pool data:{" "}
            {suiPoolData.error?.message || dbusdcPoolData.error?.message}
          </div>
        )}
      </div>

      <DashboardNav
        selectedPoolId={selectedPoolId}
        onSelectPool={setSelectedPoolId}
      />

      {/* Primary Action Zone */}
      <section id="pools-deposit" className="scroll-mt-24">
        <div className="grid md:grid-cols-3 gap-6 items-start mb-12">
          <div className="space-y-6 relative z-10">
            <h3 className="text-xl font-bold text-amber-300 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse"></span>
              Available Pools
            </h3>
            <PoolCards
              pools={pools}
              selectedPoolId={selectedPoolId}
              onSelectPool={setSelectedPoolId}
              onDepositClick={(id) => setSelectedPoolId(id)}
              onAdminAuditClick={(id) => {
                setSelectedPoolId(id);
                setAdminOpen(true);
              }}
            />
          </div>
          <div className="relative z-0">
            <h3 className="text-xl font-bold text-cyan-300 flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
              Deposit & Withdraw
            </h3>
            <DepositWithdrawPanel
              asset={selected.asset}
              minBorrow={Number(
                selected.protocolConfig?.margin_pool_config?.min_borrow || 0
              )}
              supplyCap={Number(
                selected.protocolConfig?.margin_pool_config?.supply_cap || 0
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
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-indigo-300 flex items-center gap-2 mb-4">
              <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse"></span>
              Your Positions
            </h3>
            {account ? (
              <PersonalPositions
                userAddress={account.address}
                pools={pools}
                onShowHistory={() => setHistoryOpen(true)}
              />
            ) : (
              <div className="card-surface text-center py-10 border border-white/10 text-cyan-100/80">
                Connect wallet to view positions
              </div>
            )}
          </div>
        </div>

        {/* Visual separator between action zone and analytics */}
        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-950 px-6 py-2 text-sm text-cyan-200/80 rounded-full border border-cyan-300/30">
              Pool Analytics & Insights
            </span>
          </div>
        </div>
      </section>

      {/* Analytics Sections */}
      <section id="yield-interest" className="scroll-mt-24 mb-12">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Yield & Interest Rates
          </h2>
          <p className="text-sm text-indigo-200/80">
            Understand how supply/borrow APR changes with pool utilization
          </p>
        </div>
        <YieldCurve pool={selected} />
      </section>

      <section id="depositors" className="scroll-mt-24 mb-12">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Depositor Distribution
          </h2>
          <p className="text-sm text-indigo-200/80">
            View concentration risk and top supplier positions in this pool
          </p>
        </div>
        <DepositorDistribution
          poolId={selected?.asset === "SUI" ? "0xpool_sui" : "0xpool_usdc"}
        />
      </section>

      <section id="activity" className="scroll-mt-24 mb-12">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Historical Pool Activity
          </h2>
          <p className="text-sm text-indigo-200/80">
            Track supply, borrow, and rate changes over time
          </p>
        </div>
        <HistoricalActivity
          poolId={selected?.asset === "SUI" ? "0xpool_sui" : "0xpool_usdc"}
        />
      </section>

      <section id="fees" className="scroll-mt-24 mb-12">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-2">
            Protocol Fees & Liquidations
          </h2>
          <p className="text-sm text-indigo-200/80">
            Monitor protocol earnings and liquidation events
          </p>
        </div>
        <ProtocolFees
          poolId={selected?.asset === "SUI" ? "0xpool_sui" : "0xpool_usdc"}
        />
      </section>

      <SlidePanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title="Pool Admin Updates"
        width={"50vw"}
      >
        <PoolAdmin
          poolId={selected?.asset === "SUI" ? "0xpool_sui" : "0xpool_usdc"}
        />
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
