import React from 'react';
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from '@mysten/dapp-kit';
import { syntheticPools } from '../data/synthetic/pools';
import PoolCards from '../features/lending/components/PoolCards';
import DepositWithdrawPanel from '../features/lending/components/DepositWithdrawPanel';
import PersonalPositions from '../features/lending/components/PersonalPositions';
import YieldCurve from '../features/lending/components/YieldCurve';
import SlidePanel from '../features/shared/components/SlidePanel';
import DepositHistory from '../features/lending/components/DepositHistory';
import { GlobalMetricsPanel } from '../features/lending/components/GlobalMetricsPanel';
import { EnhancedPoolAnalytics } from '../features/lending/components/EnhancedPoolAnalytics';
import { SupplierAnalytics } from '../features/lending/components/SupplierAnalytics';
import { BorrowerOverview } from '../features/lending/components/BorrowerOverview';
import { LiquidationDashboard } from '../features/lending/components/LiquidationDashboard';
import { AdministrativePanel } from '../features/lending/components/AdministrativePanel';
import { SectionNav, type DashboardSection } from '../features/shared/components/SectionNav';
import { useCoinBalance } from '../hooks/useCoinBalance';
import { usePoolData } from '../hooks/usePoolData';
import { CONTRACTS } from '../config/contracts';
import {
  ONE_BILLION,
  GAS_AMOUNT_MIST,
  MIN_GAS_BALANCE_SUI,
} from '../constants';
import {
  buildDepositTransaction,
  buildWithdrawTransaction,
  buildWithdrawAllTransaction,
} from '../lib/suiTransactions';
import type { PoolOverview } from '../features/lending/types';

