import React from 'react';
import type { TimeRange } from '../features/lending/api/types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  options?: TimeRange[];
  className?: string;
}

/**
 * Time range selector component with consistent styling
 */
export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  value,
  onChange,
  options = ['1W', '1M', '3M', '1Y', 'YTD', 'ALL'],
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="text-xs text-cyan-100/80">Range</span>
      <div className="rounded-xl bg-white/10 border border-cyan-300/30 overflow-hidden">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`px-3 py-1 transition-all ${
              value === option
                ? 'bg-gradient-to-r from-cyan-400/20 to-blue-600/20 text-white border-l border-cyan-300/30'
                : 'text-cyan-100/80 hover:text-white'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeRangeSelector;

