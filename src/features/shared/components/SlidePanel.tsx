import React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  width?: number | string; // e.g., 420 or '50vw'
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
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[80] transition ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "color-mix(in oklab, black 50%, transparent)" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full z-[90] bg-[rgba(17,24,39,0.8)] backdrop-blur border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out`}
        style={{
          width,
          transform: open ? "translateX(0)" : `translateX(100%)`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/10">
          <div className="text-cyan-200 font-semibold">{title}</div>
          <button className="pill" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-56px)]">
          {children}
        </div>
      </div>
    </>
  );
}
