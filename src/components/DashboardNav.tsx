import React, { useState, useEffect } from "react";

interface DashboardNavProps {
  className?: string;
}

const NAV_ITEMS = [
  { id: "pools-deposit", label: "Pools & Deposit", icon: "🏊" },
  { id: "yield-interest", label: "Yield & Interest", icon: "📈" },
  { id: "depositors", label: "Depositors", icon: "👥" },
  { id: "activity", label: "Activity", icon: "📊" },
  { id: "fees", label: "Fees & Liquidations", icon: "💰" },
];

export function DashboardNav({ className = "" }: DashboardNavProps) {
  const [activeSection, setActiveSection] = useState<string>("pools-deposit");

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
