import "./App.css";
import React from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
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
import {
  getSyntheticUserPositions,
  getSyntheticBalanceFormatted,
} from "./data/synthetic/users";

function App() {
  const account = useCurrentAccount();
  const [selectedPoolId, setSelectedPoolId] = React.useState(
    syntheticPools[0]!.id
  );
  const selected =
    syntheticPools.find((p) => p.id === selectedPoolId) ?? syntheticPools[0]!;
  const [adminOpen, setAdminOpen] = React.useState(false);

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
              balance={getSyntheticBalanceFormatted(
                account?.address,
                selected.asset
              )}
              onDeposit={(amt) => {
                console.log("deposit", selected.id, amt);
              }}
              onWithdrawAll={() => {
                console.log("withdraw all", selected.id);
              }}
            />
          </div>
          <div>
            {account ? (
              <PersonalPositions
                positions={getSyntheticUserPositions(account.address)}
              />
            ) : (
              <div className="card-surface text-center py-10 border border-white/10 text-cyan-100/80">
                Connect wallet to view positions
              </div>
            )}
          </div>
        </div>

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-6">
          <YieldCurve pool={selected} />
          <HistoricalActivity poolId={selected.id} />
        </div>

        <DepositorDistribution poolId={selected.id} />

        {/* Bottom section: protocol fees full-width */}
        <ProtocolFees poolId={selected.id} />
      </div>

      <SlidePanel
        open={adminOpen}
        onClose={() => setAdminOpen(false)}
        title="Pool Admin Updates"
        width={"50vw"}
      >
        <PoolAdmin poolId={selected.id} />
      </SlidePanel>
    </div>
  );
}

export default App;
