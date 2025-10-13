import React from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  UsersIcon,
  BanknotesIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { LandingNavBar } from "../components/LandingNavBar";
import { LandingPoolCard } from "../components/LandingPoolCard";
import { OceanIcon } from "../components/OceanIcon";
import { AnimatedSection } from "../components/AnimatedSection";
import { syntheticPools } from "../data/synthetic/pools";
import "../styles/landing.css";

export function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <LandingNavBar />

      {/* Hero Section with Live Pool Cards */}
      <section className="relative pt-24 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Title */}
          <AnimatedSection
            animation="slide-in-top"
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-extrabold gradient-text mb-4">
              Leviathan
            </h1>
            <p className="text-2xl md:text-3xl text-cyan-300 mb-4">
              Margin Dashboard
            </p>
            <p className="text-lg text-indigo-200/90 max-w-2xl mx-auto">
              Earn competitive yields on Sui's DeepBook Margin Protocol. Supply
              liquidity to margin pools and start earning today.
            </p>
          </AnimatedSection>

          {/* Live Pool Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
            {syntheticPools.map((pool, index) => (
              <AnimatedSection
                key={pool.id}
                animation={index === 0 ? "slide-in-left" : "slide-in-right"}
                delay={index * 0.2}
              >
                <LandingPoolCard pool={pool} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fade-in-up" className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Start Earning in Under 2 Minutes
            </h2>
            <p className="text-xl text-indigo-200/90 max-w-3xl mx-auto">
              Get started with DeepBook Margin in just a few simple steps.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedSection animation="slide-in-left" delay={0.1}>
              <div className="card-surface card-ring glow-amber glow-cyan text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <OceanIcon name="anchor" size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Connect Wallet
                </h3>
                <p className="text-indigo-200/90">
                  Connect your Sui wallet to access the dashboard and view your
                  positions across all pools.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="fade-in-up" delay={0.2}>
              <div className="card-surface card-ring glow-amber glow-cyan text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <OceanIcon name="wave" size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Choose Pool
                </h3>
                <p className="text-indigo-200/90">
                  Select from available pools (USDC, SUI) and review current
                  yields, utilization, and risk parameters.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="slide-in-right" delay={0.3}>
              <div className="card-surface card-ring glow-amber glow-cyan text-center p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <OceanIcon name="treasure-chest" size="lg" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-4">
                  Start Earning
                </h3>
                <p className="text-indigo-200/90">
                  Deposit your assets and start earning competitive yields while
                  monitoring your positions in real-time.
                </p>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* What is DeepBook Margin? */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fade-in-up" className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              What is DeepBook Margin?
            </h2>
            <p className="text-xl text-indigo-200/90 max-w-3xl mx-auto">
              DeepBook Margin is a sophisticated lending protocol built on Sui
              blockchain that enables users to earn yield by providing liquidity
              to margin trading pools.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <AnimatedSection animation="slide-in-left" delay={0.1}>
              <div className="card-surface card-ring glow-amber glow-cyan p-8">
                <h3 className="text-2xl font-semibold text-cyan-300 mb-6">
                  How It Works
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                      <OceanIcon name="wave" size="sm" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Liquidity Provision
                      </h4>
                      <p className="text-indigo-200/90">
                        Users deposit assets (USDC, SUI) into margin pools to
                        provide liquidity for traders.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                      <OceanIcon name="treasure-chest" size="sm" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Interest Generation
                      </h4>
                      <p className="text-indigo-200/90">
                        Traders pay interest on borrowed funds, which is
                        distributed to liquidity providers as yield.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-cyan-300 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold">
                      <OceanIcon name="anchor" size="sm" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">
                        Risk Management
                      </h4>
                      <p className="text-indigo-200/90">
                        Advanced risk parameters ensure pool stability and
                        protect depositor funds.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="slide-in-right" delay={0.2}>
              <div className="card-surface card-ring glow-amber glow-cyan p-8">
                <h4 className="text-xl font-semibold text-white mb-6">
                  Key Benefits
                </h4>
                <ul className="space-y-4">
                  <li className="flex items-center text-indigo-200/90">
                    <ArrowTrendingUpIcon className="h-5 w-5 text-cyan-300 mr-3" />
                    Competitive yields on idle assets
                  </li>
                  <li className="flex items-center text-indigo-200/90">
                    <ShieldCheckIcon className="h-5 w-5 text-cyan-300 mr-3" />
                    Over-collateralized lending model
                  </li>
                  <li className="flex items-center text-indigo-200/90">
                    <ClockIcon className="h-5 w-5 text-cyan-300 mr-3" />
                    Real-time interest rate adjustments
                  </li>
                  <li className="flex items-center text-indigo-200/90">
                    <UsersIcon className="h-5 w-5 text-cyan-300 mr-3" />
                    Decentralized and permissionless
                  </li>
                </ul>
                <div className="mt-6">
                  <a
                    href="https://docs.sui.io/guides/developer/deepbook"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-amber-300 underline decoration-cyan-400/40 hover:decoration-amber-400/40 transition-all duration-300"
                  >
                    Learn more about DeepBook Protocol →
                  </a>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Dashboard Features Preview */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection animation="fade-in-up" className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-6">
              Dashboard Features
            </h2>
            <p className="text-xl text-indigo-200/90 max-w-3xl mx-auto">
              Monitor your positions and track pool health with comprehensive
              analytics.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AnimatedSection animation="scale-in" delay={0.1}>
              <div className="card-surface card-ring glow-amber glow-cyan p-6 hover:scale-105 transition-all duration-300">
                <OceanIcon name="submarine" className="mb-4" size="lg" />
                <h3 className="text-xl font-semibold text-white mb-3">
                  Track Your Positions
                </h3>
                <p className="text-indigo-200/90 mb-4">
                  Monitor your deposits, earnings, and portfolio performance in
                  real-time.
                </p>
                <div className="text-sm text-cyan-300">
                  View your current positions
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={0.2}>
              <div className="card-surface card-ring glow-amber glow-cyan p-6 hover:scale-105 transition-all duration-300">
                <OceanIcon name="depth-gauge" className="mb-4" size="lg" />
                <h3 className="text-xl font-semibold text-white mb-3">
                  Monitor Pool Health
                </h3>
                <p className="text-indigo-200/90 mb-4">
                  Track utilization rates, risk metrics, and pool stability
                  indicators.
                </p>
                <div className="text-sm text-cyan-300">
                  0 liquidations in last 30 days
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={0.3}>
              <div className="card-surface card-ring glow-amber glow-cyan p-6 hover:scale-105 transition-all duration-300">
                <OceanIcon name="sonar" className="mb-4" size="lg" />
                <h3 className="text-xl font-semibold text-white mb-3">
                  View Historical Data
                </h3>
                <p className="text-indigo-200/90 mb-4">
                  Analyze past performance, yield trends, and market conditions.
                </p>
                <div className="text-sm text-cyan-300">
                  Monitor $0 bad debt historically
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scale-in" delay={0.4}>
              <div className="card-surface card-ring glow-amber glow-cyan p-6 hover:scale-105 transition-all duration-300">
                <OceanIcon name="wave" className="mb-4" size="lg" />
                <h3 className="text-xl font-semibold text-white mb-3">
                  Community Insights
                </h3>
                <p className="text-indigo-200/90 mb-4">
                  See depositor distribution and community activity patterns.
                </p>
                <div className="text-sm text-cyan-300">
                  See concentration of 500 lenders
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Trust & Transparency */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <AnimatedSection animation="scale-in" delay={0.1}>
            <div className="card-surface card-ring glow-amber glow-cyan p-12">
              <h2 className="text-4xl font-bold text-white mb-6">
                Powered by DeepBook Protocol
              </h2>
              <p className="text-xl text-indigo-200/90 mb-8 max-w-2xl mx-auto">
                Built on Sui's native DeepBook protocol for maximum security and
                transparency. All pool operations are verifiable on-chain.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Link
                  to="/pools"
                  className="btn-primary inline-flex items-center px-8 py-4 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105"
                >
                  <CurrencyDollarIcon className="mr-2 h-5 w-5" />
                  Start Earning Now
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
              </div>

              <div className="text-center">
                <p className="text-indigo-200/80 mb-4">
                  Trusted by the Sui ecosystem
                </p>
                <div className="flex justify-center items-center space-x-8 opacity-60">
                  <div className="text-cyan-300 font-semibold">
                    Sui Foundation
                  </div>
                  <div className="text-cyan-300 font-semibold">
                    DeepBook Protocol
                  </div>
                  <div className="text-cyan-300 font-semibold">
                    Community Driven
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
