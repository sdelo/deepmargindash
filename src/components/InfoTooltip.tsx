import React from "react";

/**
 * Centralized tooltip definitions for technical terms across the app.
 * Use these keys with the InfoTooltip component for consistency.
 */
export const TOOLTIP_DEFINITIONS = {
  // Pool metrics
  utilizationRate: "Percentage of supplied assets currently borrowed. Higher utilization = higher APY but less available for withdrawal.",
  supplyAPY: "Annual percentage yield earned by depositors, based on borrower interest minus protocol fees.",
  borrowAPR: "Annual percentage rate paid by borrowers. Increases when pool utilization is high.",
  supplyCapUsage: "Current deposits as a percentage of the maximum allowed supply.",
  maxUtilizationRate: "Maximum borrowing allowed relative to total supply.",
  protocolSpread: "Fee retained by the protocol from borrower interest.",
  referralSpread: "Fee retained by the protocol from borrower interest, shared with referrers.",
  
  // Interest rate model
  baseRate: "Minimum interest rate charged even at 0% utilization. The starting point of the interest curve.",
  baseSlope: "Rate of interest increase per unit of utilization below optimal. Controls how fast rates rise initially.",
  optimalUtilization: "Target utilization rate where interest model transitions. Beyond this, rates increase more steeply.",
  excessSlope: "Rate of interest increase above optimal utilization. Designed to discourage over-borrowing.",
  
  // Deposit/Withdraw
  minBorrow: "Minimum amount that can be borrowed from this pool in a single transaction.",
  supplyCap: "Maximum total supply allowed in this pool. Deposits are rejected once this limit is reached.",
  
  // Risk ratios (DeepBook)
  borrowRiskRatio: "Minimum collateral ratio required to borrow. Your position must maintain at least this ratio of assets to debt to take new loans.",
  liquidationRiskRatio: "Threshold below which your position can be liquidated. If your collateral ratio falls below this, liquidators can close your position.",
  withdrawRiskRatio: "Minimum ratio required to withdraw collateral. You cannot withdraw if it would push your position below this threshold.",
  targetLiqRisk: "Target ratio after partial liquidation. When liquidated, the system aims to restore your position to this healthier ratio.",
  poolReward: "Percentage of liquidation amount given to the lending pool as compensation for absorbed risk.",
  userReward: "Percentage of liquidation amount given to the liquidator as incentive for maintaining system health.",
  marginDisabled: "Margin trading is disabled for this pool. Trading and borrowing features are not available until enabled by pool administrators.",
  marginEnabled: "Margin trading is active. You can open leveraged positions and borrow against your collateral in this pool.",
  
  // Pool status
  highLiquidity: "Pool has low utilization with ample available funds for withdrawal.",
  optimalLiquidity: "Pool is operating at target utilization with balanced supply and demand.",
  lowLiquidity: "High utilization may cause withdrawal delays. Consider the exit risk.",
} as const;

export type TooltipKey = keyof typeof TOOLTIP_DEFINITIONS;

interface InfoTooltipProps {
  /** Either a tooltip key from TOOLTIP_DEFINITIONS or a custom string */
  tooltip: TooltipKey | string;
  /** Size variant */
  size?: "sm" | "md";
  /** Position of the tooltip */
  position?: "top" | "bottom" | "left" | "right";
}

/**
 * A small info icon that shows a tooltip on hover.
 * Use this next to technical terms to help users understand their meaning.
 * 
 * @example
 * // Using a predefined tooltip key
 * <InfoTooltip tooltip="utilizationRate" />
 * 
 * @example
 * // Using a custom tooltip string
 * <InfoTooltip tooltip="Custom explanation here" />
 */
export const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  tooltip, 
  size = "sm",
  position = "top" 
}) => {
  const [show, setShow] = React.useState(false);
  
  // Resolve the tooltip text - either from definitions or use the raw string
  const tooltipText = tooltip in TOOLTIP_DEFINITIONS 
    ? TOOLTIP_DEFINITIONS[tooltip as TooltipKey] 
    : tooltip;

  const sizeClasses = size === "sm" 
    ? "w-3.5 h-3.5 text-[9px]" 
    : "w-4 h-4 text-[10px]";
  
  const tooltipWidth = size === "sm" ? "w-52" : "w-64";

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 -translate-x-1/2 mb-1.5";
      case "bottom":
        return "top-full left-1/2 -translate-x-1/2 mt-1.5";
      case "left":
        return "right-full top-1/2 -translate-y-1/2 mr-1.5";
      case "right":
        return "left-full top-1/2 -translate-y-1/2 ml-1.5";
      default:
        return "bottom-full left-1/2 -translate-x-1/2 mb-1.5";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 -translate-x-1/2 -mt-px border-t-slate-800";
      case "bottom":
        return "bottom-full left-1/2 -translate-x-1/2 -mb-px border-b-slate-800";
      case "left":
        return "left-full top-1/2 -translate-y-1/2 -ml-px border-l-slate-800";
      case "right":
        return "right-full top-1/2 -translate-y-1/2 -mr-px border-r-slate-800";
      default:
        return "top-full left-1/2 -translate-x-1/2 -mt-px border-t-slate-800";
    }
  };

  return (
    <div className="relative inline-flex ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className={`${sizeClasses} rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white/70 transition-all cursor-help`}
        aria-label="More info"
      >
        ?
      </button>
      {show && (
        <div 
          className={`absolute z-50 ${getPositionClasses()} px-2.5 py-2 text-[11px] text-white/90 bg-slate-800 border border-slate-700 rounded-lg shadow-xl ${tooltipWidth} leading-relaxed pointer-events-none`}
        >
          {tooltipText}
          <div 
            className={`absolute border-4 border-transparent ${getArrowClasses()}`} 
          />
        </div>
      )}
    </div>
  );
};

export default InfoTooltip;
