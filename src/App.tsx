import "./App.css";
import React from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientContext,
} from "@mysten/dapp-kit";
import { syntheticPools } from "./data/synthetic/pools";
import PoolCards from "./features/lending/components/PoolCards";
import DepositWithdrawPanel from "./features/lending/components/DepositWithdrawPanel";
import PersonalPositions from "./features/lending/components/PersonalPositions";
import HistoricalActivity from "./features/lending/components/HistoricalActivity";
import DepositorDistribution from "./features/lending/components/DepositorDistribution";
import ProtocolFees from "./features/lending/components/ProtocolFees";
import YieldCurve from "./features/lending/components/YieldCurve";
import NavBar from "./features/shared/components/NavBar";
import SlidePanel from "./features/shared/components/SlidePanel";
import PoolAdmin from "./features/lending/components/PoolAdmin";
import DepositHistory from "./features/lending/components/DepositHistory";
import { getSyntheticUserPositions } from "./data/synthetic/users";
import { useCoinBalance } from "./hooks/useCoinBalance";
import {
  buildDepositTransaction,
  buildWithdrawAllTransaction,
} from "./lib/suiTransactions";

function App() {
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

  const handleDeposit = React.useCallback(
    async (amount: number) => {
      if (!account) return;
      const poolContracts = selected.contracts;
      const tx = await buildDepositTransaction({
        amount: BigInt(Math.floor(amount)),
        owner: account.address,
        coinType: poolContracts.coinType,
        poolId: poolContracts.marginPoolId,
        registryId: poolContracts.registryId,
        referralId: poolContracts.referralId,
        poolType: poolContracts.marginPoolType,
        suiClient,
      });
      tx.setGasBudgetIfNotSet(50_000_000);
      await signAndExecute({
        transaction: tx,
        chain: `sui:${network}`,
      });
    },
    [account, selected, signAndExecute, suiClient, network]
  );

  const handleWithdrawAll = React.useCallback(async () => {
    if (!account) return;
    const poolContracts = selected.contracts;
    const tx = buildWithdrawAllTransaction({
      poolId: poolContracts.marginPoolId,
      registryId: poolContracts.registryId,
      poolType: poolContracts.marginPoolType,
    });

    tx.setGasBudgetIfNotSet(50_000_000);
    await signAndExecute({
      transaction: tx,
      chain: `sui:${network}`,
    });
  }, [account, selected, signAndExecute, network]);

  return (
    <div className="min-h-screen pt-20 pb-8 relative">
      <NavBar />
      <div className="plankton-layer" aria-hidden>
        {Array.from({ length: 36 }).map((_, i) => (
          <span
            key={i}
            className="plankton-dot"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${18 + Math.random() * 20}s`,
              animationDelay: `${-Math.random() * 20}s`,
            }}
          />
        ))}
      </div>
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
              onDeposit={handleDeposit}
              onWithdrawAll={handleWithdrawAll}
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
    </div>
  );
}

export default App;
