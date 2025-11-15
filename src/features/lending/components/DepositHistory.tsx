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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cyan-200">
          Deposit / Withdraw History
        </h3>
        <div className="text-cyan-100/80 text-sm">Loading transaction history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cyan-200">
          Deposit / Withdraw History
        </h3>
        <div className="text-red-400 text-sm">Error loading transaction history. Please try again.</div>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cyan-200">
          Deposit / Withdraw History
        </h3>
        <div className="text-cyan-100/80 text-sm">Connect your wallet to view your transaction history.</div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-cyan-200">
          Deposit / Withdraw History
        </h3>
        <div className="text-cyan-100/80 text-sm">No transactions found for this address.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-cyan-200">
        Deposit / Withdraw History
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-cyan-100/70">
            <tr className="text-left">
              <th className="py-2 pr-4">Time</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Asset</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Shares</th>
              <th className="py-2 pr-4">Transaction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                <td className="py-2 pr-4">
                  {new Date(tx.timestamp).toLocaleString()}
                </td>
                <td className="py-2 pr-4">
                  <span className={`capitalize ${
                    tx.type === 'supply' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="py-2 pr-4">{tx.assetType.includes('SUI') ? 'SUI' : 'DBUSDC'}</td>
                <td className="py-2 pr-4">{tx.formattedAmount}</td>
                <td className="py-2 pr-4">{tx.shares.toLocaleString()}</td>
                <td className="py-2 pr-4">
                  <a
                    href={getExplorerUrl(tx.transactionDigest)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-300 hover:text-cyan-200 underline text-xs"
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