export function PoolsPage() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const { network } = useSuiClientContext();

  // State for section navigation
  const [selectedSection, setSelectedSection] = React.useState<DashboardSection>('overview');
  
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
      realPools.push(syntheticPools.find((p) => p.asset === 'SUI')!);
    }

    if (dbusdcPoolData.data) {
      realPools.push(dbusdcPoolData.data);
    } else if (!dbusdcPoolData.isLoading && !dbusdcPoolData.error) {
      realPools.push(syntheticPools.find((p) => p.asset === 'DBUSDC')!);
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
  const selectedPool = React.useMemo(() => {
    return (
      pools.find((p) => p.id === selectedPoolId) ??
      pools[0] ??
      syntheticPools[0]!
    );
  }, [pools, selectedPoolId]);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [txStatus, setTxStatus] = React.useState<
    'idle' | 'pending' | 'success' | 'error'
  >('idle');
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
    selectedPool?.contracts?.coinType,
    selectedPool?.contracts?.coinDecimals
  );

  // Get SUI balance for gas fees
  const suiBalance = useCoinBalance(account?.address, '0x2::sui::SUI', 9);

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

      // Check if user has enough SUI for gas
      const suiBalanceNum = parseFloat(suiBalance?.raw || '0') / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus('error');
        setTxError(
          'Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs.'
        );
        return;
      }

      // For SUI deposits, check if user has enough SUI for both deposit and gas
      if (selectedPool.contracts.coinType === '0x2::sui::SUI') {
        try {
          const suiCoins = await suiClient.getCoins({
            owner: account.address,
            coinType: '0x2::sui::SUI',
          });

          const totalSuiBalance = suiCoins.data.reduce(
            (sum, coin) => sum + BigInt(coin.balance),
            0n
          );
          const gasAmount = BigInt(GAS_AMOUNT_MIST);
          const depositAmount = BigInt(Math.round(amount * ONE_BILLION));
          const totalNeeded = gasAmount + depositAmount;

          if (totalSuiBalance < totalNeeded) {
            setTxStatus('error');
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
          console.error('Error checking SUI coins:', error);
        }
      }

      // Check if user has enough of the asset to deposit
      const assetBalanceNum =
        parseFloat(coinBalance?.raw || '0') /
        Math.pow(10, selectedPool.contracts.coinDecimals);
      if (amount > assetBalanceNum) {
        setTxStatus('error');
        setTxError(
          `Insufficient ${selectedPool.asset} balance. You have ${
            coinBalance?.formatted || '0'
          } but trying to deposit ${amount.toLocaleString()}.`
        );
        return;
      }

      try {
        setTxStatus('pending');
        setTxError(null);
        const poolContracts = selectedPool.contracts;

        const decimals = poolContracts.coinDecimals;
        const finalAmount = BigInt(Math.round(amount * (10 ** decimals)));

        const tx = await buildDepositTransaction({
          amount: finalAmount,
          owner: account.address,
          coinType: poolContracts.coinType,
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          referralId: poolContracts.referralId,
          poolType: poolContracts.marginPoolType,
          suiClient,
          decimals,
        });

        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });
        setTxStatus('success');
        console.log('Deposit successful:', result.digest);
      } catch (error) {
        setTxStatus('error');
        setTxError(
          error instanceof Error ? error.message : 'Transaction failed'
        );
        console.error('Deposit failed:', error);
      }
    },
    [account, selectedPool, signAndExecute, suiClient, network, suiBalance, coinBalance]
  );

  const handleWithdraw = React.useCallback(
    async (amount: number) => {
      if (!account || !selectedPool) return;

      const suiBalanceNum = parseFloat(suiBalance?.raw || '0') / ONE_BILLION;
      if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
        setTxStatus('error');
        setTxError(
          'Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs.'
        );
        return;
      }

      try {
        setTxStatus('pending');
        setTxError(null);
        const poolContracts = selectedPool.contracts;

        const decimals = poolContracts.coinDecimals;
        const finalAmount = BigInt(Math.round(amount * (10 ** decimals)));

        const tx = await buildWithdrawTransaction({
          amount: finalAmount,
          poolId: poolContracts.marginPoolId,
          registryId: poolContracts.registryId,
          poolType: poolContracts.marginPoolType,
          owner: account.address,
          suiClient,
          decimals,
        });
        const result = await signAndExecute({
          transaction: tx,
          chain: `sui:${network}`,
        });
        setTxStatus('success');
        console.log('Withdraw successful:', result.digest);
      } catch (error) {
        setTxStatus('error');
        setTxError(
          error instanceof Error ? error.message : 'Transaction failed'
        );
        console.error('Withdraw failed:', error);
      }
    },
    [account, selectedPool, signAndExecute, network, suiBalance, suiClient]
  );

  const handleWithdrawAll = React.useCallback(async () => {
    if (!account || !selectedPool) return;

    const suiBalanceNum = parseFloat(suiBalance?.raw || '0') / ONE_BILLION;
    if (suiBalanceNum < MIN_GAS_BALANCE_SUI) {
      setTxStatus('error');
      setTxError(
        'Insufficient SUI for gas fees. You need at least 0.01 SUI to cover transaction costs.'
      );
      return;
    }

    try {
      setTxStatus('pending');
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
      setTxStatus('success');
      console.log('Withdraw all successful:', result.digest);
    } catch (error) {
      setTxStatus('error');
      setTxError(error instanceof Error ? error.message : 'Transaction failed');
      console.error('Withdraw all failed:', error);
    }
  }, [account, selectedPool, signAndExecute, network, suiBalance, suiClient]);

  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;
  const hasError = suiPoolData.error || dbusdcPoolData.error;

  if (!selectedPool || !selectedPool.protocolConfig?.margin_pool_config) {
    return (
      <div className="max-w-[1400px] mx-auto pl-4 lg:pl-72 pr-4 text-white space-y-8">
        <div className="mb-4">
          <h1 className="text-3xl font-extrabold tracking-wide text-cyan-200 drop-shadow">
            DeepBook Margin Dashboard
          </h1>
          <div className="text-sm text-cyan-100/80 mt-2">
            Loading pool data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto pl-4 lg:pl-72 pr-4 text-white space-y-8 pb-12">
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
            Error loading pool data:{' '}
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
      {selectedSection === 'overview' && (
        <div className="space-y-8">
          <GlobalMetricsPanel />
          
          <div>
            <h2 className="text-2xl font-bold text-cyan-200 mb-6">Pool Selection & Actions</h2>
            <PoolCards
              pools={pools}
              selectedPoolId={selectedPoolId}
              onSelectPool={setSelectedPoolId}
              onDepositClick={(id) => setSelectedPoolId(id)}
              onAdminAuditClick={(id) => setSelectedPoolId(id)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            <div className="lg:col-span-3 space-y-6">
              <DepositWithdrawPanel
                asset={selectedPool.asset}
                minBorrow={Number(
                  selectedPool.protocolConfig?.margin_pool_config?.min_borrow || 0
                )}
                supplyCap={Number(
                  selectedPool.protocolConfig?.margin_pool_config?.supply_cap || 0
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

            <div className="lg:col-span-2 space-y-6">
              <h3 className="text-2xl font-bold text-indigo-300 flex items-center gap-2">
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
                <div className="card-surface text-center py-16 border border-white/10 text-cyan-100/80 rounded-3xl">
                  <div className="mb-4 text-4xl">🔐</div>
                  <div className="text-lg font-semibold mb-2">
                    Connect Your Wallet
                  </div>
                  <div className="text-sm text-indigo-200/60">
                    View and manage your positions
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-cyan-200 mb-6">Pool Analytics</h2>
            <EnhancedPoolAnalytics pool={selectedPool} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-cyan-200 mb-6">Yield & Interest Rates</h2>
            <YieldCurve pool={selectedPool} />
          </div>
        </div>
      )}

      {/* Lending Section */}
      {selectedSection === 'lending' && (
        <div className="space-y-8">
          <SupplierAnalytics poolId={selectedPoolId} />
        </div>
      )}

      {/* Borrowing Section */}
      {selectedSection === 'borrowing' && (
        <div className="space-y-8">
          <BorrowerOverview />
        </div>
      )}

      {/* Liquidations Section */}
      {selectedSection === 'liquidations' && (
        <div className="space-y-8">
          <LiquidationDashboard />
        </div>
      )}

      {/* Admin Section */}
      {selectedSection === 'admin' && (
        <div className="space-y-8">
          <AdministrativePanel poolId={selectedPoolId} />
        </div>
      )}

      {/* Slide Panels */}
      <SlidePanel
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        title="Deposit / Withdraw History"
        width={'50vw'}
      >
        <DepositHistory address={account?.address} />
      </SlidePanel>
    </div>
  );
}

