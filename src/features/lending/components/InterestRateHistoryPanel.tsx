import React from "react";
import { ClockIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useInterestRateHistory } from "../hooks/useEvents";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import type { PoolOverview } from "../types";

interface InterestRateHistoryPanelProps {
  poolId?: string;
  poolName?: string;
  onClose: () => void;
  currentPool?: PoolOverview; // Current on-chain pool data for comparison
}

export function InterestRateHistoryPanel({
  poolId,
  poolName,
  onClose,
  currentPool,
}: InterestRateHistoryPanelProps) {
  const { data: events, isLoading, error } = useInterestRateHistory(poolId);
  const [selectedConfig, setSelectedConfig] = React.useState<any>(null);

  // Filter events with valid interest_config or config_json
  const validEvents = React.useMemo(
    () => events.filter((event) => event.config_json || event.interest_config),
    [events]
  );

  // Convert 9-decimal values to percentages and decimal format
  const formatPercent = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return ((num / 1e9) * 100).toFixed(2);
  };

  const toDecimal = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num / 1e9;
  };

  // Generate yield curve data for a given config
  const generateCurveData = (config: any) => {
    const baseRate = toDecimal(config.base_rate);
    const baseSlope = toDecimal(config.base_slope);
    const optimalU = toDecimal(config.optimal_utilization);
    const excessSlope = toDecimal(config.excess_slope);

    const steps = 20;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const u = i / steps;
      const apr =
        u <= optimalU
          ? baseRate + baseSlope * u
          : baseRate + baseSlope * optimalU + excessSlope * (u - optimalU);
      return {
        utilization: Math.round(u * 100),
        apr: apr * 100, // Convert to percentage
        optimalU: optimalU * 100,
      };
    });
  };

  // Get current config from on-chain pool data
  const currentConfig = currentPool?.protocolConfig?.interest_config;

  // Display current config or selected historical config
  const displayConfig =
    selectedConfig ||
    (currentConfig && {
      base_rate: currentConfig.base_rate * 1e9,
      base_slope: currentConfig.base_slope * 1e9,
      optimal_utilization: currentConfig.optimal_utilization * 1e9,
      excess_slope: currentConfig.excess_slope * 1e9,
      isCurrent: true,
    });

  const curveData = displayConfig ? generateCurveData(displayConfig) : null;

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #0c1a24 0%, #0a1419 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 md:p-6 border-b border-cyan-500/20">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-cyan-100">
            Interest Rate Parameter History
          </h2>
          {poolName && (
            <p className="text-sm text-cyan-200/60 mt-1">Pool: {poolName}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-cyan-500/10 border border-cyan-500/20 transition-colors md:hidden"
        >
          <XMarkIcon className="w-6 h-6 text-cyan-200" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top half - Historical Events List (Scrollable) */}
        <div className="flex-1 overflow-auto p-4 md:p-6 border-b border-cyan-500/20 max-h-[50vh]">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-cyan-100 text-lg">Loading history...</div>
            </div>
          )}

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4">
              <p className="text-rose-400">
                Error loading history: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && validEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <ClockIcon className="w-16 h-16 text-cyan-400/30 mb-4" />
              <p className="text-cyan-100 text-lg font-semibold">
                No Parameter Updates Yet
              </p>
              <p className="text-cyan-200/50 text-sm mt-2 max-w-md">
                This pool is currently using its initial interest rate
                configuration. Updates will appear here when administrators
                modify the interest rate parameters.
              </p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="space-y-4">
              {/* Current Configuration Card (from on-chain data) */}
              {currentConfig && (
                <div
                  onClick={() =>
                    setSelectedConfig({
                      base_rate: currentConfig.base_rate * 1e9,
                      base_slope: currentConfig.base_slope * 1e9,
                      optimal_utilization:
                        currentConfig.optimal_utilization * 1e9,
                      excess_slope: currentConfig.excess_slope * 1e9,
                      isCurrent: true,
                    })
                  }
                  className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                    selectedConfig?.isCurrent || !selectedConfig
                      ? "bg-emerald-500/10 border-emerald-400/40"
                      : "bg-cyan-900/20 border-cyan-500/20 hover:bg-cyan-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-400">
                          Current Configuration
                        </div>
                        <div className="text-xs text-white/50">
                          Active on-chain parameters
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  </div>

                  {/* Parameters Grid */}
                  <div className="bg-cyan-900/20 rounded-lg p-3 border border-cyan-500/10">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-cyan-200/40">
                          Base Rate
                        </div>
                        <div className="text-lg font-bold text-cyan-100">
                          {(currentConfig.base_rate * 100).toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-cyan-200/40">
                          Base Slope
                        </div>
                        <div className="text-lg font-bold text-cyan-100">
                          {(currentConfig.base_slope * 100).toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-cyan-200/40">
                          Optimal Utilization
                        </div>
                        <div className="text-lg font-bold text-cyan-100">
                          {(currentConfig.optimal_utilization * 100).toFixed(2)}
                          %
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-cyan-200/40">
                          Excess Slope
                        </div>
                        <div className="text-lg font-bold text-cyan-100">
                          {(currentConfig.excess_slope * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Events */}
              {validEvents.length > 0 && (
                <>
                  <div className="text-xs text-cyan-200/40 uppercase tracking-wider font-semibold pt-2">
                    Historical Updates
                  </div>
                  {validEvents.map((event, index) => {
                    // Use config_json as primary field, fall back to interest_config
                    const config = event.config_json || event.interest_config!;
                    const isSelected =
                      selectedConfig &&
                      !selectedConfig.isCurrent &&
                      selectedConfig.timestamp ===
                        event.checkpoint_timestamp_ms;

                    return (
                      <div
                        key={event.event_digest}
                        onClick={() =>
                          setSelectedConfig({
                            ...config,
                            timestamp: event.checkpoint_timestamp_ms,
                            isCurrent: false,
                          })
                        }
                        className={`relative rounded-xl border p-4 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-teal-400/40"
                            : "bg-cyan-900/20 border-cyan-500/20 hover:bg-cyan-900/30"
                        }`}
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-1.5 top-6 w-3 h-3 rounded-full bg-cyan-400 border-2 border-[#0c1a24]" />

                        {/* Timestamp */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            </div>
                            <div>
                              <div
                                className={`font-semibold ${isSelected ? "text-teal-400" : "text-cyan-400"}`}
                              >
                                Interest Rate Update
                              </div>
                              <div className="text-xs text-white/50">
                                {new Date(
                                  event.checkpoint_timestamp_ms
                                ).toLocaleString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                •{" "}
                                {(() => {
                                  const diff =
                                    Date.now() - event.checkpoint_timestamp_ms;
                                  const days = Math.floor(
                                    diff / (1000 * 60 * 60 * 24)
                                  );
                                  if (days > 0)
                                  return `${days} day${days > 1 ? "s" : ""} ago`;
                                const hours = Math.floor(
                                  diff / (1000 * 60 * 60)
                                );
                                if (hours > 0)
                                  return `${hours} hour${hours > 1 ? "s" : ""} ago`;
                                return "Just now";
                              })()}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-cyan-200/40">
                          {new Date(
                            event.checkpoint_timestamp_ms
                          ).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Parameters Grid */}
                      <div className="ml-0 md:ml-10 bg-cyan-900/20 rounded-lg p-3 border border-cyan-500/10">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-cyan-200/40">
                              Base Rate
                            </div>
                            <div className="text-lg font-bold text-cyan-100">
                              {formatPercent(config.base_rate)}%
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-cyan-200/40">
                              Base Slope
                            </div>
                            <div className="text-lg font-bold text-cyan-100">
                              {formatPercent(config.base_slope)}%
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-cyan-200/40">
                              Optimal Utilization
                            </div>
                            <div className="text-lg font-bold text-cyan-100">
                              {formatPercent(config.optimal_utilization)}%
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-cyan-200/40">
                              Excess Slope
                            </div>
                            <div className="text-lg font-bold text-cyan-100">
                              {formatPercent(config.excess_slope)}%
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer Info */}
                      <div className="ml-0 md:ml-10 mt-2">
                        <div className="text-xs text-cyan-200/40">
                          Checkpoint: {event.checkpoint.toLocaleString()} •{" "}
                          {event.event_digest.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom half - Yield Curve Visualization */}
        <div className="p-4 md:p-6 bg-[#081114]/50 overflow-auto">
          <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-cyan-100 mb-1">
                  {displayConfig?.isCurrent ? "Current" : "Historical"} Yield
                  Curve
                </h3>
                <p className="text-cyan-200/50 text-sm">
                  Visual representation of interest rate vs utilization
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          {curveData && (
            <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-4 md:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart
                  data={curveData}
                  margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="utilization"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                    label={{
                      value: "Utilization %",
                      position: "insideBottom",
                      offset: -10,
                      fill: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    dataKey="apr"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                    label={{
                      value: "Borrow APR %",
                      angle: -90,
                      position: "insideLeft",
                      fill: "rgba(255,255,255,0.7)",
                      fontSize: 12,
                    }}
                    domain={[0, "auto"]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(0,0,0,0.9)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [
                      `${value.toFixed(2)}%`,
                      "Borrow APR",
                    ]}
                    labelFormatter={(label) => `Utilization: ${label}%`}
                  />
                  <ReferenceLine
                    x={curveData[0].optimalU}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    label={{
                      value: "Optimal",
                      position: "top",
                      fill: "#f59e0b",
                      fontSize: 11,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="apr"
                    stroke={displayConfig?.isCurrent ? "#10b981" : "#f59e0b"}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 text-sm">
                <div className="bg-cyan-900/30 rounded-lg p-2 md:p-3 border border-cyan-500/10">
                  <div className="text-cyan-200/40 text-xs mb-1">Base Rate</div>
                  <div className="text-cyan-100 font-bold text-sm md:text-base">
                    {formatPercent(displayConfig.base_rate)}%
                  </div>
                </div>
                <div className="bg-cyan-900/30 rounded-lg p-2 md:p-3 border border-cyan-500/10">
                  <div className="text-cyan-200/40 text-xs mb-1">Base Slope</div>
                  <div className="text-cyan-100 font-bold text-sm md:text-base">
                    {formatPercent(displayConfig.base_slope)}%
                  </div>
                </div>
                <div className="bg-cyan-900/30 rounded-lg p-2 md:p-3 border border-cyan-500/10">
                  <div className="text-cyan-200/40 text-xs mb-1">Optimal Util</div>
                  <div className="text-cyan-100 font-bold text-sm md:text-base">
                    {formatPercent(displayConfig.optimal_utilization)}%
                  </div>
                </div>
                <div className="bg-cyan-900/30 rounded-lg p-2 md:p-3 border border-cyan-500/10">
                  <div className="text-cyan-200/40 text-xs mb-1">Excess Slope</div>
                  <div className="text-cyan-100 font-bold text-sm md:text-base">
                    {formatPercent(displayConfig.excess_slope)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {!curveData && (
            <div className="bg-cyan-900/20 border border-cyan-500/20 rounded-xl p-12 text-center">
              <p className="text-lg text-cyan-100/50 mb-2">
                Select a configuration to view its yield curve
              </p>
              <p className="text-sm text-cyan-200/30">
                Click on any configuration card above to visualize its interest
                rate model
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
