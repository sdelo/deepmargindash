import React from "react";
import { SectionChips, type SectionConfig } from "../../../components/SectionChips";
import YieldCurve from "./YieldCurve";
import { APYHistory } from "./APYHistory";
import { BackedMarketsTab } from "./BackedMarketsTab";
import type { PoolOverview } from "../types";

interface YieldTabProps {
  pool: PoolOverview;
  pools: PoolOverview[];
  onShowInterestHistory: () => void;
  onMarketClick: (poolId: string) => void;
}

const SECTIONS: SectionConfig[] = [
  { id: "rates", label: "Rate Model" },
  { id: "history", label: "APY History" },
  { id: "markets", label: "Markets" },
];

/**
 * Consolidated Yield tab combining:
 * - Rate Model (utilization → supply/borrow curve)
 * - APY History (Supply APY, Borrow APY, Utilization over time)
 * - Markets / Deployment (where funds are used, exposures)
 */
export function YieldTab({
  pool,
  pools,
  onShowInterestHistory,
  onMarketClick,
}: YieldTabProps) {
  const [activeSection, setActiveSection] = React.useState("rates");
  const [isChipsSticky, setIsChipsSticky] = React.useState(false);
  
  // Refs for each section
  const ratesRef = React.useRef<HTMLDivElement>(null);
  const historyRef = React.useRef<HTMLDivElement>(null);
  const marketsRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    rates: ratesRef,
    history: historyRef,
    markets: marketsRef,
  };

  // Scroll to section when clicking chips
  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
    const ref = sectionRefs[sectionId];
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
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
          SECTION: Rate Model
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={ratesRef} className="scroll-mt-36 pb-8">
        {/* Section Summary Strip */}
        <div className="flex items-center gap-4 p-3 mb-4 bg-gradient-to-r from-[#2dd4bf]/5 to-transparent rounded-xl border border-[#2dd4bf]/10">
          <div className="flex-1 flex items-center gap-6">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Supply APY</span>
              <div className="text-lg font-bold text-[#2dd4bf] font-mono">
                {pool.ui?.aprSupplyPct?.toFixed(2) || "0.00"}%
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Borrow APY</span>
              <div className="text-lg font-bold text-amber-400 font-mono">
                {pool.ui?.aprBorrowPct?.toFixed(2) || "0.00"}%
              </div>
            </div>
            <div className="w-px h-8 bg-slate-700/50" />
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">Utilization</span>
              <div className="text-lg font-bold text-white font-mono">
                {pool.state.supply > 0
                  ? ((pool.state.borrow / pool.state.supply) * 100).toFixed(1)
                  : "0.0"}%
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">Interest Rate Model</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                How rates change with utilization
              </p>
            </div>
            <button
              onClick={onShowInterestHistory}
              className="text-xs text-[#2dd4bf] hover:text-[#5eead4] transition-colors"
            >
              View History →
            </button>
          </div>
          
          <YieldCurve pool={pool} onShowHistory={onShowInterestHistory} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: APY History
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={historyRef} className="scroll-mt-36 pb-8 border-t border-slate-700/30 pt-6">
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">APY History</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Historical rates and utilization trends
          </p>
        </div>
        
        <APYHistory pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Markets / Deployment
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={marketsRef} className="scroll-mt-36 pb-4 border-t border-slate-700/30 pt-6">
        <BackedMarketsTab
          pool={pool}
          pools={pools}
          onMarketClick={onMarketClick}
        />
      </section>
    </div>
  );
}

export default YieldTab;
