import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import PoolCarousel from "../features/lending/components/PoolCarousel";
import PositionsWithCalculator from "../features/lending/components/PositionsWithCalculator";
import YieldCurve from "../features/lending/components/YieldCurve";
import { OverviewTiles } from "../features/lending/components/OverviewTiles";
import SlidePanel from "../features/shared/components/SlidePanel";
import DepositHistory from "../features/lending/components/DepositHistory";
import { LiquidationDashboard } from "../features/lending/components/LiquidationDashboard";
import { APYHistory } from "../features/lending/components/APYHistory";
import { PoolActivity } from "../features/lending/components/PoolActivity";
import { LiquidationWall } from "../features/lending/components/LiquidationWall";
import { WhaleWatch } from "../features/lending/components/WhaleWatch";
import { PoolRiskOutlook } from "../features/lending/components/PoolRiskOutlook";
import { LiquidityTab } from "../features/lending/components/LiquidityTab";
import { BackedMarketsTab } from "../features/lending/components/BackedMarketsTab";
import { AdminHistorySlidePanel } from "../features/lending/components/AdminHistorySlidePanel";
import { InterestRateHistoryPanel } from "../features/lending/components/InterestRateHistoryPanel";
import { DeepbookPoolHistoryPanel } from "../features/lending/components/DeepbookPoolHistoryPanel";
import { QuickDepositBanner } from "../features/lending/components/QuickDepositBanner";
import {
  SectionNav,
  type DashboardSection,
} from "../features/shared/components/SectionNav";
import { LockIcon } from "../components/ThemedIcons";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { useAllPools } from "../hooks/useAllPools";
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
import type { PoolOverview, UserPosition } from "../features/lending/types";

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();
  const queryClient = useQueryClient();

  const [selectedSection, setSelectedSection] =
    React.useState<DashboardSection>("pools");

  const [overviewTab, setOverviewTab] = React.useState<
    | "overview"
    | "yield"
    | "history"
    | "activity"
    | "risk"
    | "liquidations"
    | "concentration"
    | "liquidity"
    | "markets"
  >("overview");
  
  const [pendingDepositAmount, setPendingDepositAmount] = React.useState<string>("");

  // Fetch all pools dynamically based on network configuration
  const { pools, userPositions, isLoading, error: poolsError, refetch: refetchPools } = useAllPools(account?.address);

  const userSupplierCapIds: string[] = React.useMemo(() => {
    const capIds = new Set(
      userPositions
        .map((pos) => pos.supplierCapId)
        .filter((id): id is string => !!id)
    );
    return Array.from(capIds);
  }, [userPositions]);

  const [selectedPoolId, setSelectedPoolId] = React.useState<string | null>(null);
  const [poolSwitchKey, setPoolSwitchKey] = React.useState(0);

  const selectedPool = React.useMemo(() => {
    if (pools.length === 0) return null;
    return pools.find((p) => p.id === selectedPoolId) ?? pools[0];
  }, [pools, selectedPoolId]);

  const selectedPoolDepositedBalance = React.useMemo(() => {
    if (!selectedPool || userPositions.length === 0) return 0;
    const position = userPositions.find((p) => p.asset === selectedPool.asset);
    if (!position) return 0;
    const match = position.balanceFormatted.match(/^([\d.,]+)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) || 0;
    }
    return 0;
  }, [selectedPool, userPositions]);

  React.useEffect(() => {
    if (!selectedPoolId && pools.length > 0) {
      setSelectedPoolId(pools[0].id);
    }
  }, [pools, selectedPoolId]);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [adminHistoryOpen, setAdminHistoryOpen] = React.useState(false);
  const [adminHistoryPoolId, setAdminHistoryPoolId] = React.useState<string | null>(null);
  const [deepbookPoolHistoryOpen, setDeepbookPoolHistoryOpen] = React.useState(false);
  const [deepbookPoolHistoryPoolId, setDeepbookPoolHistoryPoolId] = React.useState<string | null>(null);
  const [interestRateHistoryOpen, setInterestRateHistoryOpen] = React.useState(false);
  const [interestRateHistoryPoolId, setInterestRateHistoryPoolId] = React.useState<string | null>(null);
  const [txStatus, setTxStatus] = React.useState<"idle" | "pending" | "success" | "error">("idle");
  const [txError, setTxError] = React.useState<string | null>(null);
  
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: { showRawEffects: true, showObjectChanges: true },
      }),
  });

  const coinBalance = useCoinBalance(
    account?.address,
    selectedPool?.contracts?.coinType || "",
    selectedPool?.contracts?.coinDecimals || 9
  );

  const suiBalance = useCoinBalance(account?.address, "0x2::sui::SUI", 9);

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

      const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus("error");
        setTxError("Insufficient SUI for gas fees. You need at least 0.01 SUI.");
        return;
      }

      if (selectedPool.contracts.coinType === "0x2::sui::SUI") {
        try {
          const suiCoins = await suiClient.getCoins({
            owner: account.address,
            coinType: "0x2::sui::SUI",
          });
          const totalSuiBalance = suiCoins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
          const gasAmount = BigInt(GAS_AMOUNT_MIST);
          const depositAmount = BigInt(Math.round(amount * ONE_BILLION));
          const totalNeeded = gasAmount + depositAmount;
          if (totalSuiBalance < totalNeeded) {
            setTxStatus("error");
            setTxError(`Insufficient SUI. Need ${Number(totalNeeded) / 1e9} SUI but have ${Number(totalSuiBalance) / 1e9} SUI.`);
            return;
          }
        } catch (error) {
          console.error("Error checking SUI coins:", error);
        }
      }

      const assetBalanceNum = parseFloat(coinBalance?.raw || "0") / Math.pow(10, selectedPool.contracts.coinDecimals);
      if (amount > assetBalanceNum) {
        setTxStatus("error");
        setTxError(`Insufficient ${selectedPool.asset} balance.`);
        return;
      }

      try {
        setTxStatus("pending");
        setTxError(null);
        const poolContracts = selectedPool.contracts;
        const decimals = poolContracts.coinDecimals;
        const finalAmount = BigInt(Math.round(amount * 10 ** decimals));

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

        const result = await signAndExecute({ transaction: tx, chain: `sui:${network}` });
        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: { showEffects: true, showEvents: true },
        });

        if (txResponse.effects?.status?.status !== "success") {
          setTxStatus("error");
          setTxError(txResponse.effects?.status?.error || "Transaction failed");
          return;
        }

        setTxStatus("success");
        setPendingDepositAmount("");
        await Promise.all([refetchPools(), coinBalance.refetch(), suiBalance.refetch()]);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
          queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
        }, 3000);
      } catch (error) {
        setTxStatus("error");
        setTxError(error instanceof Error ? error.message : "Transaction failed");
      }
    },
    [account, selectedPool, signAndExecute, suiClient, network, suiBalance, coinBalance, queryClient]
  );

  const handleWithdraw = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

      const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus("error");
        setTxError("Insufficient SUI for gas fees.");
        return;
      }

      try {
        setTxStatus("pending");
        setTxError(null);
        const poolContracts = selectedPool.contracts;
        const decimals = poolContracts.coinDecimals;
        const finalAmount = BigInt(Math.round(amount * 10 ** decimals));

        const tx = await buildWithdrawTransaction({
          amount: finalAmount,
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          poolType: poolContracts.marginPoolType,
          owner: account.address,
          suiClient,
        });
        
        const result = await signAndExecute({ transaction: tx, chain: `sui:${network}` });
        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: { showEffects: true, showEvents: true },
        });

        if (txResponse.effects?.status?.status !== "success") {
          setTxStatus("error");
          setTxError(txResponse.effects?.status?.error || "Transaction failed");
          return;
        }

        setTxStatus("success");
        await Promise.all([refetchPools(), coinBalance.refetch(), suiBalance.refetch()]);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
          queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
        }, 3000);
      } catch (error) {
        setTxStatus("error");
        setTxError(error instanceof Error ? error.message : "Transaction failed");
      }
    },
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient, queryClient]
  );

  const handleWithdrawAll = React.useCallback(
    async () => {
      if (!account || !selectedPool) return;

      const suiBalanceNum = parseFloat(suiBalance?.raw || "0") / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus("error");
        setTxError("Insufficient SUI for gas fees.");
        return;
      }

      try {
        setTxStatus("pending");
        setTxError(null);
        const poolContracts = selectedPool.contracts;

        // Use buildWithdrawAllTransaction which passes null for amount,
        // telling the contract to withdraw everything available
        const tx = await buildWithdrawAllTransaction({
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          poolType: poolContracts.marginPoolType,
          owner: account.address,
          suiClient,
        });
        
        const result = await signAndExecute({ transaction: tx, chain: `sui:${network}` });
        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: { showEffects: true, showEvents: true },
        });

        if (txResponse.effects?.status?.status !== "success") {
          setTxStatus("error");
          setTxError(txResponse.effects?.status?.error || "Transaction failed");
          return;
        }

        setTxStatus("success");
        await Promise.all([refetchPools(), coinBalance.refetch(), suiBalance.refetch()]);
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
          queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
        }, 3000);
      } catch (error) {
        setTxStatus("error");
        setTxError(error instanceof Error ? error.message : "Transaction failed");
      }
    },
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient, queryClient, refetchPools, coinBalance]
  );

  const hasError = poolsError;

  return (
    <div className="max-w-[1920px] mx-auto text-white pb-12">
      {/* Section Navigation */}
      <div className="px-4 lg:px-8 xl:px-16 2xl:px-24">
        <SectionNav selectedSection={selectedSection} onSelectSection={setSelectedSection} />
      </div>

      {/* Status Messages */}
      {(isLoading || hasError) && (
        <div className="mb-4 px-4 lg:px-8 xl:px-16 2xl:px-24">
          {isLoading && (
            <div className="text-sm text-cyan-100/60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Loading pool data...
            </div>
          )}
          {hasError && (
            <div className="text-sm text-red-400">
              Error: {poolsError?.message}
            </div>
          )}
        </div>
      )}

      {/* Pools Section */}
      {selectedSection === "pools" && (
        <div className="space-y-4">
          {/* Sticky Deposit/Withdraw Header */}
          <QuickDepositBanner
            pools={pools}
            selectedPoolId={selectedPoolId}
            onSelectPool={(id) => {
              if (id !== selectedPoolId) {
                setPoolSwitchKey((prev) => prev + 1);
                setSelectedPoolId(id);
                setPendingDepositAmount("");
              }
            }}
            onDeposit={handleDeposit}
            onWithdraw={handleWithdraw}
            onWithdrawAll={handleWithdrawAll}
            walletBalance={coinBalance?.formatted}
            depositedBalance={selectedPoolDepositedBalance}
            suiBalance={suiBalance?.formatted}
            txStatus={txStatus}
            onAmountChange={setPendingDepositAmount}
            currentPositionBalance={selectedPoolDepositedBalance}
          />

          {/* Main Content */}
          <div className="px-4 lg:px-8 xl:px-16 2xl:px-24">
            {selectedPool ? (
              <div key={poolSwitchKey} className="space-y-4 animate-fade-in">
                {/* Pool Card */}
                <PoolCarousel
                  pools={pools}
                  selectedPoolId={selectedPoolId}
                  onSelectPool={(id) => {
                    if (id !== selectedPoolId) {
                      setPoolSwitchKey((prev) => prev + 1);
                      setSelectedPoolId(id);
                      setPendingDepositAmount("");
                    }
                  }}
                  isLoading={isLoading}
                />

                {/* Two Column Layout: Analytics | Positions+Calculator (SWAPPED) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Left: Analytics Tabs (now 2 columns) - Tier 1 styling */}
                  <div className="lg:col-span-2 surface-tier-1 rounded-xl overflow-hidden min-h-[680px] flex flex-col">
                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1.5 bg-slate-800/60 border-b border-slate-700/50 flex-shrink-0">
                      {[
                        { key: "overview", label: "Overview" },
                        { key: "yield", label: "Yield Curve" },
                        { key: "history", label: "APY History" },
                        { key: "activity", label: "Activity" },
                        { key: "liquidity", label: "Liquidity" },
                        { key: "markets", label: "Markets" },
                        { key: "risk", label: "Risk" },
                        { key: "liquidations", label: "Liquidations" },
                        { key: "concentration", label: "Whales" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setOverviewTab(tab.key as typeof overviewTab)}
                          className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            overviewTab === tab.key
                              ? "bg-teal-400 text-slate-900"
                              : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Content Panel - SCROLLABLE INSIDE with max height cap */}
                    <div className="flex-1 p-4 overflow-y-auto max-h-[680px]">
                      {overviewTab === "overview" && (
                        <OverviewTiles
                          pool={selectedPool}
                          onSelectTab={(tab) => setOverviewTab(tab)}
                        />
                      )}
                      {overviewTab === "yield" && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-semibold text-slate-200">Interest Rate Model</h3>
                            <span className="text-xs text-slate-500">Supply vs Borrow APY</span>
                          </div>
                          <YieldCurve
                            pool={selectedPool}
                            onShowHistory={() => {
                              setInterestRateHistoryPoolId(selectedPool.contracts?.marginPoolId || null);
                              setInterestRateHistoryOpen(true);
                            }}
                          />
                        </div>
                      )}
                      {overviewTab === "history" && <APYHistory pool={selectedPool} />}
                      {overviewTab === "activity" && <PoolActivity pool={selectedPool} />}
                      {overviewTab === "liquidations" && (
                        <LiquidationWall poolId={selectedPool.contracts?.marginPoolId} asset={selectedPool.asset} />
                      )}
                      {overviewTab === "risk" && (
                        <PoolRiskOutlook pool={selectedPool} onSelectTab={setOverviewTab} />
                      )}
                      {overviewTab === "concentration" && (
                        <WhaleWatch poolId={selectedPool.contracts?.marginPoolId} decimals={selectedPool.contracts?.coinDecimals} asset={selectedPool.asset} />
                      )}
                      {overviewTab === "liquidity" && (
                        <LiquidityTab pool={selectedPool} />
                      )}
                      {overviewTab === "markets" && (
                        <BackedMarketsTab
                          pool={selectedPool}
                          pools={pools}
                          onMarketClick={(id) => {
                            setDeepbookPoolHistoryPoolId(id);
                            setDeepbookPoolHistoryOpen(true);
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* Right: Positions with Calculator (now 1 column) - Tier 1 styling */}
                  <div className="lg:col-span-1 surface-tier-1 rounded-xl p-4 min-h-[680px] flex flex-col card-hover-lift">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Your Positions
                      </h3>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Position Summary</span>
                    </div>
                    <div className="flex-1 min-h-0">
                      {account ? (
                        <PositionsWithCalculator
                          userAddress={account.address}
                          pools={pools}
                          selectedPool={selectedPool}
                          positions={userPositions}
                          pendingDepositAmount={pendingDepositAmount}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                          <LockIcon size={28} className="mb-2 opacity-50" />
                          <div className="text-sm font-medium">Connect Wallet</div>
                          <div className="text-xs text-slate-500 mt-1">to view positions</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-700/50" />
                  </div>
                ) : (
                  <div className="bg-slate-800/40 rounded-2xl p-12 border border-slate-700/50">
                    <h3 className="text-lg font-semibold text-slate-300 mb-2">No Pools Available</h3>
                    <p className="text-sm text-slate-500">Check network connection or try again later.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Liquidations Section */}
      {selectedSection === "liquidations" && (
        <div className="space-y-8 px-4 lg:px-8 xl:px-16 2xl:px-24">
          <LiquidationDashboard />
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel open={historyOpen} onClose={() => setHistoryOpen(false)} title="Deposit / Withdraw History" width={"50vw"}>
        <DepositHistory address={account?.address} supplierCapIds={userSupplierCapIds} />
      </SlidePanel>

      <SlidePanel open={adminHistoryOpen} onClose={() => { setAdminHistoryOpen(false); setAdminHistoryPoolId(null); }} title="Admin Configuration History" width={"60vw"}>
        <AdminHistorySlidePanel poolId={adminHistoryPoolId || undefined} poolName={pools.find((p) => p.id === adminHistoryPoolId)?.asset} />
      </SlidePanel>

      <SlidePanel open={interestRateHistoryOpen} onClose={() => { setInterestRateHistoryOpen(false); setInterestRateHistoryPoolId(null); }} title="" width={"60vw"}>
        <InterestRateHistoryPanel
          poolId={interestRateHistoryPoolId || undefined}
          poolName={pools.find((p) => p.contracts?.marginPoolId === interestRateHistoryPoolId)?.asset}
          currentPool={pools.find((p) => p.contracts?.marginPoolId === interestRateHistoryPoolId)}
          onClose={() => { setInterestRateHistoryOpen(false); setInterestRateHistoryPoolId(null); }}
        />
      </SlidePanel>

      <SlidePanel open={deepbookPoolHistoryOpen} onClose={() => { setDeepbookPoolHistoryOpen(false); setDeepbookPoolHistoryPoolId(null); }} title="" width={"60vw"}>
        <DeepbookPoolHistoryPanel poolId={deepbookPoolHistoryPoolId || undefined} onClose={() => { setDeepbookPoolHistoryOpen(false); setDeepbookPoolHistoryPoolId(null); }} />
      </SlidePanel>
    </div>
  );
}
