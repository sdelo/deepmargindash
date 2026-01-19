import React from "react";

export function HowItWorksPanel() {
  return (
    <div className="surface-elevated p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2dd4bf]/20 to-cyan-500/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-[#2dd4bf]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">How DeepBook Margin Works</h2>
          <p className="text-sm text-white/50">Earn yield by supplying liquidity</p>
        </div>
      </div>

      {/* Flow Steps */}
      <div className="space-y-5">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-[#2dd4bf]/20 flex items-center justify-center text-[#2dd4bf] font-bold border border-[#2dd4bf]/30 text-sm">
              1
            </div>
            <div className="flex-1 w-px bg-gradient-to-b from-[#2dd4bf]/30 to-transparent my-2" />
          </div>
          <div className="flex-1 pb-2">
            <h3 className="font-semibold text-white mb-1 text-sm">Supply Assets</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Deposit your SUI, USDC, DEEP, or WAL tokens to provide liquidity for margin traders. 
              Your assets are held in a secure smart contract vault on the Sui blockchain.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 font-bold border border-violet-500/30 text-sm">
              2
            </div>
            <div className="flex-1 w-px bg-gradient-to-b from-violet-500/30 to-transparent my-2" />
          </div>
          <div className="flex-1 pb-2">
            <h3 className="font-semibold text-white mb-1 text-sm">Traders Borrow & Trade</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Margin traders borrow your assets to open leveraged positions on DeepBook's order book. 
              They pay interest on borrowed funds, which accrues to the pool.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold border border-emerald-500/30 text-sm">
              3
            </div>
            <div className="flex-1 w-px bg-gradient-to-b from-emerald-500/30 to-transparent my-2" />
          </div>
          <div className="flex-1 pb-2">
            <h3 className="font-semibold text-white mb-1 text-sm">Earn Variable APY</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              As borrowers pay interest, your share of the pool grows. APY is variable—it increases 
              with pool utilization. Higher demand = higher yields.
            </p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold border border-amber-500/30 text-sm">
              4
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1 text-sm">Withdraw Anytime</h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Request withdrawals at any time—no lockup period. Withdrawals are instant when liquidity 
              is available. High utilization may require waiting for borrowers to repay.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Section */}
      <div className="p-5 rounded-xl bg-amber-500/5 border border-amber-500/20">
        <h3 className="font-semibold text-amber-400 mb-4 flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Understand the Risks
        </h3>
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-black/20 border border-amber-500/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white text-xs mb-0.5">Liquidity Risk</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  When pool utilization is high, most assets are lent out. You may need to wait for 
                  borrowers to repay before you can withdraw.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-red-500/10">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white text-xs mb-0.5">Bad Debt Risk</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  If a borrower's position becomes insolvent during extreme market moves, any shortfall 
                  is shared proportionally across all suppliers.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/20 border border-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-white text-xs mb-0.5">Smart Contract Risk</h4>
                <p className="text-[11px] text-white/50 leading-relaxed">
                  While DeepBook contracts are audited, all DeFi protocols carry inherent smart contract risks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Facts */}
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">No Lockup</div>
          <div className="text-sm font-medium text-white">Withdraw anytime</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Yield Type</div>
          <div className="text-sm font-medium text-white">Variable APY</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Protocol</div>
          <div className="text-sm font-medium text-white">DeepBook V3</div>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Network</div>
          <div className="text-sm font-medium text-white">Sui Mainnet</div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[11px] text-white/30 text-center pt-3 border-t border-white/[0.06]">
        DeepBook is the native order book on Sui. Margin pools power leveraged trading.
      </p>
    </div>
  );
}

export default HowItWorksPanel;
