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
import YieldCurve from "./features/lending/components/YieldCurve";
import PoolAdmin from "./features/lending/components/PoolAdmin";

function App() {
  const [selectedPoolId, setSelectedPoolId] = React.useState(
    syntheticPools[0]!.id
  );
  const selected =
    syntheticPools.find((p) => p.id === selectedPoolId) ?? syntheticPools[0]!;

  return (
    <div className="min-h-screen py-8 relative">
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
          <p className="text-sm text-indigo-200/80">
            Compare and select a pool to deposit. Glassmorphic Leviathan theme.
          </p>
        </div>

        {/* Top section: left = pools + overview, right = deposit (sticky) + positions */}
        <div className="grid md:grid-cols-[2fr_1fr] gap-6 items-start">
          <div className="space-y-6">
            <PoolCards
              pools={syntheticPools}
              onDepositClick={(id) => setSelectedPoolId(id)}
            />
            <OverviewStrip pool={selected} />
          </div>
          <div className="space-y-6 md:sticky md:top-6">
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
          </div>
        </div>

        {/* Middle section: charts side-by-side */}
        <div className="grid md:grid-cols-2 gap-6">
          <YieldCurve pool={selected} />
          <HistoricalActivity poolId={selected.id} />
        </div>

        <DepositorDistribution poolId={selected.id} />

        {/* Bottom section: protocol fees full-width */}
        <ProtocolFees poolId={selected.id} />

        {/* Admin log */}
        <PoolAdmin poolId={selected.id} />
      </div>
    </div>
  );
}

export default App;
