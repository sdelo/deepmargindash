import type { FC } from "react";
import { getSyntheticHistory } from "../../../data/synthetic/history";

type Props = { address?: string | null };

export const DepositHistory: FC<Props> = ({ address }) => {
  const rows = getSyntheticHistory(address);
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-cyan-200">
        Deposit / Withdraw History
      </h3>
      <table className="w-full text-sm">
        <thead className="text-cyan-100/70">
          <tr className="text-left">
            <th className="py-2 pr-4">Time</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Asset</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Shares</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {rows.map((r, i) => (
            <tr key={i} className="hover:bg-white/5">
              <td className="py-2 pr-4">
                {new Date(r.timestamp * 1000).toLocaleString()}
              </td>
              <td className="py-2 pr-4 capitalize">{r.kind}</td>
              <td className="py-2 pr-4">{r.asset}</td>
              <td className="py-2 pr-4">{r.amount.toLocaleString()}</td>
              <td className="py-2 pr-4">{r.shares.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DepositHistory;















