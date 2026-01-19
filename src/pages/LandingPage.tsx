import React from "react";
import { Link } from "react-router-dom";
import { LandingNavBar } from "../components/LandingNavBar";
import { LandingPoolCard } from "../components/LandingPoolCard";
import { GlobalMetricsPanel } from "../features/lending/components/GlobalMetricsPanel";
import { HowItWorks } from "../components/HowItWorks";
import { TransparencySection } from "../components/TransparencySection";
import { Footer } from "../components/Footer";
import { useAllPools } from "../hooks/useAllPools";
import { brand } from "../config/brand";

export function LandingPage() {
  const { pools, isLoading } = useAllPools();

  // Calculate highest APY for hero
  const highestApy = React.useMemo(() => {
    if (pools.length === 0) return "0.00";
    const max = Math.max(...pools.map(p => Number(p.ui.aprSupplyPct)));
    return max.toFixed(2);
  }, [pools]);

  return (
    <div className="min-h-screen">
      <LandingNavBar />

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo and Name */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <img src={brand.logo.src} alt={brand.logo.alt} className={brand.logo.sizes.xl} />
            <h1 className="text-4xl font-bold text-white tracking-wide">{brand.name}</h1>
          </div>

          {/* Main Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Earn yield with confidence
          </h2>

          {/* Subline - Clear value prop */}
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-4">
            Supply to DeepBook margin pools. Earn interest from margin traders. 
            Withdraw when liquidity is available.
          </p>

          {/* Reality anchor - blunt line */}
          <p className="text-sm text-white/50 max-w-xl mx-auto mb-8">
            Powered by Sui's on-chain order book. Your funds back leveraged trades — 
            you earn the interest, traders take the risk.
          </p>

          {/* APY Highlight - Updated copy */}
          <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-white/60">Current best APY:</span>
            <span className="text-2xl font-bold text-teal-400">
              {isLoading ? "..." : `${highestApy}%`}
            </span>
            <span className="text-xs text-white/40">(variable)</span>
          </div>

          {/* Primary CTA */}
          <div className="mb-8">
            <Link
              to="/pools"
              className="btn-primary inline-flex items-center gap-2 text-lg"
            >
              Explore Pools
              <ArrowRightIcon />
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-4 text-xs text-white/40 mb-8">
            <div className="flex items-center gap-1.5">
              <VerifyIcon />
              <span>Verify on-chain</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CodePreviewIcon />
              <span>Preview tx before signing</span>
            </div>
            <div className="flex items-center gap-1.5">
              <NoLockIcon />
              <span>No lockup period</span>
            </div>
          </div>

          {/* Risks Disclosure */}
          <RisksSection />
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

      {/* Transparency - Moved up for trust */}
      <TransparencySection />

      {/* Secondary CTA - People decide here */}
      <section className="py-8 px-4">
        <div className="max-w-xl mx-auto text-center">
          <Link
            to="/pools"
            className="btn-primary inline-flex items-center gap-2"
          >
            Launch App
            <ArrowRightIcon />
          </Link>
          <p className="text-xs text-white/40 mt-3">
            Connect your wallet and start earning in minutes
          </p>
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

      {/* Advanced Tools - Liquidations (demoted from main feature) */}
      <AdvancedToolsSection />

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

function VerifyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function CodePreviewIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function NoLockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
  );
}

// Advanced Tools Section - Demoted liquidations center
function AdvancedToolsSection() {
  return (
    <section className="py-12 px-4 border-t border-white/5">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-xs uppercase tracking-wider text-white/40 font-medium">
            Advanced Tools
          </span>
          <h3 className="text-xl font-semibold text-white mt-2">
            Liquidations Center
          </h3>
          <p className="text-white/50 text-sm mt-2 max-w-lg mx-auto">
            Monitor at-risk positions and execute liquidations. For experienced users and bots.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdvancedFeature icon={<RiskIcon />} label="Risk Distribution" />
          <AdvancedFeature icon={<SimIcon />} label="Price Simulator" />
          <AdvancedFeature icon={<HistIcon />} label="Liquidation History" />
          <AdvancedFeature icon={<LeaderIcon />} label="Leaderboard" />
        </div>

        <div className="text-center mt-6">
          <Link
            to="/pools"
            className="text-sm text-white/50 hover:text-white/80 transition-colors inline-flex items-center gap-1"
          >
            Explore advanced tools →
          </Link>
        </div>
      </div>
    </section>
  );
}

function AdvancedFeature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] text-center hover:bg-white/[0.05] transition-colors">
      <div className="text-white/40 mb-2 flex justify-center">{icon}</div>
      <span className="text-xs text-white/50">{label}</span>
    </div>
  );
}

function RiskIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="14" width="3" height="6" rx="0.5" />
      <rect x="10" y="10" width="3" height="10" rx="0.5" />
      <rect x="16" y="6" width="3" height="14" rx="0.5" />
    </svg>
  );
}

function SimIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="4" y1="12" x2="20" y2="12" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  );
}

function HistIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LeaderIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
      <path d="M12 15v4M8 22h8" />
    </svg>
  );
}

// Risks disclosure section
function RisksSection() {
  return (
    <div className="max-w-2xl mx-auto">
      <button
        onClick={(e) => {
          const details = e.currentTarget.nextElementSibling;
          if (details) details.classList.toggle('hidden');
          e.currentTarget.querySelector('svg')?.classList.toggle('rotate-180');
        }}
        className="flex items-center gap-2 text-xs text-white/40 hover:text-white/60 transition-colors mx-auto"
      >
        <WarningIcon />
        <span>Can I lose money?</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="hidden mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left">
        <p className="text-xs text-white/50 mb-3">
          Yes. Like all DeFi protocols, there are real risks:
        </p>
        <ul className="space-y-2 text-xs text-white/40">
          <li className="flex items-start gap-2">
            <span className="text-amber-400/70 mt-0.5">•</span>
            <span><strong className="text-white/50">Smart contract risk</strong> — Bugs or exploits in the protocol code could result in loss of funds.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400/70 mt-0.5">•</span>
            <span><strong className="text-white/50">Withdrawal liquidity risk</strong> — High utilization means your funds may be temporarily locked until borrowers repay.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400/70 mt-0.5">•</span>
            <span><strong className="text-white/50">Bad debt risk</strong> — If liquidations fail during extreme volatility, the pool may incur losses.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-400/70 mt-0.5">•</span>
            <span><strong className="text-white/50">Rate variability</strong> — APY fluctuates based on utilization and market conditions. Past returns don't guarantee future performance.</span>
          </li>
        </ul>
        <p className="text-[10px] text-white/30 mt-3 pt-3 border-t border-white/[0.06]">
          Only deposit what you can afford to lose. This is not financial advice.
        </p>
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
