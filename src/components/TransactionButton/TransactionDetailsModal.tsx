import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { TransactionDetailsModalProps } from "./types";

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function TransactionDetailsModal({
  isOpen,
  onClose,
  onContinue,
  transactionInfo,
}: TransactionDetailsModalProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleContinue = () => {
    onClose();
    onContinue();
  };

  const modal = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-[fadeIn_200ms_ease-out]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[#050c1d] border border-cyan-400/50 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] max-w-[360px] w-full mx-4 max-h-[90vh] overflow-y-auto pointer-events-auto animate-[modalEnter_200ms_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-7 pb-5 border-b border-white/10">
            <h2 className="text-xl font-semibold text-cyan-200 flex items-center gap-2">
              🔍 Transaction Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <div className="p-7 space-y-6">
            {/* Action Summary */}
            <div className="bg-white/10 rounded-xl p-5 border border-white/15">
              <h3 className="text-lg font-medium text-white mb-3">
                You're about to:{" "}
                <span className="text-cyan-300">{transactionInfo.action}</span>
              </h3>

              {/* Arguments Display */}
              {transactionInfo.arguments &&
                transactionInfo.arguments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {transactionInfo.arguments.map((arg, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-gray-400 font-medium">
                          {arg.name}:
                        </span>
                        <span className="text-white font-mono">
                          {arg.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Contract Information */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Contract Information
              </h4>

              <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Package:</div>
                  <div className="font-mono text-sm text-white break-all">
                    {truncateAddress(transactionInfo.packageId)}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-400 mb-1">Function:</div>
                  <div className="font-mono text-sm text-cyan-300">
                    {transactionInfo.module}::{transactionInfo.function}
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-start gap-2">
                    <span className="text-base">📝</span>
                    <div>
                      <div className="text-xs text-gray-400 mb-2">
                        What this does:
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {transactionInfo.summary}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Source Code Link */}
                <div className="pt-3">
                  <a
                    href={transactionInfo.sourceCodeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors inline-flex items-center gap-1.5 font-medium"
                  >
                    <span>View source code on SuiVision</span>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Click module{" "}
                    <span className="font-mono text-gray-300">
                      {transactionInfo.module}
                    </span>
                    , then search for function{" "}
                    <span className="font-mono text-gray-300">
                      {transactionInfo.function}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Box */}
            <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-emerald-300 mb-3 flex items-center gap-2">
                <span>✓</span> Verify in Your Wallet
              </h4>
              <p className="text-sm text-gray-200 mb-2 font-medium">
                In your wallet, go to:{" "}
                <span className="text-cyan-300">Transactions → MoveCall</span>
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Then verify these details match:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 font-bold">1.</span>
                  <span className="text-gray-200">
                    <strong>Package:</strong>{" "}
                    <span className="font-mono text-white block mt-0.5">
                      {truncateAddress(transactionInfo.packageId)}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 font-bold">2.</span>
                  <span className="text-gray-200">
                    <strong>Module:</strong>{" "}
                    <span className="font-mono text-cyan-300 block mt-0.5">
                      {transactionInfo.module}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5 font-bold">3.</span>
                  <span className="text-gray-200">
                    <strong>Function:</strong>{" "}
                    <span className="font-mono text-cyan-300 block mt-0.5">
                      {transactionInfo.function}
                    </span>
                  </span>
                </li>
                {transactionInfo.arguments &&
                  transactionInfo.arguments.slice(0, 2).map((arg, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">
                        {idx + 4}.
                      </span>
                      <span className="text-gray-200">
                        <strong>{arg.name}:</strong>{" "}
                        <span className="font-mono text-white block mt-0.5">
                          {arg.value}
                        </span>
                      </span>
                    </li>
                  ))}
              </ul>

              {/* Warning */}
              <div className="mt-4 bg-amber-500/25 border border-amber-500/50 rounded-lg p-3 flex items-start gap-2">
                <span className="text-amber-300 text-base flex-shrink-0">
                  ⚠️
                </span>
                <p className="text-xs text-amber-100 font-semibold leading-relaxed">
                  If these don't match what your wallet shows, DO NOT APPROVE
                  the transaction
                </p>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 p-7 pt-0">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border border-white/20 text-gray-300 hover:bg-white/5 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className="flex-1 px-6 py-3 rounded-lg bg-cyan-400 text-slate-900 hover:bg-cyan-300 transition-colors font-semibold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            >
              <span>Continue to Wallet</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
