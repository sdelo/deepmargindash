import React from 'react';
import { type AtRiskPosition } from '../../../hooks/useAtRiskPositions';

interface PositionDetailDrawerProps {
  position: AtRiskPosition;
  allPositions: AtRiskPosition[];
  isOpen: boolean;
  onClose: () => void;
  onLiquidate: (position: AtRiskPosition) => void;
  onViewHistory: (position: AtRiskPosition) => void;
}

/**
 * Format address for display
 */
function formatAddress(address: string): string {
  if (!address || address.length < 16) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

/**
 * Format USD value
 */
function formatUsd(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

/**
 * Simulate what happens to a single position if prices change
 */
function simulatePositionWithPriceChange(
  position: AtRiskPosition,
  basePriceChangePct: number
): {
  newHealthFactor: number;
  newPriceBuffer: number;
  isLiquidatable: boolean;
  newDebtUsd: number;
  newCollateralUsd: number;
} {
  const basePriceMultiplier = 1 + (basePriceChangePct / 100);
  
  const newBaseAssetUsd = position.baseAssetUsd * basePriceMultiplier;
  const newQuoteAssetUsd = position.quoteAssetUsd; // Stablecoin
  const newBaseDebtUsd = position.baseDebtUsd * basePriceMultiplier;
  const newQuoteDebtUsd = position.quoteDebtUsd;
  
  const newCollateralUsd = newBaseAssetUsd + newQuoteAssetUsd;
  const newDebtUsd = newBaseDebtUsd + newQuoteDebtUsd;
  
  const newHealthFactor = newDebtUsd > 0 ? newCollateralUsd / newDebtUsd : 999;
  const newPriceBuffer = ((newHealthFactor - position.liquidationThreshold) / position.liquidationThreshold) * 100;
  const isLiquidatable = newHealthFactor <= position.liquidationThreshold;
  
  return {
    newHealthFactor,
    newPriceBuffer,
    isLiquidatable,
    newDebtUsd,
    newCollateralUsd,
  };
}

/**
 * Position Detail Drawer - Slide-in panel with position details and simulator
 */
export function PositionDetailDrawer({
  position,
  allPositions,
  isOpen,
  onClose,
  onLiquidate,
  onViewHistory,
}: PositionDetailDrawerProps) {
  const [priceChangePct, setPriceChangePct] = React.useState(0);
  
  // Current base price from position
  const currentBasePrice = position.basePythPrice 
    ? position.basePythPrice / Math.pow(10, Math.abs(position.basePythDecimals || 0))
    : 0;
  
  const simulatedPrice = currentBasePrice * (1 + priceChangePct / 100);
  const simulation = simulatePositionWithPriceChange(position, priceChangePct);
  
  // Calculate estimated net profit
  const grossReward = position.estimatedRewardUsd;
  const estimatedGasCost = 0.50; // ~$0.50 in gas on SUI
  const estimatedSlippage = position.totalDebtUsd * 0.003; // ~0.3% slippage estimate
  const netProfit = grossReward - estimatedGasCost - estimatedSlippage;
  
  // Reset price slider when position changes
  React.useEffect(() => {
    setPriceChangePct(0);
  }, [position.marginManagerId]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-slate-900 border-l border-white/10 z-50 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-white/10 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Position Details</h2>
            <a
              href={`https://suivision.xyz/object/${position.marginManagerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-cyan-400 hover:text-cyan-300 font-mono"
            >
              {formatAddress(position.marginManagerId)} ↗
            </a>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {position.isLiquidatable ? (
              <span className="px-3 py-1.5 text-sm font-bold rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                ⚠️ LIQUIDATABLE NOW
              </span>
            ) : position.distanceToLiquidation < 5 ? (
              <span className="px-3 py-1.5 text-sm font-bold rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40">
                CRITICAL
              </span>
            ) : position.distanceToLiquidation < 15 ? (
              <span className="px-3 py-1.5 text-sm font-bold rounded-lg bg-yellow-500/20 text-yellow-300 border border-yellow-500/40">
                WARNING
              </span>
            ) : (
              <span className="px-3 py-1.5 text-sm font-bold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                WATCHING
              </span>
            )}
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Health Factor</div>
              <div className={`text-2xl font-bold tabular-nums ${
                position.isLiquidatable ? 'text-rose-400' :
                position.distanceToLiquidation < 5 ? 'text-amber-400' :
                position.distanceToLiquidation < 15 ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                {position.riskRatio.toFixed(3)}
              </div>
              <div className="text-xs text-white/40 mt-1">
                Liquidation @ {position.liquidationThreshold.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="text-xs text-white/50 mb-1">Price Buffer</div>
              <div className={`text-2xl font-bold tabular-nums ${
                position.distanceToLiquidation < 0 ? 'text-rose-400' :
                position.distanceToLiquidation < 5 ? 'text-amber-400' :
                position.distanceToLiquidation < 15 ? 'text-yellow-400' :
                'text-emerald-400'
              }`}>
                {position.distanceToLiquidation < 0 ? '' : '+'}
                {position.distanceToLiquidation.toFixed(1)}%
              </div>
              <div className="text-xs text-white/40 mt-1">
                Until liquidation
              </div>
            </div>
          </div>

          {/* Position Breakdown */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-4">
            <h3 className="text-sm font-semibold text-white/80">Position Breakdown</h3>
            
            {/* Collateral */}
            <div>
              <div className="text-xs text-white/50 mb-2">Collateral</div>
              <div className="space-y-2">
                {position.baseAsset > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{position.baseAssetSymbol}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {(position.baseAsset / 1e9).toFixed(4)}
                      </span>
                      <span className="text-xs text-white/40 ml-2">
                        {formatUsd(position.baseAssetUsd)}
                      </span>
                    </div>
                  </div>
                )}
                {position.quoteAsset > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{position.quoteAssetSymbol}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {(position.quoteAsset / 1e6).toFixed(2)}
                      </span>
                      <span className="text-xs text-white/40 ml-2">
                        {formatUsd(position.quoteAssetUsd)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm font-medium text-white/80">Total Collateral</span>
                  <span className="text-sm font-bold text-white">
                    {formatUsd(position.baseAssetUsd + position.quoteAssetUsd)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Debt */}
            <div>
              <div className="text-xs text-white/50 mb-2">Debt</div>
              <div className="space-y-2">
                {position.baseDebt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{position.baseAssetSymbol}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-rose-400">
                        {(position.baseDebt / 1e9).toFixed(4)}
                      </span>
                      <span className="text-xs text-white/40 ml-2">
                        {formatUsd(position.baseDebtUsd)}
                      </span>
                    </div>
                  </div>
                )}
                {position.quoteDebt > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-white/70">{position.quoteAssetSymbol}</span>
                    <div className="text-right">
                      <span className="text-sm font-medium text-rose-400">
                        {(position.quoteDebt / 1e6).toFixed(2)}
                      </span>
                      <span className="text-xs text-white/40 ml-2">
                        {formatUsd(position.quoteDebtUsd)}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-sm font-medium text-white/80">Total Debt</span>
                  <span className="text-sm font-bold text-rose-400">
                    {formatUsd(position.totalDebtUsd)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Simulator */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-xl p-4 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Price Simulator
              </h3>
              <div className="text-right">
                <div className="text-xs text-white/50">{position.baseAssetSymbol} Price</div>
                <div className="text-sm font-bold text-white">${currentBasePrice.toFixed(4)}</div>
              </div>
            </div>

            {/* Price Change Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Simulate price change:</span>
                <span className={`font-bold ${
                  priceChangePct < 0 ? 'text-rose-400' : 
                  priceChangePct > 0 ? 'text-emerald-400' : 
                  'text-white'
                }`}>
                  {priceChangePct > 0 ? '+' : ''}{priceChangePct}% → ${simulatedPrice.toFixed(4)}
                </span>
              </div>
              
              <input
                type="range"
                min={-50}
                max={50}
                step={1}
                value={priceChangePct}
                onChange={(e) => setPriceChangePct(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer
                           [&::-webkit-slider-thumb]:appearance-none
                           [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4
                           [&::-webkit-slider-thumb]:rounded-full
                           [&::-webkit-slider-thumb]:bg-cyan-400
                           [&::-webkit-slider-thumb]:border-2
                           [&::-webkit-slider-thumb]:border-white
                           [&::-webkit-slider-thumb]:cursor-grab"
              />
              
              <div className="flex justify-between text-xs text-white/40">
                <span>-50%</span>
                <span>0%</span>
                <span>+50%</span>
              </div>
            </div>

            {/* Simulation Results */}
            {priceChangePct !== 0 && (
              <div className={`rounded-lg p-3 ${
                simulation.isLiquidatable 
                  ? 'bg-rose-500/20 border border-rose-500/40' 
                  : 'bg-white/5 border border-white/10'
              }`}>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-white/50">New Health Factor</div>
                    <div className={`font-bold ${simulation.isLiquidatable ? 'text-rose-400' : 'text-white'}`}>
                      {simulation.newHealthFactor.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-white/50">New Price Buffer</div>
                    <div className={`font-bold ${simulation.isLiquidatable ? 'text-rose-400' : 'text-white'}`}>
                      {simulation.newPriceBuffer < 0 ? '' : '+'}{simulation.newPriceBuffer.toFixed(1)}%
                    </div>
                  </div>
                </div>
                {simulation.isLiquidatable && !position.isLiquidatable && (
                  <div className="mt-2 text-xs text-rose-300 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Position becomes liquidatable at this price
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profit Breakdown (for liquidatable positions) */}
          {position.isLiquidatable && (
            <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30 space-y-3">
              <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Profit Breakdown
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Liquidation Incentive</span>
                  <span className="text-emerald-400">+{formatUsd(grossReward)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Est. Gas Cost</span>
                  <span className="text-rose-400">-{formatUsd(estimatedGasCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Est. Slippage (~0.3%)</span>
                  <span className="text-rose-400">-{formatUsd(estimatedSlippage)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/10">
                  <span className="text-white font-medium">Est. Net Profit</span>
                  <span className={`font-bold ${netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {netProfit > 0 ? '+' : ''}{formatUsd(netProfit)}
                  </span>
                </div>
              </div>
              
              <p className="text-xs text-white/40">
                Estimates based on current market conditions. Actual results may vary.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => onViewHistory(position)}
              className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              View History
            </button>
            
            {position.isLiquidatable ? (
              <button
                onClick={() => onLiquidate(position)}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-bold transition-all bg-rose-500 hover:bg-rose-400 text-white flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Liquidate Now
              </button>
            ) : (
              <button
                disabled
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium bg-slate-700/50 text-slate-500 cursor-not-allowed flex items-center justify-center gap-2"
              >
                Not Yet Liquidatable
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
