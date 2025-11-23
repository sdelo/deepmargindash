import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import PoolCarousel from "../features/lending/components/PoolCarousel";
import DepositWithdrawPanel, {
  type DepositWithdrawPanelHandle,
} from "../features/lending/components/DepositWithdrawPanel";
import PersonalPositions from "../features/lending/components/PersonalPositions";
import YieldCurve from "../features/lending/components/YieldCurve";
import SlidePanel from "../features/shared/components/SlidePanel";
import DepositHistory from "../features/lending/components/DepositHistory";
import { EnhancedPoolAnalytics } from "../features/lending/components/EnhancedPoolAnalytics";
import { SupplierAnalytics } from "../features/lending/components/SupplierAnalytics";
import { BorrowerOverview } from "../features/lending/components/BorrowerOverview";
import { LiquidationDashboard } from "../features/lending/components/LiquidationDashboard";
import { AdministrativePanel } from "../features/lending/components/AdministrativePanel";
import { LiquidityHealthCheck } from "../features/lending/components/LiquidityHealthCheck";
import { LiquidationWall } from "../features/lending/components/LiquidationWall";
import { WhaleWatch } from "../features/lending/components/WhaleWatch";
import { AdminHistorySlidePanel } from "../features/lending/components/AdminHistorySlidePanel";
import { InterestRateHistoryPanel } from "../features/lending/components/InterestRateHistoryPanel";
import {
  SectionNav,
  type DashboardSection,
} from "../features/shared/components/SectionNav";
import { YieldIcon, LiquidityIcon, WhaleIcon } from "../components/ThemedIcons";
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
import type { PoolOverview } from "../features/lending/types";

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();

  // Ref for deposit panel
  const depositPanelRef = React.useRef<DepositWithdrawPanelHandle>(null);

  // State for section navigation
  const [selectedSection, setSelectedSection] =
    React.useState<DashboardSection>("overview");

  const [isHelpVisible, setIsHelpVisible] = React.useState(false);

  const [overviewTab, setOverviewTab] = React.useState<
    "yield" | "liquidity" | "liquidations" | "whales"
  >("yield");

  // Fetch real pool data
  const suiPoolData = usePoolData(
    CONTRACTS.testnet.SUI_MARGIN_POOL_ID,
    account?.address
  );
  const dbusdcPoolData = usePoolData(
    CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID,
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

  const [selectedPoolId, setSelectedPoolId] = React.useState<string | null>(
    null
  );

  // Ensure we always have a valid selected pool if pools exist
  const selectedPool = React.useMemo(() => {
    if (pools.length === 0) return null;
    return pools.find((p) => p.id === selectedPoolId) ?? pools[0];
  }, [pools, selectedPoolId]);

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
        setTxStatus("success");
        console.log("Deposit successful:", result.digest);

        // Refresh data
        await Promise.all([
          suiPoolData.refetch(),
          dbusdcPoolData.refetch(),
          coinBalance.refetch(),
          suiBalance.refetch(),
        ]);
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
        setTxStatus("success");
        console.log("Withdraw successful:", result.digest);

        // Refresh data
        await Promise.all([
          suiPoolData.refetch(),
          dbusdcPoolData.refetch(),
          coinBalance.refetch(),
          suiBalance.refetch(),
        ]);
      } catch (error) {
        setTxStatus("error");
        setTxError(
          error instanceof Error ? error.message : "Transaction failed"
        );
        console.error("Withdraw failed:", error);
      }
    },
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient]
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
      setTxStatus("success");
      console.log("Withdraw all successful:", result.digest);

      // Refresh data
      await Promise.all([
        suiPoolData.refetch(),
        dbusdcPoolData.refetch(),
        coinBalance.refetch(),
        suiBalance.refetch(),
      ]);
    } catch (error) {
      setTxStatus("error");
      setTxError(error instanceof Error ? error.message : "Transaction failed");
      console.error("Withdraw all failed:", error);
    }
  }, [account, selectedPool, signAndExecute, network, suiBalance, suiClient]);

  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const hasError = suiPoolData.error || dbusdcPoolData.error;

  return (
    <div className="max-w-[1920px] mx-auto px-4 lg:px-12 xl:px-20 2xl:px-32 text-white space-y-8 pb-12">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-purple-400 drop-shadow-lg">
          DeepBook Margin Dashboard
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

      {/* Section Navigation */}
      <SectionNav
        selectedSection={selectedSection}
        onSelectSection={setSelectedSection}
      />

      {/* Overview Section */}
      {selectedSection === "overview" && (
        <div className="space-y-6">
          {/* System Context */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-cyan-200 flex items-center gap-2">
              <span className="text-xl">💡</span> How DeepBook Margin Works
            </h3>
            <button
              onClick={() => setIsHelpVisible(!isHelpVisible)}
              className="text-sm text-cyan-300 hover:text-cyan-100 transition-colors flex items-center gap-1"
            >
              {isHelpVisible ? "Hide Guide" : "Show Guide"}
              <svg
                className={`w-4 h-4 transition-transform ${
                  isHelpVisible ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {isHelpVisible && (
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden transition-all duration-300 ease-in-out">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
              <div className="grid md:grid-cols-3 gap-6 text-sm text-indigo-100/80 relative z-10">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-300 font-bold shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">
                      Supply Assets
                    </p>
                    <p>
                      Deposit assets into the pool to provide liquidity for
                      DeepBook traders.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Earn Yield</p>
                    <p>
                      Earn interest paid by borrowers. APY changes based on pool
                      utilization.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-300 font-bold shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-white mb-1">Manage Risk</p>
                    <p>
                      Monitor utilization rates. High utilization means higher
                      APY but lower withdrawal liquidity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedPool ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left Column: Pool Selection + Core Actions */}
              <div className="xl:col-span-7 space-y-6">
                {/* Pool Selection Carousel with margins and centering */}
                <div className="max-w-3xl mx-auto">
                  <h2 className="text-xl font-bold text-cyan-200 mb-4">
                    Pool Selection
                  </h2>
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
                    isLoading={isLoading}
                  />
                </div>

                {/* Core Actions */}
                <div>
                  <h2 className="text-xl font-bold text-cyan-200 mb-4">
                    Core Actions
                  </h2>
                  {/* Two panels side by side on larger screens */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Deposit/Withdraw Panel */}
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
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
                        onDeposit={handleDeposit}
                        onWithdraw={handleWithdraw}
                        onWithdrawAll={handleWithdrawAll}
                        txStatus={txStatus}
                        txError={txError}
                      />
                    </div>

                    {/* Your Positions Panel */}
                    <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
                      <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                        Your Positions
                      </h3>
                      {account ? (
                        <PersonalPositions
                          userAddress={account.address}
                          pools={pools}
                          onShowHistory={() => setHistoryOpen(true)}
                        />
                      ) : (
                        <div className="card-surface text-center py-6 border border-white/10 text-cyan-100/80 rounded-2xl bg-white/5">
                          <div className="mb-2 text-2xl">🔐</div>
                          <div className="text-sm font-semibold mb-1">
                            Connect Your Wallet
                          </div>
                          <div className="text-xs text-indigo-200/60">
                            View and manage your positions
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Data Panels (Tabbed View) */}
              <div className="xl:col-span-5 space-y-6">
                <div className="flex items-center justify-between bg-white/5 p-2 rounded-xl border border-white/10 overflow-x-auto">
                  <div className="flex gap-2 w-full">
                    <button
                      onClick={() => setOverviewTab("yield")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        overviewTab === "yield"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <YieldIcon
                          size={35}
                          className={
                            overviewTab === "yield"
                              ? "opacity-100"
                              : "opacity-60"
                          }
                        />
                        <div className="flex flex-col items-start">
                          <span>Yield</span>
                          <span className="text-[10px] text-white/50">
                            Interest Rate
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setOverviewTab("liquidity")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        overviewTab === "liquidity"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <LiquidityIcon
                          size={35}
                          className={
                            overviewTab === "liquidity"
                              ? "opacity-100"
                              : "opacity-60"
                          }
                        />
                        <div className="flex flex-col items-start">
                          <span>Liquidity</span>
                          <span className="text-[10px] text-white/50">
                            Health Check
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setOverviewTab("liquidations")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        overviewTab === "liquidations"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          className={
                            overviewTab === "liquidations"
                              ? "opacity-100"
                              : "opacity-60"
                          }
                        >
                          <path
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            fill="#38bdf8"
                          />
                        </svg>
                        <div className="flex flex-col items-start">
                          <span>Liquidations</span>
                          <span className="text-[10px] text-white/50">
                            Activity
                          </span>
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => setOverviewTab("whales")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                        overviewTab === "whales"
                          ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <WhaleIcon
                          size={35}
                          className={
                            overviewTab === "whales"
                              ? "opacity-100"
                              : "opacity-60"
                          }
                        />
                        <div className="flex flex-col items-start">
                          <span>Whales</span>
                          <span className="text-[10px] text-white/50">
                            Top Positions
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {overviewTab === "yield" && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-bold text-cyan-200">
                          Interest Rate Model
                        </h3>
                        <span className="text-xs text-indigo-300/60">
                          Yield vs Utilization
                        </span>
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

                  {overviewTab === "liquidity" && (
                    <LiquidityHealthCheck pool={selectedPool} />
                  )}

                  {overviewTab === "liquidations" && (
                    <LiquidationWall
                      poolId={selectedPool.contracts?.marginPoolId}
                    />
                  )}

                  {overviewTab === "whales" && (
                    <WhaleWatch
                      poolId={selectedPool.contracts?.marginPoolId}
                      decimals={selectedPool.contracts?.coinDecimals}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-12 space-y-6">
              {isLoading ? (
                <>
                  <div className="h-96 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
                  <div className="h-64 bg-white/5 rounded-3xl animate-pulse border border-white/10" />
                </>
              ) : (
                <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/10">
                  <h3 className="text-xl font-bold text-cyan-200 mb-2">
                    No Pools Available
                  </h3>
                  <p className="text-indigo-200/60">
                    Please check your network connection or try again later.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lending Section */}
      {selectedSection === "lending" && (
        <div className="space-y-8">
          {selectedPool ? (
            <SupplierAnalytics poolId={selectedPool.contracts?.marginPoolId} />
          ) : (
            <div className="text-center text-indigo-200/60 py-12">
              Select a pool to view lending analytics
            </div>
          )}
        </div>
      )}

      {/* Borrowing Section */}
      {selectedSection === "borrowing" && (
        <div className="space-y-8">
          <BorrowerOverview />
        </div>
      )}

      {/* Liquidations Section */}
      {selectedSection === "liquidations" && (
        <div className="space-y-8">
          <LiquidationDashboard />
        </div>
      )}

      {/* Admin Section */}
      {selectedSection === "admin" && (
        <div className="space-y-8">
          {selectedPool ? (
            <AdministrativePanel
              poolId={selectedPool.contracts?.marginPoolId}
            />
          ) : (
            <div className="text-center text-indigo-200/60 py-12">
              Select a pool to view admin panel
            </div>
          )}
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Deposit / Withdraw History"
        width={"50vw"}
      >
        <DepositHistory address={account?.address} />
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
    </div>
  );
}
