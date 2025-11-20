import React from "react";
import type { PoolOverview } from "../types";
import { useSuiClient } from "@mysten/dapp-kit";
import { MarginPool } from "../../../contracts/deepbook_margin/margin_pool";

interface LiquidityHealthCheckProps {
  pool: PoolOverview;
}

export function LiquidityHealthCheck({ pool }: LiquidityHealthCheckProps) {
  const suiClient = useSuiClient();
  const [vaultBalance, setVaultBalance] = React.useState<number | null>(null);
  const [isLoadingVault, setIsLoadingVault] = React.useState(true);

  // Fetch vault balance from on-chain object
  React.useEffect(() => {
    async function fetchVaultBalance() {
      try {
        const response = await suiClient.getObject({
          id: pool.contracts.marginPoolId,
          options: {
            showBcs: true,
          },
        });

        if (
          response.data &&
          response.data.bcs &&
          response.data.bcs.dataType === "moveObject"
        ) {
          const marginPool = MarginPool.fromBase64(response.data.bcs.bcsBytes);
          const vaultValue =
            Number(marginPool.vault.value) / 10 ** pool.contracts.coinDecimals;
          setVaultBalance(vaultValue);
        }
      } catch (error) {
        console.error("Error fetching vault balance:", error);
      } finally {
        setIsLoadingVault(false);
      }
    }

    fetchVaultBalance();
    // Refresh every 15 seconds
    const interval = setInterval(fetchVaultBalance, 15000);
    return () => clearInterval(interval);
  }, [pool.contracts.marginPoolId, pool.contracts.coinDecimals, suiClient]);

  // Calculate metrics
  const totalDeposits = pool.state.supply;
  const availableLiquidity = vaultBalance ?? pool.state.supply - pool.state.borrow;
  const lockedInLoans = pool.state.borrow;
  const utilizationPercent =
    totalDeposits > 0 ? (lockedInLoans / totalDeposits) * 100 : 0;
  const withdrawablePercent =
    totalDeposits > 0 ? (availableLiquidity / totalDeposits) * 100 : 0;

  // Determine health status
  const getHealthStatus = () => {
    if (utilizationPercent > 90)
      return {
        label: "Critical Risk",
        color: "red",
        icon: "🚨",
        message:
          "Very limited liquidity! Large withdrawals may not be possible.",
      };
    if (utilizationPercent > 75)
      return {
        label: "High Risk",
        color: "amber",
        icon: "⚠️",
        message:
          "Moderate liquidity available. Some withdrawal delays may occur.",
      };
    if (utilizationPercent > 50)
      return {
        label: "Moderate",
        color: "yellow",
        icon: "⚡",
        message: "Good liquidity available for most withdrawals.",
      };
    return {
      label: "Healthy",
      color: "green",
      icon: "✅",
      message: "Excellent liquidity! Withdrawals are highly accessible.",
    };
  };

  const healthStatus = getHealthStatus();

  return (
    <div className="space-y-6">
      {/* Main Health Indicator */}
      <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 rounded-3xl p-8 border border-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
              {healthStatus.icon} Can I Withdraw?
            </h2>
            <p className="text-sm text-white/60">
              Liquidity Health Check for {pool.asset}
            </p>
          </div>
          {isLoadingVault && (
            <div className="flex items-center gap-2 text-cyan-300 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-cyan-300 border-t-transparent rounded-full"></div>
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full mb-6 ${
            healthStatus.color === "green"
              ? "bg-green-500/20 text-green-300 border border-green-500/50"
              : healthStatus.color === "yellow"
              ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50"
              : healthStatus.color === "amber"
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
              : "bg-red-500/20 text-red-300 border border-red-500/50"
          }`}
        >
          <span className="text-2xl">{healthStatus.icon}</span>
          <span className="font-bold text-lg">{healthStatus.label}</span>
        </div>

        <p className="text-white/80 text-sm mb-6">{healthStatus.message}</p>

        {/* Visual Liquidity Breakdown */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-white/60">Available to Withdraw</span>
            <span className="text-green-300 font-bold text-lg">
              {withdrawablePercent.toFixed(1)}%
            </span>
          </div>

          {/* Visual Bar */}
          <div className="relative h-12 bg-white/5 rounded-xl overflow-hidden border border-white/10">
            {/* Available Liquidity (left side) */}
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 flex items-center justify-start px-4"
              style={{ width: `${withdrawablePercent}%` }}
            >
              {withdrawablePercent > 15 && (
                <span className="text-white font-bold text-xs whitespace-nowrap">
                  Available
                </span>
              )}
            </div>

            {/* Locked in Loans (right side) */}
            <div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-orange-500 transition-all duration-500 flex items-center justify-end px-4"
              style={{ width: `${utilizationPercent}%` }}
            >
              {utilizationPercent > 15 && (
                <span className="text-white font-bold text-xs whitespace-nowrap">
                  Locked
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-xs text-white/50">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Deposits */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">💎</span>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-white/60">Total Deposits</div>
            <div className="text-2xl font-bold text-white">
              {totalDeposits.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-xs text-cyan-300">{pool.asset}</div>
            <div className="text-xs text-white/40 mt-2">
              Total assets supplied to pool
            </div>
          </div>
        </div>

        {/* Available Liquidity (Vault Balance) */}
        <div className="bg-white/5 rounded-2xl p-6 border border-green-500/20 shadow-lg shadow-green-500/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🏦</span>
            {isLoadingVault && (
              <div className="animate-pulse h-2 w-2 rounded-full bg-green-400"></div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm text-green-300/80 font-semibold">
              Available to Withdraw
            </div>
            <div className="text-2xl font-bold text-green-300">
              {isLoadingVault ? (
                <div className="h-8 w-32 bg-white/10 rounded animate-pulse"></div>
              ) : (
                availableLiquidity.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })
              )}
            </div>
            <div className="text-xs text-green-400">{pool.asset}</div>
            <div className="text-xs text-white/40 mt-2">
              Free assets in vault (not loaned out)
            </div>
          </div>
        </div>

        {/* Locked in Loans */}
        <div className="bg-white/5 rounded-2xl p-6 border border-orange-500/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-3xl">🔒</span>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-orange-300/80 font-semibold">
              Locked in Loans
            </div>
            <div className="text-2xl font-bold text-orange-300">
              {lockedInLoans.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="text-xs text-orange-400">{pool.asset}</div>
            <div className="text-xs text-white/40 mt-2">
              Assets borrowed by traders
            </div>
          </div>
        </div>
      </div>

      {/* Utilization Breakdown */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-bold text-cyan-200 mb-4 flex items-center gap-2">
          <span>📊</span> Utilization Breakdown
        </h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Current Utilization</span>
            <span className="text-white font-bold text-xl">
              {utilizationPercent.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">Max Allowed Utilization</span>
            <span className="text-amber-300 font-semibold">
              {(
                pool.protocolConfig.margin_pool_config.max_utilization_rate *
                100
              ).toFixed(2)}
              %
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-white/70">Buffer Remaining</span>
            <span
              className={`font-semibold ${
                pool.protocolConfig.margin_pool_config.max_utilization_rate *
                  100 -
                  utilizationPercent <
                10
                  ? "text-red-300"
                  : "text-green-300"
              }`}
            >
              {(
                pool.protocolConfig.margin_pool_config.max_utilization_rate *
                  100 -
                utilizationPercent
              ).toFixed(2)}
              %
            </span>
          </div>
        </div>

        {/* Warning if near max utilization */}
        {utilizationPercent >
          pool.protocolConfig.margin_pool_config.max_utilization_rate * 90 && (
          <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="font-semibold text-amber-300 mb-1">
                  Near Maximum Utilization
                </div>
                <div className="text-xs text-white/60">
                  The pool is approaching its maximum utilization limit. New
                  borrows may be restricted, but withdrawals are still possible
                  based on available liquidity.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* What This Means */}
      <div className="bg-indigo-900/20 rounded-2xl p-6 border border-indigo-500/30">
        <h3 className="text-lg font-bold text-indigo-300 mb-3 flex items-center gap-2">
          <span>💡</span> What This Means
        </h3>
        <div className="space-y-3 text-sm text-white/70">
          <div className="flex gap-3">
            <span className="text-green-400 font-bold shrink-0">✓</span>
            <div>
              <span className="font-semibold text-white">
                Available Liquidity:
              </span>{" "}
              You can withdraw up to{" "}
              <span className="text-green-300 font-bold">
                {availableLiquidity.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}{" "}
                {pool.asset}
              </span>{" "}
              immediately without waiting for loan repayments.
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-orange-400 font-bold shrink-0">ⓘ</span>
            <div>
              <span className="font-semibold text-white">Locked Funds:</span>{" "}
              {lockedInLoans.toLocaleString(undefined, {
                maximumFractionDigits: 0,
              })}{" "}
              {pool.asset} is currently borrowed by traders. These funds will
              become available as loans are repaid.
            </div>
          </div>

          <div className="flex gap-3">
            <span className="text-cyan-400 font-bold shrink-0">→</span>
            <div>
              <span className="font-semibold text-white">
                Withdrawal Strategy:
              </span>{" "}
              {utilizationPercent > 85
                ? "Consider withdrawing in smaller amounts or waiting for more repayments."
                : "Liquidity is healthy. Most withdrawal requests can be fulfilled immediately."}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

