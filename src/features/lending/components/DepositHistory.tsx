import type { FC } from "react";
import React from "react";
import { useUserActivity } from "../hooks/useUserActivity";
import { CONTRACTS } from "../../../config/contracts";

type Props = { address?: string | null; poolId?: string };

export const DepositHistory: FC<Props> = ({ address, poolId }) => {
  const { transactions, isLoading, error } = useUserActivity(address || undefined, poolId);

  // Get Sui explorer URL based on network
  const getExplorerUrl = (digest: string) => {
    // Default to testnet explorer
    return `https://suiexplorer.com/txblock/${digest}?network=testnet`;
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-white/70 text-sm">Loading transaction history...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">Error loading transaction history. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-white/60 text-sm">Connect your wallet to view your transaction history.</p>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-white/60 text-sm">No transactions found for this address.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className={`text-sm font-semibold capitalize ${
                tx.type === 'supply' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {tx.type}
              </span>
              <span className="text-xs text-white/40">
                {new Date(tx.timestamp).toLocaleDateString()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-white/40 text-xs mb-1">Asset</div>
                <div className="text-white">{tx.assetType.includes('SUI') ? 'SUI' : 'DBUSDC'}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Amount</div>
                <div className="text-white">{tx.formattedAmount}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Shares</div>
                <div className="text-white">{tx.shares.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-white/40 text-xs mb-1">Transaction</div>
                <a
                  href={getExplorerUrl(tx.transactionDigest)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-sm"
                >
                  View →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/50 border-b border-white/10">
              <th className="py-3 pr-4 font-medium">Time</th>
              <th className="py-3 pr-4 font-medium">Type</th>
              <th className="py-3 pr-4 font-medium">Asset</th>
              <th className="py-3 pr-4 font-medium">Amount</th>
              <th className="py-3 pr-4 font-medium">Shares</th>
              <th className="py-3 pr-4 font-medium">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="py-3 pr-4 text-white/80">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
                <td className="py-3 pr-4">
                  <span className={`capitalize font-medium ${
                    tx.type === 'supply' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-3 pr-4 text-white">{tx.assetType.includes('SUI') ? 'SUI' : 'DBUSDC'}</td>
                <td className="py-3 pr-4 text-white font-medium">{tx.formattedAmount}</td>
                <td className="py-3 pr-4 text-white/80">{tx.shares.toLocaleString()}</td>
                <td className="py-3 pr-4">
                  <a
                    href={getExplorerUrl(tx.transactionDigest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepositHistory;
