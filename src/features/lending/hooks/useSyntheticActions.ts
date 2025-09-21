import { useCallback } from 'react';

// For now, just simulate actions by logging. Later wire SUI SDK.
export function useSyntheticActions() {
  const deposit = useCallback((poolId: string, amount: number) => {
    console.log('[synthetic] deposit', { poolId, amount });
  }, []);

  const withdrawAll = useCallback((poolId: string) => {
    console.log('[synthetic] withdraw all', { poolId });
  }, []);

  return { deposit, withdrawAll };
}


