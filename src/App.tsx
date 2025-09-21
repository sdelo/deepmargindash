import "./App.css";
import React from "react";
import { syntheticPools } from "./data/synthetic/pools";
import PoolCards from "./features/lending/components/PoolCards";
import OverviewStrip from "./features/lending/components/OverviewStrip";
import DepositWithdrawPanel from "./features/lending/components/DepositWithdrawPanel";
import PersonalPositions from "./features/lending/components/PersonalPositions";
import HistoricalActivity from "./features/lending/components/HistoricalActivity";
import DepositorDistribution from "./features/lending/components/DepositorDistribution";
import ProtocolFees from "./features/lending/components/ProtocolFees";

function App() {
  const [selectedPoolId, setSelectedPoolId] = React.useState(
    syntheticPools[0]!.id
  );
  const selected =
    syntheticPools.find((p) => p.id === selectedPoolId) ?? syntheticPools[0]!;

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 text-white space-y-8">
        <div className="mb-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-wide text-amber-300 drop-shadow">
            Deepbook — Lending Dashboard
          </h1>
          <p className="text-sm text-cyan-100/80">
            Two pools (USDC & SUI). Synthetic data for now.
          </p>
        </div>

        <PoolCards
          pools={syntheticPools}
          onDepositClick={(id) => setSelectedPoolId(id)}
        />

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <OverviewStrip pool={selected} />
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
            balance={`5,000 ${selected.asset}`}
            onDeposit={(amt) => {
              console.log("deposit", selected.id, amt);
            }}
            onWithdrawAll={() => {
              console.log("withdraw all", selected.id);
            }}
          />
        </div>

        <PersonalPositions
          positions={[
            {
              address: "0xme",
              asset: "USDC",
              shares: 5000n,
              balanceFormatted: "5,000 USDC",
            },
            {
              address: "0xme",
              asset: "SUI",
              shares: 1200n,
              balanceFormatted: "1,200 SUI",
            },
          ]}
        />

        <HistoricalActivity poolId={selected.id} />
        <DepositorDistribution poolId={selected.id} />
        <ProtocolFees poolId={selected.id} />
      </div>
    </div>
  );
}

export default App;
