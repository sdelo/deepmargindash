import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { useQueryClient } from "@tanstack/react-query";
import NavBar from "../features/shared/components/NavBar";
import PoolCarousel from "../features/lending/components/PoolCarousel";
import PositionsWithCalculator from "../features/lending/components/PositionsWithCalculator";
import ActionPanel from "../features/lending/components/ActionPanel";
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
import { HowItWorksPanel } from "../features/lending/components/HowItWorksPanel";
import {
  SectionNav,
  type DashboardSection,
} from "../features/shared/components/SectionNav";
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

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();
  const queryClient = useQueryClient();

  const [selectedSection, setSelectedSection] =
    React.useState<DashboardSection>("pools");

  const [overviewTab, setOverviewTab] = React.useState<
    | "overview"
    | "rates"
    | "activity"
    | "risk"
    | "liquidations"
    | "concentration"
    | "liquidity"
    | "markets"
    | "howItWorks"
  >("overview");
  
  const [moreDropdownOpen, setMoreDropdownOpen] = React.useState(false);
  
  const [pendingDepositAmount, setPendingDepositAmount] = React.useState<string>("");

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
    [account, selectedPool, signAndExecute, suiClient, network, suiBalance, coinBalance, queryClient, refetchPools]
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
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient, queryClient, refetchPools, coinBalance]
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

  // Tab configuration - reduced to max 4-5 top-level tabs
  type TabKey = "overview" | "rates" | "activity" | "risk" | "liquidations" | "concentration" | "liquidity" | "markets" | "howItWorks";
  const primaryTabs: readonly { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "rates", label: "Rates" },
    { key: "risk", label: "Risk" },
    { key: "activity", label: "Activity" },
  ];
  
  const moreTabs: readonly { key: TabKey; label: string }[] = [
    { key: "liquidity", label: "Liquidity" },
    { key: "markets", label: "Markets" },
    { key: "concentration", label: "Concentration" },
    { key: "liquidations", label: "Liquidations" },
  ];
  
  // Check if current tab is in More menu
  const isMoreTabActive = moreTabs.some(t => t.key === overviewTab);
  
  // Get human-readable tab name for breadcrumb
  const getTabLabel = (tab: TabKey): string => {
    const all = [...primaryTabs, ...moreTabs];
    return all.find(t => t.key === tab)?.label || tab;
  };

  return (
    <div className="min-h-screen text-white">
      {/* Section Navigation - Hidden for now */}
      <div className="hidden">
        <SectionNav selectedSection={selectedSection} onSelectSection={setSelectedSection} />
      </div>

      {/* Pools Section */}
      {selectedSection === "pools" && (
        <>
          {/* ═══════════════════════════════════════════════════════════════════
              STICKY HEADER: Nav + Pool Selector + Metrics
              ═══════════════════════════════════════════════════════════════════ */}
          <header className="sticky-stack">
            <NavBar />

            {/* Pool Header Strip */}
            <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-4">
              <div className="flex items-center gap-6">
                {/* Pool Selector Pills */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Choose Market</span>
                  <div className="flex items-center gap-2">
                  {pools.map((pool) => {
                    const isActive = pool.id === selectedPoolId;
                    const utilization = pool.state.supply > 0 
                      ? (pool.state.borrow / pool.state.supply) * 100 
                      : 0;
                    return (
                      <button
                        key={pool.id}
                        onClick={() => {
                          if (!isActive) {
                            setPoolSwitchKey((prev) => prev + 1);
                            setSelectedPoolId(pool.id);
                            setPendingDepositAmount("");
                          }
                        }}
                        className={`
                          flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200
                          ${isActive
                            ? "bg-[#2dd4bf] text-[#0d1a1f] shadow-lg shadow-[#2dd4bf]/20"
                            : "bg-white/[0.04] text-white/70 hover:text-white hover:bg-white/[0.08] border border-white/[0.06]"
                          }
                        `}
                      >
                        <img 
                          src={pool.ui.iconUrl || `https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png`}
                          alt={pool.asset}
                          className="w-6 h-6 rounded-full"
                        />
                        <div className="text-left">
                          <div className="font-semibold">{pool.asset}</div>
                          {/* Mini-stat chips */}
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] font-medium ${isActive ? "text-emerald-700" : "text-emerald-400/80"}`}
                            >
                              {pool.ui.aprSupplyPct.toFixed(1)}% APY
                            </span>
                            <span className={`text-[10px] ${isActive ? "text-[#0d1a1f]/40" : "text-white/30"}`}>·</span>
                            <span
                              className={`text-[10px] ${isActive ? "text-[#0d1a1f]/70" : "text-white/50"}`}
                            >
                              {utilization.toFixed(0)}% util
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  </div>
                </div>

                {/* Stats Strip */}
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
              </div>
            </div>
          </header>

          {/* Status Messages */}
          {(isLoading || hasError) && (
            <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-3">
              {isLoading && (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <div className="w-2 h-2 rounded-full bg-[#2dd4bf] animate-pulse" />
                  Loading pool data...
                </div>
              )}
              {hasError && (
                <div className="text-sm text-red-400">Error: {poolsError?.message}</div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════
              MAIN CONTENT: Two-column layout
              ═══════════════════════════════════════════════════════════════════ */}
          <main className="max-w-[1440px] mx-auto px-6 lg:px-8 py-6 pb-16">
            {selectedPool ? (
              <div key={poolSwitchKey} className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
                
                {/* ═══ LEFT COLUMN: Content (8 cols) ═══ */}
                <div className="lg:col-span-8 space-y-5">
                  
                  {/* Two-Mode Navigation: Overview mode hides tabs, Detail mode shows back button */}
                  {overviewTab === "overview" ? (
                    /* Mode 1: Overview - No tab bar, tiles navigate */
                    null
                  ) : (
                    /* Mode 2: Detail view - Show back button + breadcrumb */
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => setOverviewTab("overview")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back to Overview
                      </button>
                      <div className="flex items-center gap-1.5 text-sm text-white/40">
                        <span>Pools</span>
                        <span>/</span>
                        <span>{selectedPool?.asset}</span>
                        <span>/</span>
                        <span className="text-[#2dd4bf] font-medium">{getTabLabel(overviewTab)}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Tab bar - only visible in Detail mode for quick tab switching */}
                  {overviewTab !== "overview" && (
                    <div className="tab-bar relative">
                      {primaryTabs.filter(t => t.key !== "overview").map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setOverviewTab(tab.key)}
                          className={`tab-item ${overviewTab === tab.key ? "active" : ""}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                      
                      {/* More dropdown */}
                      <div className="relative">
                        <button
                          onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                          className={`tab-item flex items-center gap-1 ${isMoreTabActive ? "active" : ""}`}
                        >
                          {isMoreTabActive ? getTabLabel(overviewTab) : "More"}
                          <svg className={`w-3.5 h-3.5 transition-transform ${moreDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {moreDropdownOpen && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setMoreDropdownOpen(false)}
                            />
                            <div className="absolute top-full left-0 mt-1 py-1 bg-slate-800 border border-white/[0.1] rounded-lg shadow-xl z-20 min-w-[140px]">
                              {moreTabs.map((tab) => (
                                <button
                                  key={tab.key}
                                  onClick={() => {
                                    setOverviewTab(tab.key);
                                    setMoreDropdownOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-sm hover:bg-white/[0.06] transition-colors ${
                                    overviewTab === tab.key ? "text-[#2dd4bf]" : "text-white/70 hover:text-white"
                                  }`}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tab Content */}
                  <div className="surface-elevated p-6">
                    {overviewTab === "overview" && (
                      <OverviewTiles
                        pool={selectedPool}
                        onSelectTab={(tab) => setOverviewTab(tab as TabKey)}
                      />
                    )}
                    {overviewTab === "rates" && (
                      <div className="space-y-6">
                        {/* Rates Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-white">Rates & Yield</h3>
                            <p className="text-sm text-white/50 mt-0.5">Supply APY, Borrow APY, and utilization dynamics</p>
                          </div>
                        </div>
                        
                        {/* Quick Stats Row */}
                        <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <span className="text-xs text-white/50">Supply APY</span>
                            <div className="text-2xl font-semibold text-[#2dd4bf] mt-1 font-mono">
                              {selectedPool.ui?.aprSupplyPct?.toFixed(2) || "0.00"}%
                            </div>
                          </div>
                          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <span className="text-xs text-white/50">Borrow APY</span>
                            <div className="text-2xl font-semibold text-amber-400 mt-1 font-mono">
                              {selectedPool.ui?.aprBorrowPct?.toFixed(2) || "0.00"}%
                            </div>
                          </div>
                          <div className="p-4 bg-white/[0.03] rounded-xl border border-white/[0.06]">
                            <span className="text-xs text-white/50">Utilization</span>
                            <div className="text-2xl font-semibold text-white mt-1 font-mono">
                              {selectedPool.state.supply > 0 
                                ? ((selectedPool.state.borrow / selectedPool.state.supply) * 100).toFixed(1) 
                                : "0.0"}%
                            </div>
                          </div>
                        </div>
                        
                        {/* Interest Rate Model */}
                        <div className="border-t border-white/[0.06] pt-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-white">Interest Rate Model</h4>
                            <button
                              onClick={() => {
                                setInterestRateHistoryPoolId(selectedPool.contracts?.marginPoolId || null);
                                setInterestRateHistoryOpen(true);
                              }}
                              className="text-xs text-[#2dd4bf] hover:text-[#5eead4] transition-colors"
                            >
                              View History →
                            </button>
                          </div>
                          <YieldCurve
                            pool={selectedPool}
                            onShowHistory={() => {
                              setInterestRateHistoryPoolId(selectedPool.contracts?.marginPoolId || null);
                              setInterestRateHistoryOpen(true);
                            }}
                          />
                        </div>
                        
                        {/* APY History */}
                        <div className="border-t border-white/[0.06] pt-6">
                          <h4 className="text-sm font-semibold text-white mb-4">APY History</h4>
                          <APYHistory pool={selectedPool} />
                        </div>
                      </div>
                    )}
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
                    {overviewTab === "howItWorks" && (
                      <HowItWorksPanel />
                    )}
                  </div>
                </div>

                {/* ═══ RIGHT COLUMN: Actions (4 cols) - STICKY ═══ */}
                <div className="lg:col-span-4">
                  <div className="lg:sticky lg:top-[140px] space-y-5">
                    
                    {/* Action Panel */}
                    <ActionPanel
                      pool={selectedPool}
                      onDeposit={handleDeposit}
                      onWithdraw={handleWithdraw}
                      onWithdrawAll={handleWithdrawAll}
                      walletBalance={coinBalance?.formatted}
                      depositedBalance={selectedPoolDepositedBalance}
                      suiBalance={suiBalance?.formatted}
                      txStatus={txStatus}
                      onAmountChange={setPendingDepositAmount}
                      currentPositionBalance={selectedPoolDepositedBalance}
                      onShowHowItWorks={() => setOverviewTab("howItWorks")}
                    />

                    {/* Your Positions & Earnings Projection */}
                    <div className="surface-elevated p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]" />
                          <h3 className="text-sm font-semibold text-white">
                            {account ? "Your Positions" : "Earnings Preview"}
                          </h3>
                        </div>
                        <span className="text-label">{account ? "Summary" : "Calculator"}</span>
                      </div>
                      <PositionsWithCalculator
                        userAddress={account?.address}
                        pools={pools}
                        selectedPool={selectedPool}
                        positions={userPositions}
                        pendingDepositAmount={pendingDepositAmount}
                        onViewAllHistory={() => setHistoryOpen(true)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                {isLoading ? (
                  <div className="h-72 surface-card animate-pulse" />
                ) : (
                  <div className="surface-card p-16">
                    <h3 className="text-lg font-semibold text-white/70 mb-2">No Pools Available</h3>
                    <p className="text-sm text-white/40">Check network connection or try again later.</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      {/* Liquidations Section */}
      {selectedSection === "liquidations" && (
        <div className="space-y-8 px-6 lg:px-8">
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
