import React from "react";
import { SectionChips, type SectionConfig } from "../../../components/SectionChips";
import { PoolRiskOutlook } from "./PoolRiskOutlook";
import { LiquidityTab } from "./LiquidityTab";
import { WhaleWatch } from "./WhaleWatch";
import { LiquidationWall } from "./LiquidationWall";
import type { PoolOverview } from "../types";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface RiskTabProps {
  pool: PoolOverview;
}

const SECTIONS: SectionConfig[] = [
  { id: "overview", label: "Risk Overview" },
  { id: "liquidity", label: "Liquidity" },
  { id: "concentration", label: "Concentration" },
  { id: "liquidations", label: "Liquidations" },
];

/**
 * Consolidated Risk tab combining:
 * - Risk Summary strip (one-line verdict metrics)
 * - Liquidity (withdraw availability now + stress cases)
 * - Concentration (top suppliers/HHI, whale share)
 * - Liquidations (events over time + what triggers liquidations visuals)
 */
export function RiskTab({ pool }: RiskTabProps) {
  const [activeSection, setActiveSection] = React.useState("overview");
  const [liquidationsExpanded, setLiquidationsExpanded] = React.useState(false);
  const [isChipsSticky, setIsChipsSticky] = React.useState(false);

  // Refs for each section
  const overviewRef = React.useRef<HTMLDivElement>(null);
  const liquidityRef = React.useRef<HTMLDivElement>(null);
  const concentrationRef = React.useRef<HTMLDivElement>(null);
  const liquidationsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    overview: overviewRef,
    liquidity: liquidityRef,
    concentration: concentrationRef,
    liquidations: liquidationsRef,
  };

  // Scroll to section when clicking chips
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Auto-expand liquidations if clicking on it
    if (sectionId === "liquidations") {
      setLiquidationsExpanded(true);
    }
  };

  // Smart sticky: detect when we've scrolled past the sentinel
  React.useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // When sentinel leaves viewport (scrolled past), make chips sticky
          setIsChipsSticky(!entry.isIntersecting);
        });
      },
      { threshold: 0, rootMargin: "-60px 0px 0px 0px" }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, []);

  // Track active section on scroll using Intersection Observer (scrollspy)
  React.useEffect(() => {
    const observers: IntersectionObserver[] = [];

    Object.entries(sectionRefs).forEach(([id, ref]) => {
      if (!ref.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
              setActiveSection(id);
            }
          });
        },
        { threshold: [0.3, 0.5, 0.7], rootMargin: "-100px 0px -50% 0px" }
      );

      observer.observe(ref.current);
      observers.push(observer);
    });

    return () => {
      observers.forEach((obs) => obs.disconnect());
    };
  }, []);

  // Quick summary stats for the strip
  const utilization = pool.state.supply > 0
    ? (pool.state.borrow / pool.state.supply) * 100
    : 0;
  const availableLiquidity = pool.state.supply - pool.state.borrow;

  const getUtilizationColor = (util: number) => {
    if (util > 80) return "text-red-400";
    if (util > 50) return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <div className="space-y-0">
      {/* Sentinel element: when this scrolls out of view, chips become sticky */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Section Navigation - Smart Sticky Layer 2: sticks below navbar(56px) + tabs(52px) = 108px */}
      <div
        className={`
          z-30 -mx-6 px-6 transition-all duration-200
          ${isChipsSticky 
            ? "sticky top-[116px] py-1.5 bg-[#0d1a1f] backdrop-blur-xl border-b border-white/[0.06] shadow-md" 
            : "relative pb-3 pt-1"
          }
        `}
      >
        <SectionChips
          sections={SECTIONS}
          activeSection={activeSection}
          onSectionClick={handleSectionClick}
          isCompact={isChipsSticky}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Risk Overview
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={overviewRef} className="scroll-mt-36 pb-8">
        {/* Quick Summary Strip */}
        <div className="flex items-center gap-4 p-3 mb-4 bg-gradient-to-r from-slate-800/60 to-transparent rounded-xl border border-slate-700/30">
          <div className="flex-1 flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Available
              </span>
              <div className="text-lg font-bold text-cyan-400 font-mono">
                {availableLiquidity >= 1e6
                  ? `${(availableLiquidity / 1e6).toFixed(1)}M`
                  : availableLiquidity >= 1e3
                    ? `${(availableLiquidity / 1e3).toFixed(0)}K`
                    : availableLiquidity.toFixed(0)}
                <span className="text-xs text-slate-500 ml-1">{pool.asset}</span>
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Utilization
              </span>
              <div className={`text-lg font-bold font-mono ${getUtilizationColor(utilization)}`}>
                {utilization.toFixed(1)}%
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                Total Supply
              </span>
              <div className="text-lg font-bold text-white font-mono">
                {pool.state.supply >= 1e6
                  ? `${(pool.state.supply / 1e6).toFixed(1)}M`
                  : pool.state.supply >= 1e3
                    ? `${(pool.state.supply / 1e3).toFixed(0)}K`
                    : pool.state.supply.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <PoolRiskOutlook pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Liquidity
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={liquidityRef} className="scroll-mt-36 pb-8 border-t border-slate-700/30 pt-6">
        <LiquidityTab pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Concentration
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={concentrationRef} className="scroll-mt-36 pb-8 border-t border-slate-700/30 pt-6">
        <WhaleWatch
          poolId={pool.contracts?.marginPoolId}
          decimals={pool.contracts?.coinDecimals}
          asset={pool.asset}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Liquidations (Collapsible by default)
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={liquidationsRef} className="scroll-mt-36 pb-4 border-t border-slate-700/30 pt-6">
        <button
          onClick={() => setLiquidationsExpanded(!liquidationsExpanded)}
          className="w-full flex items-center justify-between p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl border border-slate-700/30 transition-colors mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/10">
              <svg
                className="w-5 h-5 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-base font-semibold text-white">
                Liquidation History
              </h3>
              <p className="text-xs text-slate-500">
                Historical liquidation events and bad debt analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {liquidationsExpanded ? "Collapse" : "Expand"}
            </span>
            {liquidationsExpanded ? (
              <ChevronUpIcon className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-slate-400" />
            )}
          </div>
        </button>

        {liquidationsExpanded && (
          <div className="animate-fade-in">
            <LiquidationWall
              poolId={pool.contracts?.marginPoolId}
              asset={pool.asset}
            />
          </div>
        )}
      </section>
    </div>
  );
}

export default RiskTab;
