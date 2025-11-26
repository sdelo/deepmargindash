import React from "react";
import { Link } from "react-router-dom";
import { LandingNavBar } from "../components/LandingNavBar";
import { LandingPoolCard } from "../components/LandingPoolCard";
import { GlobalMetricsPanel } from "../features/lending/components/GlobalMetricsPanel";
import { HowItWorks } from "../components/HowItWorks";
import { TransparencySection } from "../components/TransparencySection";
import { Footer } from "../components/Footer";
import { usePoolData } from "../hooks/usePoolData";
import { useNetworkContracts } from "../hooks/useNetworkContracts";
import { syntheticPools } from "../data/synthetic/pools";
import HelmetIcon from "../assets/helmet-v2-minimal.svg";

export function LandingPage() {
  const contracts = useNetworkContracts();
  const suiPoolData = usePoolData(contracts.SUI_MARGIN_POOL_ID);
  const dbusdcPoolData = usePoolData(contracts.DBUSDC_MARGIN_POOL_ID);

  // Get pools data with fallback
  const pools = React.useMemo(() => {
    const livePools = [];

    if (suiPoolData.data) {
      livePools.push(suiPoolData.data);
    } else if (!suiPoolData.isLoading && !suiPoolData.error) {
      livePools.push(syntheticPools.find((p) => p.asset === "SUI")!);
    }

    if (dbusdcPoolData.data) {
      livePools.push(dbusdcPoolData.data);
    } else if (!dbusdcPoolData.isLoading && !dbusdcPoolData.error) {
      livePools.push(syntheticPools.find((p) => p.asset === "DBUSDC")!);
    }

    return livePools.length > 0 ? livePools : syntheticPools;
  }, [
    suiPoolData.data,
    suiPoolData.isLoading,
    suiPoolData.error,
    dbusdcPoolData.data,
    dbusdcPoolData.isLoading,
    dbusdcPoolData.error,
  ]);

  // Calculate highest APY for hero
  const highestApy = React.useMemo(() => {
    if (pools.length === 0) return "0.00";
    const max = Math.max(...pools.map(p => Number(p.ui.aprSupplyPct)));
    return max.toFixed(2);
  }, [pools]);

  const isLoading = suiPoolData.isLoading || dbusdcPoolData.isLoading;

  return (
    <div className="min-h-screen">
      <LandingNavBar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Name */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={HelmetIcon} alt="Leviathan" className="w-14 h-14" />
            <h1 className="text-4xl font-bold text-white">Leviathan</h1>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Earn yield with confidence
          </h2>

          {/* Subline */}
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Lend your crypto to margin traders on DeepBook — Sui's premier liquidity layer. 
            They pay interest, you keep the returns. Withdraw anytime.
          </p>

          {/* APY Highlight */}
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-white/60">Earn up to</span>
            <span className="text-2xl font-bold text-amber-400">
              {isLoading ? "..." : `${highestApy}%`}
            </span>
            <span className="text-white/60">APY</span>
          </div>

          {/* Primary CTA */}
          <div>
            <Link
              to="/pools"
              className="btn-primary inline-flex items-center gap-2 text-lg"
            >
              Explore Pools
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Pool Cards Section */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {pools.map((pool) => (
              <LandingPoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        </div>
      </section>

      {/* Protocol Overview */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <GlobalMetricsPanel />
        </div>
      </section>

      {/* How It Works */}
      <HowItWorks />

      {/* Transparency */}
      <TransparencySection />

      {/* Bottom CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="card-surface-elevated p-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Built for the DeepBook Community
            </h2>
            <p className="text-white/60 mb-8">
              An open dashboard for exploring and participating in DeepBook Margin pools on Sui.
            </p>
            <Link
              to="/pools"
              className="btn-primary inline-flex items-center gap-2"
            >
              Start Earning
              <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
