import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
}

// Base diving helmet theme colors
const helmetGradient = "from-cyan-400 via-teal-400 to-cyan-600";
const glassGradient = "from-teal-300/70 via-cyan-400/50 to-teal-400/80";

// Overview/Analytics icon - Helmet with gauge
export function OverviewIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5eead4" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      {/* Helmet dome */}
      <ellipse cx="12" cy="11" rx="8" ry="7" fill="url(#helmetGrad)" stroke="#0c4a6e" strokeWidth="0.5"/>
      {/* Viewing port */}
      <ellipse cx="12" cy="11" rx="5" ry="4" fill="url(#glassGrad)" stroke="#2dd4bf" strokeWidth="0.5"/>
      {/* Gauge line */}
      <path d="M 8 11 L 16 11" stroke="#0c4a6e" strokeWidth="0.5"/>
      <circle cx="12" cy="11" r="1.5" fill="#22d3ee" stroke="#0c4a6e" strokeWidth="0.5"/>
      {/* Side ports */}
      <circle cx="5" cy="11" r="1.5" fill="url(#glassGrad)" stroke="#2dd4bf" strokeWidth="0.3"/>
      <circle cx="19" cy="11" r="1.5" fill="url(#glassGrad)" stroke="#2dd4bf" strokeWidth="0.3"/>
      {/* Top valve */}
      <rect x="11" y="3" width="2" height="2" rx="0.5" fill="url(#helmetGrad)" stroke="#0c4a6e" strokeWidth="0.3"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="7" ry="1.5" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.5"/>
    </svg>
  );
}

// Lending/Supply icon - Helmet with coins
export function LendingIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Simplified helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad2)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Coins/gems inside */}
      <circle cx="10" cy="11" r="1.2" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.4"/>
      <circle cx="14" cy="13" r="1.2" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.4"/>
      <circle cx="12" cy="13" r="0.9" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.3"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Borrowing icon - Helmet with arrow out
export function BorrowingIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="11" cy="12" rx="7" ry="6" fill="url(#helmetGrad3)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="11" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Arrow pointing out */}
      <path d="M 15 12 L 20 12 M 18 10 L 20 12 L 18 14" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Bottom collar */}
      <ellipse cx="11" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Liquidation icon - Helmet with alert
export function LiquidationIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad4)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Warning symbol inside */}
      <path d="M 12 9 L 12 13" stroke="#ef4444" strokeWidth="1" strokeLinecap="round"/>
      <circle cx="12" cy="14.5" r="0.5" fill="#ef4444"/>
      {/* Alert triangles on sides */}
      <path d="M 6 12 L 7 10 L 8 12 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.3"/>
      <path d="M 16 12 L 17 10 L 18 12 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.3"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Admin icon - Helmet with gear
export function AdminIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad5)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Gear inside */}
      <circle cx="12" cy="12" r="2" fill="none" stroke="#0c4a6e" strokeWidth="0.8"/>
      <circle cx="12" cy="12" r="0.8" fill="#164e63"/>
      {/* Gear teeth */}
      <circle cx="12" cy="9.5" r="0.5" fill="#164e63"/>
      <circle cx="12" cy="14.5" r="0.5" fill="#164e63"/>
      <circle cx="9.5" cy="12" r="0.5" fill="#164e63"/>
      <circle cx="14.5" cy="12" r="0.5" fill="#164e63"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Yield icon - Helmet with upward graph
export function YieldIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad6)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Graph line */}
      <path d="M 8 14 L 10 12 L 12 13 L 14 10 L 16 11" stroke="#10b981" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Arrow up */}
      <path d="M 16 11 L 16 9 M 15 10 L 16 9 L 17 10" stroke="#10b981" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Liquidity icon - Helmet with water drops
export function LiquidityIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad7)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Water drops */}
      <path d="M 10 11 Q 10 9 10 9.5 Q 10 10 10 11 Z" fill="#22d3ee" stroke="#06b6d4" strokeWidth="0.3"/>
      <path d="M 13 13 Q 13 11 13 11.5 Q 13 12 13 13 Z" fill="#22d3ee" stroke="#06b6d4" strokeWidth="0.3"/>
      <path d="M 11.5 13.5 Q 11.5 12.5 11.5 13 Q 11.5 13.2 11.5 13.5 Z" fill="#22d3ee" stroke="#06b6d4" strokeWidth="0.3"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

// Whale Watch icon - Helmet with whale
export function WhaleIcon({ className = "", size = 24 }: IconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="helmetGrad8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Helmet */}
      <ellipse cx="12" cy="12" rx="7" ry="6" fill="url(#helmetGrad8)" stroke="#0c4a6e" strokeWidth="0.5"/>
      <ellipse cx="12" cy="12" rx="4.5" ry="3.5" fill="#5eead4" fillOpacity="0.3" stroke="#2dd4bf" strokeWidth="0.4"/>
      {/* Simplified whale */}
      <ellipse cx="11" cy="12" rx="3" ry="1.5" fill="#0c4a6e" fillOpacity="0.6"/>
      <path d="M 14 12 L 15 11 L 15 13 Z" fill="#0c4a6e" fillOpacity="0.6"/>
      <circle cx="10" cy="11.5" r="0.4" fill="#22d3ee"/>
      {/* Water spout */}
      <path d="M 11 10 L 11 8.5 M 10.5 9 L 11 8.5 L 11.5 9" stroke="#22d3ee" strokeWidth="0.5" strokeLinecap="round"/>
      {/* Bottom collar */}
      <ellipse cx="12" cy="17" rx="6" ry="1.2" fill="#164e63" stroke="#0c4a6e" strokeWidth="0.4"/>
    </svg>
  );
}

