import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  width?: number | string; // e.g., 420 or '50vw' - only applies on desktop
  children: React.ReactNode;
  title?: string;
};

export default function SlidePanel({
  open,
  onClose,
  width = "50vw",
  children,
  title,
}: Props) {
  // Prevent body scroll when panel is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Mobile Bottom Sheet (< md) */}
      <div
        className={`
          md:hidden fixed inset-x-0 bottom-0 z-[90] 
          bg-slate-900 rounded-t-2xl border-t border-white/10 shadow-2xl 
          transition-transform duration-300 ease-out flex flex-col
          max-h-[90vh]
        `}
        style={{
          transform: open ? "translateY(0)" : "translateY(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag Handle */}
        <div className="flex-shrink-0 py-3 flex justify-center" onClick={onClose}>
          <div className="w-10 h-1 bg-white/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between border-b border-white/10">
          <div className="text-white font-semibold text-lg truncate pr-4">{title}</div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/15 text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </div>

      {/* Desktop Right Panel (>= md) */}
      <div
        className={`
          hidden md:flex fixed top-0 right-0 h-full z-[90] 
          bg-slate-900 border-l border-white/10 shadow-2xl 
          transition-transform duration-300 ease-out flex-col
        `}
        style={{
          maxWidth: "100vw",
          width: typeof width === "number" ? `${width}px` : width,
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 flex items-center justify-between border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
          <div className="text-white font-semibold text-lg truncate pr-4">{title}</div>
          <button
            onClick={onClose}
            className="flex-shrink-0 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    </>
  );
}
