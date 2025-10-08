import React from "react";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import type { CoinBalance } from "@mysten/sui/client";

import { formatCoin } from "../utils/formatCoin";

export type CoinBalanceResult = {
  raw: string;
  formatted: string;
};

export function useCoinBalance(
  owner: string | undefined,
  coinType: string,
  decimals: number
) {
  const { data } = useSuiClientQuery(
    "getBalance",
    {
      owner: owner ?? "",
      coinType,
    },
    {
      enabled: Boolean(owner),
      select: React.useCallback(
        (balance: CoinBalance | null) => {
          if (!balance) return undefined;
          return {
            raw: balance.totalBalance,
            formatted: formatCoin(balance.totalBalance, decimals),
          } satisfies CoinBalanceResult;
        },
        [decimals]
      ),
    }
  );

  return data;
}

