import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import PoolCarousel from "../features/lending/components/PoolCarousel";
import DepositWithdrawPanel, {
  type DepositWithdrawPanelHandle,
} from "../features/lending/components/DepositWithdrawPanel";
import PersonalPositions from "../features/lending/components/PersonalPositions";
import YieldCurve from "../features/lending/components/YieldCurve";
import SlidePanel from "../features/shared/components/SlidePanel";
import DepositHistory from "../features/lending/components/DepositHistory";
import { LiquidationDashboard } from "../features/lending/components/LiquidationDashboard";
import { APYHistory } from "../features/lending/components/APYHistory";
import { PoolActivity } from "../features/lending/components/PoolActivity";
import { LiquidationWall } from "../features/lending/components/LiquidationWall";
import { WhaleWatch } from "../features/lending/components/WhaleWatch";
import { EarningsCalculator } from "../features/lending/components/EarningsCalculator";
import { AdminHistorySlidePanel } from "../features/lending/components/AdminHistorySlidePanel";
import { InterestRateHistoryPanel } from "../features/lending/components/InterestRateHistoryPanel";
import { DeepbookPoolHistoryPanel } from "../features/lending/components/DeepbookPoolHistoryPanel";
import {
  SectionNav,
  type DashboardSection,
} from "../features/shared/components/SectionNav";
import { LockIcon } from "../components/ThemedIcons";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { usePoolData } from "../hooks/usePoolData";
import { getContracts, type NetworkType } from "../config/contracts";
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

  // Ref for deposit panel
  const depositPanelRef = React.useRef<DepositWithdrawPanelHandle>(null);

  // State for section navigation
  const [selectedSection, setSelectedSection] =
    React.useState<DashboardSection>("pools");

  const [isHelpVisible, setIsHelpVisible] = React.useState(false);

  const [overviewTab, setOverviewTab] = React.useState<
    | "yield"
    | "history"
    | "activity"
    | "liquidations"
    | "concentration"
    | "calculator"
  >("yield");

  // Get contracts for the current network
  const contracts = getContracts(network as NetworkType);

  // Fetch real pool data
  const suiPoolData = usePoolData(
    contracts.SUI_MARGIN_POOL_ID,
    account?.address
  );
  const dbusdcPoolData = usePoolData(
    contracts.DBUSDC_MARGIN_POOL_ID,
    account?.address
  );

  // Create pools array with real data
  const pools: PoolOverview[] = React.useMemo(() => {
    const realPools: PoolOverview[] = [];

    if (suiPoolData.data) {
      realPools.push(suiPoolData.data);
    }

    if (dbusdcPoolData.data) {
      realPools.push(dbusdcPoolData.data);
    }

    return realPools;
  }, [suiPoolData.data, dbusdcPoolData.data]);

  // Aggregate user positions from both pools to pass to PersonalPositions
  const userPositions: UserPosition[] = React.useMemo(() => {
    const positions: UserPosition[] = [];
    if (suiPoolData.userPosition) positions.push(suiPoolData.userPosition);
    if (dbusdcPoolData.userPosition)
      positions.push(dbusdcPoolData.userPosition);
    return positions;
  }, [suiPoolData.userPosition, dbusdcPoolData.userPosition]);

  // Extract unique SupplierCap IDs for history filtering
  const userSupplierCapIds: string[] = React.useMemo(() => {
    const capIds = new Set(
      userPositions
        .map((pos) => pos.supplierCapId)
        .filter((id): id is string => !!id)
    );
    return Array.from(capIds);
  }, [userPositions]);

  const [selectedPoolId, setSelectedPoolId] = React.useState<string | null>(
    null
  );

  // Ensure we always have a valid selected pool if pools exist
  const selectedPool = React.useMemo(() => {
    if (pools.length === 0) return null;
    return pools.find((p) => p.id === selectedPoolId) ?? pools[0];
  }, [pools, selectedPoolId]);

  // Get the user's current withdrawable balance for the selected pool (includes interest)
  // This value comes from the on-chain user_supply_amount view function when available
  const selectedPoolDepositedBalance = React.useMemo(() => {
    if (!selectedPool || userPositions.length === 0) return 0;
    const position = userPositions.find((p) => p.asset === selectedPool.asset);
    if (!position) return 0;
    // Parse the balance from balanceFormatted (e.g., "2 SUI" -> 2)
    // This already includes interest since it's computed from shares * (total_supply/supply_shares)
    const match = position.balanceFormatted.match(/^([\d.,]+)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) || 0;
    }
    return 0;
  }, [selectedPool, userPositions]);

  // Set default selected pool when pools are loaded
  React.useEffect(() => {
    if (!selectedPoolId && pools.length > 0) {
      setSelectedPoolId(pools[0].id);
    }
  }, [pools, selectedPoolId]);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [adminHistoryOpen, setAdminHistoryOpen] = React.useState(false);
  const [adminHistoryPoolId, setAdminHistoryPoolId] = React.useState<
    string | null
  >(null);
  const [deepbookPoolHistoryOpen, setDeepbookPoolHistoryOpen] =
    React.useState(false);
  const [deepbookPoolHistoryPoolId, setDeepbookPoolHistoryPoolId] =
    React.useState<string | null>(null);
  const [interestRateHistoryOpen, setInterestRateHistoryOpen] =
    React.useState(false);
  const [interestRateHistoryPoolId, setInterestRateHistoryPoolId] =
    React.useState<string | null>(null);
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
    selectedPool?.contracts?.coinType || "",
    selectedPool?.contracts?.coinDecimals || 9
  );

  // Get SUI balance for gas fees
  const suiBalance = useCoinBalance(account?.address, "0x2::sui::SUI", 9);

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

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
      if (selectedPool.contracts.coinType === "0x2::sui::SUI") {
        try {
          const suiCoins = await suiClient.getCoins({
            owner: account.address,
            coinType: "0x2::sui::SUI",
          });

          const totalSuiBalance = suiCoins.data.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );
          const gasAmount = BigInt(GAS_AMOUNT_MIST);
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
        Math.pow(10, selectedPool.contracts.coinDecimals);
      if (amount > assetBalanceNum) {
        setTxStatus("error");
        setTxError(
          `Insufficient ${selectedPool.asset} balance. You have ${
            coinBalance?.formatted || "0"
          } but trying to deposit ${amount.toLocaleString()}.`
        );
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

        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });

        // Wait for the transaction to be processed and check its status
        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: {
            showEffects: true,
            showEvents: true,
          },
        });

        // Check if transaction succeeded
        if (txResponse.effects?.status?.status !== "success") {
          const errorMsg =
            txResponse.effects?.status?.error || "Transaction failed on-chain";
          setTxStatus("error");
          setTxError(errorMsg);
          console.error("Deposit failed on-chain:", errorMsg);
          console.error("Full effects:", txResponse.effects);
          return;
        }

        setTxStatus("success");
        console.log("Deposit successful:", result.digest);

        // Refresh all data
        await Promise.all([
          suiPoolData.refetch(),
          dbusdcPoolData.refetch(),
          coinBalance.refetch(),
          suiBalance.refetch(),
        ]);
        
        // Invalidate React Query caches for history and positions
        // Wait a bit for the indexer to process the transaction before refetching
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
          queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
        }, 3000); // 3 second delay for indexer
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
      selectedPool,
      signAndExecute,
      suiClient,
      network,
      suiBalance,
      coinBalance,
      queryClient,
    ]
  );

  const handleWithdraw = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

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
        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });

        // Wait for the transaction to be processed and check its status
        const txResponse = await suiClient.waitForTransaction({
          digest: result.digest,
          options: {
            showEffects: true,
            showEvents: true,
          },
        });

        // Check if transaction succeeded
        if (txResponse.effects?.status?.status !== "success") {
          const errorMsg =
            txResponse.effects?.status?.error || "Transaction failed on-chain";
          setTxStatus("error");
          setTxError(errorMsg);
          console.error("Withdraw failed on-chain:", errorMsg);
          console.error("Full effects:", txResponse.effects);
          return;
        }

        setTxStatus("success");
        console.log("Withdraw successful:", result.digest);

        // Refresh all data
        await Promise.all([
          suiPoolData.refetch(),
          dbusdcPoolData.refetch(),
          coinBalance.refetch(),
          suiBalance.refetch(),
        ]);
        
        // Invalidate React Query caches for history and positions
        // Wait a bit for the indexer to process the transaction before refetching
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
          queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
        }, 3000); // 3 second delay for indexer
      } catch (error) {
        setTxStatus("error");
        setTxError(
          error instanceof Error ? error.message : "Transaction failed"
        );
        console.error("Withdraw failed:", error);
      }
    },
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient, queryClient]
  );

  const handleWithdrawAll = React.useCallback(async () => {
    if (!account || !selectedPool) return;

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
      const poolContracts = selectedPool.contracts;
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

      // Wait for the transaction to be processed and check its status
      const txResponse = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      // Check if transaction succeeded
      if (txResponse.effects?.status?.status !== "success") {
        const errorMsg =
          txResponse.effects?.status?.error || "Transaction failed on-chain";
        setTxStatus("error");
        setTxError(errorMsg);
        console.error("Withdraw all failed on-chain:", errorMsg);
        console.error("Full effects:", txResponse.effects);
        return;
      }

      setTxStatus("success");
      console.log("Withdraw all successful:", result.digest);

      // Refresh all data
      await Promise.all([
        suiPoolData.refetch(),
        dbusdcPoolData.refetch(),
        coinBalance.refetch(),
        suiBalance.refetch(),
      ]);
      
      // Invalidate React Query caches for history and positions
      // Wait a bit for the indexer to process the transaction before refetching
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['assetSupplied'] });
        queryClient.invalidateQueries({ queryKey: ['assetWithdrawn'] });
      }, 3000); // 3 second delay for indexer
    } catch (error) {
      setTxStatus("error");
      setTxError(error instanceof Error ? error.message : "Transaction failed");
      console.error("Withdraw all failed:", error);
    }
  }, [account, selectedPool, signAndExecute, network, suiBalance, suiClient, queryClient]);

  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const hasError = suiPoolData.error || dbusdcPoolData.error;

  return (
    <div className="max-w-[1920px] mx-auto px-4 lg:px-8 xl:px-16 2xl:px-24 text-white pb-12">
      {/* Section Navigation */}
      <SectionNav
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />

      {/* Status Messages */}
      {(isLoading || hasError) && (
        <div className="mb-6">
          {isLoading && (
            <div className="text-sm text-cyan-100/60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Loading pool data...
            </div>
          )}
          {hasError && (
            <div className="text-sm text-red-400">
              Error: {suiPoolData.error?.message || dbusdcPoolData.error?.message}
            </div>
          )}
        </div>
      )}

      {/* Pools Section */}
      {selectedSection === "pools" && (
        <div className="space-y-8">
          {/* Collapsible Help Banner */}
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
            <button
              onClick={() => setIsHelpVisible(!isHelpVisible)}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors"
            >
              <span className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span className="text-base">💡</span> How DeepBook Margin Works
              </span>
              <svg
                className={`w-4 h-4 text-slate-400 transition-transform ${isHelpVisible ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isHelpVisible && (
              <div className="px-4 pb-4 border-t border-slate-700/50">
                <div className="grid md:grid-cols-3 gap-4 pt-4 text-sm text-slate-400">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold shrink-0">1</div>
                    <div>
                      <p className="font-medium text-slate-200">Supply Assets</p>
                      <p className="text-xs mt-0.5">Deposit to provide liquidity for traders</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">2</div>
                    <div>
                      <p className="font-medium text-slate-200">Earn Yield</p>
                      <p className="text-xs mt-0.5">Interest from borrowers, APY varies with utilization</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold shrink-0">3</div>
                    <div>
                      <p className="font-medium text-slate-200">Manage Risk</p>
                      <p className="text-xs mt-0.5">Higher utilization = higher APY but less liquidity</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {selectedPool ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
              {/* Left Column: Pool Selection + Core Actions */}
              <div className="xl:col-span-8 space-y-4">
                {/* Pool Selection Carousel */}
                <PoolCarousel
                    pools={pools}
                    selectedPoolId={selectedPoolId}
                    onSelectPool={setSelectedPoolId}
                    onDepositClick={(id) => {
                      setSelectedPoolId(id);
                      setTimeout(() => {
                        depositPanelRef.current?.focusDepositInput();
                      }, 100);
                    }}
                    onAdminAuditClick={(id) => {
                      setAdminHistoryPoolId(id);
                      setAdminHistoryOpen(true);
                    }}
                    onDeepbookPoolHistoryClick={(id) => {
                      setDeepbookPoolHistoryPoolId(id);
                      setDeepbookPoolHistoryOpen(true);
                    }}
                  isLoading={isLoading}
                />

                {/* Action Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {/* Deposit/Withdraw Panel */}
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <DepositWithdrawPanel
                        ref={depositPanelRef}
                        asset={selectedPool.asset}
                        apy={selectedPool.ui.aprSupplyPct}
                        minBorrow={Number(
                          selectedPool.protocolConfig?.margin_pool_config
                            ?.min_borrow || 0
                        )}
                        supplyCap={Number(
                          selectedPool.protocolConfig?.margin_pool_config
                            ?.supply_cap || 0
                        )}
                        balance={coinBalance?.formatted}
                        suiBalance={suiBalance?.formatted}
                        depositedBalance={selectedPoolDepositedBalance}
                        onDeposit={handleDeposit}
                        onWithdraw={handleWithdraw}
                        onWithdrawAll={handleWithdrawAll}
                        txStatus={txStatus}
                        txError={txError}
                      />
                  </div>

                  {/* Your Positions Panel */}
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                    <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Your Positions
                    </h3>
                    {account ? (
                      <PersonalPositions
                        userAddress={account.address}
                        pools={pools}
                        positions={userPositions}
                        onShowHistory={() => setHistoryOpen(true)}
                      />
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <LockIcon size={28} className="mx-auto mb-2 opacity-50" />
                        <div className="text-sm font-medium">Connect Wallet</div>
                        <div className="text-xs text-slate-500 mt-1">to view positions</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Analytics */}
              <div className="xl:col-span-4 space-y-4">
                {/* Tab Navigation - Aligned with pool toggle height */}
                <div className="flex gap-1 p-1.5 bg-slate-800/60 rounded-lg border border-slate-700/50">
                  {[
                    { key: "yield", label: "Yield Curve" },
                    { key: "history", label: "APY History" },
                    { key: "activity", label: "Activity" },
                    { key: "liquidations", label: "Risk" },
                    { key: "concentration", label: "Whales" },
                    { key: "calculator", label: "Calculator" },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setOverviewTab(tab.key as typeof overviewTab)}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all ${
                        overviewTab === tab.key
                          ? "bg-amber-400 text-slate-900"
                          : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content Panel */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 min-h-[460px]">
                  {overviewTab === "yield" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-200">Interest Rate Model</h3>
                        <span className="text-xs text-slate-500">Supply vs Borrow APR</span>
                      </div>
                      <YieldCurve
                        pool={selectedPool}
                        onShowHistory={() => {
                          setInterestRateHistoryPoolId(
                            selectedPool.contracts?.marginPoolId || null
                          );
                          setInterestRateHistoryOpen(true);
                        }}
                      />
                    </div>
                  )}

                  {overviewTab === "history" && (
                    <APYHistory pool={selectedPool} />
                  )}

                  {overviewTab === "activity" && (
                    <PoolActivity pool={selectedPool} />
                  )}

                  {overviewTab === "liquidations" && (
                    <LiquidationWall
                      poolId={selectedPool.contracts?.marginPoolId}
                    />
                  )}

                  {overviewTab === "concentration" && (
                    <WhaleWatch
                      poolId={selectedPool.contracts?.marginPoolId}
                      decimals={selectedPool.contracts?.coinDecimals}
                    />
                  )}

                  {overviewTab === "calculator" && (
                    <EarningsCalculator pool={selectedPool} />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center">
              {isLoading ? (
                <div className="space-y-4">
                  <div className="h-64 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-700/50" />
                  <div className="h-48 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-700/50" />
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
      )}

      {/* Liquidations Section */}
      {selectedSection === "liquidations" && (
        <div className="space-y-8">
          <LiquidationDashboard />
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Deposit / Withdraw History"
        width={"50vw"}
      >
        <DepositHistory 
          address={account?.address} 
          supplierCapIds={userSupplierCapIds}
        />
      </SlidePanel>

      <SlidePanel
        open={adminHistoryOpen}
        onClose={() => {
          setAdminHistoryOpen(false);
          setAdminHistoryPoolId(null);
        }}
        title="Admin Configuration History"
        width={"60vw"}
      >
        <AdminHistorySlidePanel
          poolId={adminHistoryPoolId || undefined}
          poolName={pools.find((p) => p.id === adminHistoryPoolId)?.asset}
        />
      </SlidePanel>

      <SlidePanel
        open={interestRateHistoryOpen}
        onClose={() => {
          setInterestRateHistoryOpen(false);
          setInterestRateHistoryPoolId(null);
        }}
        title=""
        width={"60vw"}
      >
        <InterestRateHistoryPanel
          poolId={interestRateHistoryPoolId || undefined}
          poolName={
            pools.find(
              (p) => p.contracts?.marginPoolId === interestRateHistoryPoolId
            )?.asset
          }
          currentPool={pools.find(
            (p) => p.contracts?.marginPoolId === interestRateHistoryPoolId
          )}
          onClose={() => {
            setInterestRateHistoryOpen(false);
            setInterestRateHistoryPoolId(null);
          }}
        />
      </SlidePanel>

      <SlidePanel
        open={deepbookPoolHistoryOpen}
        onClose={() => {
          setDeepbookPoolHistoryOpen(false);
          setDeepbookPoolHistoryPoolId(null);
        }}
        title=""
        width={"60vw"}
      >
        <DeepbookPoolHistoryPanel
          poolId={deepbookPoolHistoryPoolId || undefined}
          onClose={() => {
            setDeepbookPoolHistoryOpen(false);
            setDeepbookPoolHistoryPoolId(null);
          }}
        />
      </SlidePanel>
    </div>
  );
}
