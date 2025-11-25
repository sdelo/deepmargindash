import { useState } from "react";
import { TransactionDetailsModal } from "./TransactionDetailsModal";
import type { TransactionInfo } from "./types";

export interface TransactionInfoIconProps {
  transactionInfo: TransactionInfo;
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * A simple info icon that opens the transaction details modal.
 * This doesn't interrupt the transaction flow - it's just for users who want to review details first.
 */
export function TransactionInfoIcon({
  transactionInfo,
  className = "",
  size = "md",
}: TransactionInfoIconProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  }[size];

  return (
    <>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className={`inline-flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors ${className}`}
        aria-label="View transaction details"
        title="View transaction details"
        type="button"
      >
        <svg
          className={sizeClasses}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>

      <TransactionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onContinue={() => {
          // When opened from info icon, just close - user can click the main button to proceed
          setIsModalOpen(false);
        }}
        transactionInfo={transactionInfo}
      />
    </>
  );
}
