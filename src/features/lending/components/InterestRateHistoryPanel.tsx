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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Interest Rate Parameter History
          </h2>
          {poolName && (
            <p className="text-sm text-indigo-300/80 mt-1">Pool: {poolName}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
        >
          <XMarkIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Top half - Historical Events List (Scrollable) */}
        <div className="flex-1 overflow-auto p-6 border-b border-white/10 max-h-[50vh]">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-white text-lg">Loading history...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">
                Error loading history: {error.message}
              </p>
            </div>
          )}

          {!isLoading && !error && validEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <ClockIcon className="w-16 h-16 text-indigo-300/50 mb-4" />
              <p className="text-white text-lg font-semibold">
                No Parameter Updates Yet
              </p>
              <p className="text-indigo-300/60 text-sm mt-2 max-w-md">
                This pool is currently using its initial interest rate
                configuration. Updates will appear here when administrators
                modify the interest rate parameters.
              </p>
              <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-400/30 rounded-lg max-w-md">
                <p className="text-cyan-300 text-xs">
                  <strong>Tip:</strong> The current interest rate configuration
                  is visible in the pool's Yield Curve chart and analytics
                  panels on the main dashboard.
                </p>
              </div>
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
                      ? "bg-green-500/10 border-green-400/40 shadow-lg ring-2 ring-green-400/20"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">🟢</span>
                      <div>
                        <div className="font-semibold text-green-400">
                          Current Configuration
                        </div>
                        <div className="text-xs text-indigo-200/60">
                          Active on-chain parameters
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                      ACTIVE
                    </span>
                  </div>

                  {/* Parameters Grid */}
                  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-indigo-200/60">
                          Base Rate
                        </div>
                        <div className="text-lg font-bold text-white">
                          {(currentConfig.base_rate * 100).toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-indigo-200/60">
                          Base Slope
                        </div>
                        <div className="text-lg font-bold text-white">
                          {(currentConfig.base_slope * 100).toFixed(2)}%
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-indigo-200/60">
                          Optimal Utilization
                        </div>
                        <div className="text-lg font-bold text-white">
                          {(currentConfig.optimal_utilization * 100).toFixed(2)}
                          %
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-indigo-200/60">
                          Excess Slope
                        </div>
                        <div className="text-lg font-bold text-white">
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
                  <div className="text-xs text-indigo-300/60 uppercase tracking-wider font-semibold pt-2">
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
                            ? "bg-amber-500/10 border-amber-400/40 shadow-lg ring-2 ring-amber-400/20"
                            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-cyan-400/30"
                        }`}
                      >
                        {/* Timeline dot */}
                        <div className="absolute -left-1.5 top-6 w-3 h-3 rounded-full bg-cyan-400 border-2 border-slate-900" />

                        {/* Timestamp */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">📈</span>
                            <div>
                              <div
                                className={`font-semibold ${isSelected ? "text-amber-400" : "text-cyan-400"}`}
                              >
                                Interest Rate Update
                              </div>
                              <div className="text-xs text-indigo-200/60">
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
                          <span className="text-xs text-indigo-300/60">
                            {new Date(
                              event.checkpoint_timestamp_ms
                            ).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Parameters Grid */}
                        <div className="ml-10 bg-black/20 rounded-lg p-3 border border-white/5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-indigo-200/60">
                                Base Rate
                              </div>
                              <div className="text-lg font-bold text-white">
                                {formatPercent(config.base_rate)}%
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-indigo-200/60">
                                Base Slope
                              </div>
                              <div className="text-lg font-bold text-white">
                                {formatPercent(config.base_slope)}%
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-indigo-200/60">
                                Optimal Utilization
                              </div>
                              <div className="text-lg font-bold text-white">
                                {formatPercent(config.optimal_utilization)}%
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-indigo-200/60">
                                Excess Slope
                              </div>
                              <div className="text-lg font-bold text-white">
                                {formatPercent(config.excess_slope)}%
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Footer Info */}
                        <div className="ml-10 mt-2">
                          <div className="text-xs text-indigo-300/60">
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
        <div className="p-6 bg-slate-900/50 overflow-auto">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/30 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {displayConfig?.isCurrent ? "Current" : "Historical"} Yield
                  Curve
                </h3>
                <p className="text-indigo-200/60 text-sm">
                  Visual representation of interest rate vs utilization
                </p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          {curveData && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <ResponsiveContainer width="100%" height={400}>
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
              <div className="mt-6 grid grid-cols-4 gap-4 text-sm">
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="text-indigo-200/60 mb-1">Base Rate</div>
                  <div className="text-white font-bold">
                    {formatPercent(displayConfig.base_rate)}%
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="text-indigo-200/60 mb-1">Base Slope</div>
                  <div className="text-white font-bold">
                    {formatPercent(displayConfig.base_slope)}%
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="text-indigo-200/60 mb-1">Optimal Util</div>
                  <div className="text-white font-bold">
                    {formatPercent(displayConfig.optimal_utilization)}%
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                  <div className="text-indigo-200/60 mb-1">Excess Slope</div>
                  <div className="text-white font-bold">
                    {formatPercent(displayConfig.excess_slope)}%
                  </div>
                </div>
              </div>
            </div>
          )}

          {!curveData && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <p className="text-lg text-indigo-300/60 mb-2">
                Select a configuration to view its yield curve
              </p>
              <p className="text-sm text-indigo-200/40">
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
