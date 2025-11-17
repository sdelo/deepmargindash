import React from 'react';
import { useProtocolMetrics } from '../../../hooks/useProtocolMetrics';

export function GlobalMetricsPanel() {
  const metrics = useProtocolMetrics();

  const metricCards = [
    {
      title: 'Total Value Locked',
      value: metrics.totalValueLocked.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      suffix: '',
      icon: '💰',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Total Borrowed',
      value: metrics.totalBorrowed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      suffix: '',
      icon: '📊',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      title: 'Total Supply',
      value: metrics.totalSupply.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      suffix: '',
      icon: '💎',
      gradient: 'from-indigo-500 to-purple-600',
    },
    {
      title: 'Active Margin Managers',
      value: metrics.activeMarginManagers.toLocaleString(),
      suffix: '',
      icon: '👥',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Total Liquidations',
      value: metrics.totalLiquidations.toLocaleString(),
      suffix: '',
      icon: '⚡',
      gradient: 'from-rose-500 to-red-600',
    },
  ];

  if (metrics.error) {
    return (
      <div className="card-surface p-6 mb-8 rounded-3xl border border-red-500/20">
        <p className="text-red-400">Error loading protocol metrics: {metrics.error.message}</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold text-cyan-200 mb-6">Protocol Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className="card-surface p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`text-3xl bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent`}>
                {card.icon}
              </div>
              {metrics.isLoading && (
                <div className="animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">
                {metrics.isLoading ? (
                  <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
                ) : (
                  <>
                    {card.value}
                    {card.suffix && <span className="text-lg text-white/60 ml-1">{card.suffix}</span>}
                  </>
                )}
              </div>
              <div className="text-sm text-white/60">{card.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

