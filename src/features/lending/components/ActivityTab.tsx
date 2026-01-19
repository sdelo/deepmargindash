import React from "react";
import { SectionChips, type SectionConfig } from "../../../components/SectionChips";
import { PoolActivity } from "./PoolActivity";
import { BorrowRepayActivity } from "./BorrowRepayActivity";
import { UnifiedEventFeed } from "./UnifiedEventFeed";
import { WhaleComposition } from "./WhaleComposition";
import type { PoolOverview } from "../types";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

interface ActivityTabProps {
  pool: PoolOverview;
}

const SECTIONS: SectionConfig[] = [
  { id: "supply-withdraw", label: "Supply & Withdraw" },
  { id: "borrow-repay", label: "Borrow & Repay" },
  { id: "event-feed", label: "Event Feed" },
  { id: "composition", label: "Whale Watch" },
];

/**
 * Consolidated Activity tab showing:
 * - Supply/Withdraw flows (TVL changes)
 * - Borrow/Repay activity (debt changes, utilization drivers)
 * - Unified on-chain event feed (all events with filters + tx links)
 * - Whale/composition views (size buckets, inflow/outflow, churn)
 * 
 * Each section includes "What This Tells You" interpretation guides.
 */
export function ActivityTab({ pool }: ActivityTabProps) {
  const [activeSection, setActiveSection] = React.useState("supply-withdraw");
  const [isChipsSticky, setIsChipsSticky] = React.useState(false);

  // Refs for each section
  const supplyWithdrawRef = React.useRef<HTMLDivElement>(null);
  const borrowRepayRef = React.useRef<HTMLDivElement>(null);
  const eventFeedRef = React.useRef<HTMLDivElement>(null);
  const compositionRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    "supply-withdraw": supplyWithdrawRef,
    "borrow-repay": borrowRepayRef,
    "event-feed": eventFeedRef,
    composition: compositionRef,
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

  // Quick summary for the header strip
  const utilization = pool.state.supply > 0
    ? (pool.state.borrow / pool.state.supply) * 100
    : 0;

  const formatNumber = (num: number) => {
    if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(0) + "K";
    return num.toFixed(0);
  };

  return (
    <div className="space-y-0">
      {/* Sentinel element: when this scrolls out of view, chips become sticky */}
      <div ref={sentinelRef} className="h-0" aria-hidden="true" />

      {/* Section Navigation - Smart Sticky */}
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
          Quick Summary Strip
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-4 p-3 mb-4 bg-gradient-to-r from-slate-800/60 to-transparent rounded-xl border border-slate-700/30">
        <div className="flex-1 flex items-center gap-6">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              TVL
            </span>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {formatNumber(pool.state.supply)}
              <span className="text-xs text-slate-500 ml-1">{pool.asset}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Borrowed
            </span>
            <div className="text-lg font-bold text-amber-400 font-mono">
              {formatNumber(pool.state.borrow)}
              <span className="text-xs text-slate-500 ml-1">{pool.asset}</span>
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Utilization
            </span>
            <div className={`text-lg font-bold font-mono ${
              utilization > 80 ? "text-red-400" : utilization > 50 ? "text-amber-400" : "text-emerald-400"
            }`}>
              {utilization.toFixed(1)}%
            </div>
          </div>
          <div className="w-px h-8 bg-slate-700/50" />
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">
              Available
            </span>
            <div className="text-lg font-bold text-white font-mono">
              {formatNumber(pool.state.supply - pool.state.borrow)}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Supply & Withdraw Activity
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={supplyWithdrawRef} className="scroll-mt-36 pb-8">
        <PoolActivity pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Borrow & Repay Activity
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={borrowRepayRef} className="scroll-mt-36 pb-8 border-t border-slate-700/30 pt-6">
        <BorrowRepayActivity pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Unified Event Feed
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={eventFeedRef} className="scroll-mt-36 pb-8 border-t border-slate-700/30 pt-6">
        <UnifiedEventFeed pool={pool} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION: Whale & Composition
      ═══════════════════════════════════════════════════════════════════ */}
      <section ref={compositionRef} className="scroll-mt-36 pb-4 border-t border-slate-700/30 pt-6">
        <WhaleComposition pool={pool} />
      </section>
    </div>
  );
}

export default ActivityTab;
