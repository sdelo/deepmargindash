import React, { useState, useEffect } from "react";
import { usePoolData } from "../hooks/usePoolData";
import { CONTRACTS } from "../config/contracts";
import { syntheticPools } from "../data/synthetic/pools";
import type { PoolOverview } from "../features/lending/types";

interface DashboardNavProps {
  className?: string;
  selectedPoolId?: string;
  onSelectPool?: (poolId: string) => void;
}

const NAV_ITEMS = [
  { id: "pools-deposit", label: "Pools & Deposit", icon: "🏊" },
  { id: "yield-interest", label: "Yield & Interest", icon: "📈" },
  { id: "depositors", label: "Depositors", icon: "👥" },
  { id: "activity", label: "Activity", icon: "📊" },
  { id: "fees", label: "Fees & Liquidations", icon: "💰" },
];

const ICONS: Record<string, string> = {
  SUI: "https://assets.coingecko.com/coins/images/26375/standard/sui-ocean-square.png?1727791290",
  DBUSDC:
    "https://assets.coingecko.com/coins/images/6319/standard/usdc.png?1696506694",
};

export function DashboardNav({
  className = "",
  selectedPoolId,
  onSelectPool,
}: DashboardNavProps) {
  const [activeSection, setActiveSection] = useState<string>("pools-deposit");

  // Fetch pool data for navigation
  const suiPoolData = usePoolData(CONTRACTS.testnet.SUI_MARGIN_POOL_ID);
  const dbusdcPoolData = usePoolData(CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID);

  const pools: PoolOverview[] = React.useMemo(() => {
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: 0.1,
      }
    );

    // Observe all sections
    NAV_ITEMS.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <nav
        className={`fixed left-0 top-[64px] z-40 w-64 h-[calc(100vh-64px)] vertical-nav hidden lg:block ${className}`}
      >
        <div className="h-full flex flex-col py-6 px-4">
          {/* Pool Selection for Desktop */}
          {onSelectPool && (
            <div className="mb-6 pb-6 border-b border-white/10">
              <div className="text-sm font-semibold text-cyan-200 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                Select Pool
              </div>
              <div className="space-y-2">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => onSelectPool(pool.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 border-2
                      ${
                        selectedPoolId === pool.id
                          ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400 text-cyan-100 shadow-lg"
                          : "bg-white/5 border-white/20 text-indigo-100/80 hover:text-white hover:bg-white/10 hover:border-cyan-300/50"
                      }
                    `}
                  >
                    <img
                      src={ICONS[pool.asset]}
                      alt={`${pool.asset} logo`}
                      className="w-5 h-5 rounded flex-shrink-0"
                    />
                    <span className="font-bold flex-shrink-0">
                      {pool.asset}
                    </span>
                    <span className="text-amber-300 font-bold flex-shrink-0 ml-auto">
                      {Number(pool.ui.aprSupplyPct).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`
                  nav-button w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 min-h-[48px]
                  ${
                    activeSection === item.id
                      ? "bg-gradient-to-r from-cyan-500/40 to-indigo-500/40 text-cyan-100 border-2 border-cyan-400/60 shadow-lg shadow-cyan-500/30"
                      : "text-indigo-200/80 hover:text-white hover:bg-white/15 hover:border border-white/30 hover:shadow-md"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Horizontal Navigation */}
      <nav
        className={`sticky top-[64px] z-40 horizontal-nav lg:hidden ${className}`}
      >
        <div className="max-w-[1400px] mx-auto px-4">
          {/* Pool Selection */}
          {onSelectPool && (
            <div className="py-3 border-b border-white/10">
              <div className="text-sm font-semibold text-cyan-200 mb-2">
                Select Pool:
              </div>
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                {pools.map((pool) => (
                  <button
                    key={pool.id}
                    onClick={() => onSelectPool(pool.id)}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 min-h-[44px] border-2
                      ${
                        selectedPoolId === pool.id
                          ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border-cyan-400 text-cyan-100 shadow-lg"
                          : "bg-white/5 border-white/20 text-indigo-100/80 hover:text-white hover:bg-white/10 hover:border-cyan-300/50"
                      }
                    `}
                  >
                    <img
                      src={ICONS[pool.asset]}
                      alt={`${pool.asset} logo`}
                      className="w-4 h-4 rounded flex-shrink-0"
                    />
                    <span className="font-bold text-sm flex-shrink-0">
                      {pool.asset}
                    </span>
                    <span className="text-amber-300 font-bold text-sm flex-shrink-0">
                      {Number(pool.ui.aprSupplyPct).toFixed(2)}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`
                  nav-button flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-300 min-h-[40px]
                  ${
                    activeSection === item.id
                      ? "bg-gradient-to-r from-cyan-500/40 to-indigo-500/40 text-cyan-100 border border-cyan-400/60 shadow-lg"
                      : "text-indigo-200/80 hover:text-white hover:bg-white/15"
                  }
                `}
              >
                <span className="text-sm">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
