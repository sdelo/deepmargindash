# Leviathan Margin Dashboard - Feature Documentation

**Last Updated:** November 17, 2025  
**Application Type:** Sui Blockchain DApp for DeepBook Margin Protocol  
**Tech Stack:** React 18, TypeScript, Bun, Tailwind CSS, Sui dApp Kit, Recharts

---

## Table of Contents

1. [Overview](#overview)
2. [Core Features](#core-features)
3. [User Interface Components](#user-interface-components)
4. [Data Integration & Blockchain](#data-integration--blockchain)
5. [Analytics & Visualization](#analytics--visualization)
6. [Transaction Management](#transaction-management)
7. [Theming & Design System](#theming--design-system)
8. [Hooks & State Management](#hooks--state-management)

---

## Overview

Leviathan is a comprehensive dashboard for monitoring and interacting with DeepBook Margin lending pools on the Sui blockchain. It enables users to earn competitive yields by providing liquidity to margin trading pools, with real-time analytics and position management.

**Primary Use Case:** Supply liquidity (SUI or DBUSDC) to margin pools and earn interest from borrowers.

**Supported Networks:**

- Testnet (default)
- Mainnet
- Localnet

**Supported Assets:**

- SUI (9 decimals)
- DBUSDC (6 decimals)

---

## Core Features

### 1. Landing Page

**Location:** `/` (root)  
**Component:** `LandingPage.tsx`

**Features:**

- Hero section with animated title and tagline
- Live pool card previews showing:
  - Current Supply APR
  - Pool utilization
  - Total Value Locked (TVL)
  - Active depositor count
- "Quick Start in Under 2 Minutes" guide with 3 steps
- "What is DeepBook Margin?" educational section
- Dashboard features preview (4 feature cards)
- Trust & transparency section
- Animated sections with fade-in, slide-in effects
- Responsive grid layouts
- Real-time data fetching from blockchain with fallback to synthetic data
- Direct navigation to pools page

**Key Components:**

- `LandingNavBar` - Navigation with wallet connection
- `LandingPoolCard` - Pool preview cards with live data
- `AnimatedSection` - Reusable animation wrapper
- `OceanIcon` - Custom icon component with ocean theme

---

### 2. Pools Dashboard

**Location:** `/pools` or `/dashboard`  
**Component:** `PoolsPage.tsx`

**Features:**

- Multi-pool management interface
- Real-time pool data synchronization (15-second refresh)
- Comprehensive pool analytics
- User position tracking
- Transaction history
- Admin audit panels

#### 2.1 Pool Cards Section

**Component:** `PoolCards.tsx`

**Displays:**

- Supply (TVL) with progress bar showing % of supply cap
- Total Borrow amount
- Pool Utilization percentage
- Current Supply APR
- Number of depositors
- DeepBook pool linkage
- Asset icons (SUI/DBUSDC logos)

**Actions:**

- Quick deposit button
- Admin audit button (opens slide panel)
- Pool selection (highlights active pool)

#### 2.2 Deposit & Withdraw Panel

**Component:** `DepositWithdrawPanel.tsx`

**Features:**

**Deposit Tab:**

- Amount input with decimal precision (up to 6 decimal places)
- Quick percentage buttons (25%, 50%, 75%, 100%)
- Real-time balance display
- Min borrow and supply cap information
- Gas fee validation (requires 0.01 SUI minimum)
- Asset balance validation
- Transaction status feedback (pending, success, error)
- Wallet connection integration
- Auto-rounded balance (rounds down to nearest 0.01)

**Withdraw Tab:**

- Amount input for partial withdrawal
- Withdraw all functionality
- Gas fee validation
- Real-time balance display
- Transaction status feedback

**Validations:**

- Insufficient balance detection
- Gas fee availability check (0.01 SUI minimum)
- For SUI deposits: validates total = deposit + gas (0.2 SUI)
- Minimum deposit amounts
- Supply cap enforcement

#### 2.3 Personal Positions

**Component:** `PersonalPositions.tsx`

**Features:**

- Real-time position tracking across all pools
- Table view with columns:
  - Asset (SUI/DBUSDC)
  - Deposited amount (current balance with accrued interest)
  - Interest earned (calculated dynamically)
- "Show deposit history" button (opens slide panel)
- Loading and error states
- Empty state for no positions
- Wallet connection prompt

**Calculations:**

- Interest earned based on share index growth
- Current balance = shares × current share index
- Formatted with proper decimals per asset

#### 2.4 Yield Curve Visualization

**Component:** `YieldCurve.tsx`

**Features:**

- Interactive utilization curve chart
- Real-time KPI cards:
  - Supply APR (what suppliers earn)
  - Borrow APR (what borrowers pay)
  - Current utilization percentage
- Piecewise linear curve visualization showing:
  - Base rate + base slope (below optimal utilization)
  - Kink point at optimal utilization
  - Excess slope (above optimal utilization)
- Reference lines for:
  - Current utilization position
  - Optimal utilization threshold
- Hover tooltips with exact values
- Parameter breakdown cards:
  - base_rate
  - base_slope
  - optimal_utilization
  - excess_slope
- Mathematical formula explanation

**Interest Rate Model:**

```
Below Optimal: Borrow APR = base_rate + base_slope × u
Above Optimal: Borrow APR = base_rate + base_slope × optimal_u + excess_slope × (u - optimal_u)
Supply APR = Borrow APR × utilization × (1 - protocol_spread)
```

#### 2.5 Historical Pool Activity

**Component:** `HistoricalActivity.tsx`

**Features:**

- Time range selector (1W, 1M, 3M, YTD, ALL)
- Dual-axis area chart:
  - Supply trend line (cyan gradient)
  - Borrow trend line (amber gradient)
- Interest rate change markers (vertical lines)
- Interactive tooltips showing exact values at each point
- Real-time event data from blockchain
- Aggregated daily data points
- Legend for chart interpretation
- Loading and error states
- Empty state handling

**Data Sources:**

- `AssetSupplied` events
- `AssetWithdrawn` events
- `InterestParamsUpdated` events

#### 2.6 Depositor Distribution

**Component:** `DepositorDistribution.tsx`

**Features:**

- KPI cards:
  - Unique depositor count
  - Top 10 share percentage
  - Concentration risk indicator with:
    - Visual progress bar
    - Gini coefficient
    - Herfindahl-Hirschman Index (HHI)
- Interactive pie chart:
  - Top suppliers visualization
  - Gradient fills for visual appeal
  - Hover tooltips with exact percentages
  - Inner ring design (donut chart)
- Top suppliers list table:
  - Masked addresses for privacy
  - Color-coded dots matching chart
  - Share percentage for each supplier
- Concentration risk analysis

**Note:** Currently uses synthetic data; real-time implementation ready for blockchain integration.

#### 2.7 Protocol Fees & Liquidations

**Component:** `ProtocolFees.tsx`

**Features:**

- Summary KPI cards:
  - Cumulative fees (since inception)
  - 24-hour fees
  - 7-day fees
  - Total liquidation events
- Composed chart showing:
  - Stacked bars for:
    - Protocol fees
    - Liquidation rewards
    - Defaults (pool losses)
  - Cumulative fees line (right axis)
- Detailed breakdown cards:
  - Spread fees (from protocol_spread parameter)
  - Liquidation fees (pool rewards)
  - Defaults (pool losses)
- Time series visualization
- Event-based data tracking

**Note:** Currently uses synthetic data; real-time implementation ready for blockchain integration.

#### 2.8 Pool Admin Audit

**Component:** `PoolAdmin.tsx`  
**UI:** Slide panel (50% viewport width)

**Features:**

- Admin configuration change log
- Summary cards:
  - Total changes
  - Interest parameter updates count
  - Pool config updates count
  - DeepBook link updates count
- Chronological history feed (most recent first)

**Event Types Tracked:**

1. **Interest Parameter Updates:**

   - Before/after comparison for:
     - base_rate
     - base_slope
     - optimal_utilization
     - excess_slope
   - Timestamp and pool ID
   - Visual indicators (cyan highlights)

2. **Pool Configuration Updates:**

   - Before/after comparison for:
     - supply_cap
     - max_utilization_rate
     - protocol_spread
     - min_borrow
   - Timestamp and pool ID
   - Visual indicators (amber highlights)

3. **DeepBook Link Updates:**
   - DeepBook pool ID
   - Pool cap ID
   - Enabled status
   - Visual indicators (blue highlights)

**Data Sources:**

- `InterestParamsUpdated` events
- `MarginPoolConfigUpdated` events
- `DeepbookPoolUpdated` events

**Note:** Currently uses synthetic data; ready for blockchain integration.

#### 2.9 Deposit/Withdraw History

**Component:** `DepositHistory.tsx`  
**UI:** Slide panel (50% viewport width)

**Features:**

- User-specific transaction history
- Sortable table with columns:
  - Time (formatted timestamp)
  - Type (Supply/Withdraw with color coding)
  - Asset (SUI/DBUSDC)
  - Amount (formatted with decimals)
  - Shares (minted/burned)
  - Transaction (link to Sui Explorer)
- Real-time data from blockchain events
- Time-based filtering support
- Loading, error, and empty states
- External links to transaction details on Sui Explorer

**Data Sources:**

- `AssetSupplied` events (filtered by user address)
- `AssetWithdrawn` events (filtered by user address)

---

## User Interface Components

### Navigation Components

#### 3.1 Landing Navigation Bar

**Component:** `LandingNavBar.tsx`

**Features:**

- Leviathan branding with gradient text effect
- "Launch App" button navigating to /pools
- Wallet connection button (ConnectModal from dApp Kit)
- Responsive design
- Glass morphism effect background
- Sticky positioning

#### 3.2 Dashboard Navigation

**Component:** `DashboardNav.tsx`

**Features:**

- Horizontal navigation bar with sections:
  - Pools & Deposit (anchor link)
  - Yield & Interest (anchor link)
  - Depositors (anchor link)
  - Activity (anchor link)
  - Fees (anchor link)
- Active section highlighting
- Smooth scroll behavior
- Wallet connection status
- Network switcher integration

#### 3.3 Main Navigation Bar

**Component:** `NavBar.tsx` (in features/shared/components)

**Features:**

- Sidebar layout (left-aligned, fixed position)
- Leviathan logo and branding
- Wallet connection with:
  - Current account display
  - Truncated address
  - Connection status
- Network switcher dropdown
- "View on Sui Explorer" link
- Submarine icon animation
- Glass morphism background

### Utility Components

#### 3.4 Network Switcher

**Component:** `NetworkSwitcher.tsx`

**Features:**

- Dropdown select for network switching
- Available networks:
  - Testnet
  - Mainnet
  - Localnet
- Persistent network selection
- Integration with Sui dApp Kit

#### 3.5 Slide Panel

**Component:** `SlidePanel.tsx`

**Features:**

- Configurable width (default 50vw)
- Smooth slide-in animation from right
- Backdrop overlay with blur
- Close button with icon
- Customizable title
- Scrollable content area
- Click-outside-to-close functionality
- Escape key support

#### 3.6 Tooltips

**Component:** `Tooltip.tsx`

**Features:**

- Hover-triggered information popups
- Positioned tooltips (auto-positioned based on viewport)
- Customizable content
- Arrow indicators
- Dark theme styling
- Used throughout dashboard for parameter explanations

#### 3.7 Loading Skeleton

**Component:** `LoadingSkeleton.tsx`

**Features:**

- Animated shimmer effect
- Customizable shapes (rectangular, circular)
- Responsive sizing
- Used during data fetching states

#### 3.8 Empty State

**Component:** `EmptyState.tsx`

**Features:**

- Configurable icon/emoji
- Title and description text
- Optional action button
- Centered layout
- Used when no data is available

#### 3.9 Ocean Icons

**Component:** `OceanIcon.tsx`

**Features:**

- Custom ocean-themed icon set:
  - Anchor
  - Wave
  - Treasure chest
  - Submarine
  - Depth gauge
  - Sonar
  - Whale
- SVG-based for crisp rendering
- Configurable sizes (sm, md, lg)
- Consistent styling
- Used throughout ocean/depth theme

#### 3.10 Time Range Selector

**Component:** `TimeRangeSelector.tsx`

**Features:**

- Predefined time ranges (1W, 1M, 3M, YTD, ALL)
- Button group layout
- Active state highlighting
- Integration with chart components
- Callback support for selection changes

#### 3.11 Animated Section

**Component:** `AnimatedSection.tsx`

**Features:**

- CSS-based animations:
  - fade-in-up
  - slide-in-left
  - slide-in-right
  - slide-in-top
  - scale-in
- Configurable delay
- Intersection Observer for scroll-triggered animations
- Reusable wrapper component

#### 3.12 Chart Tooltip

**Component:** `ChartTooltip.tsx`

**Features:**

- Custom tooltip for Recharts
- Formatted values
- Label transformation
- Dark theme styling
- Rounded borders
- Semi-transparent background

---

## Data Integration & Blockchain

### 4.1 Sui Blockchain Integration

**Wallet Support:**

- Sui Wallet
- Suiet Wallet
- Other Sui-compatible wallets
- Auto-connect on return visits
- Persistent connection state

**Network Configuration:**

- Full node connections via Sui SDK
- Network-specific RPC endpoints
- MVR (Module Version Resolution) support
- Package version management

### 4.2 Contract Integration

**Smart Contract Addresses (Testnet):**

```typescript
MARGIN_PACKAGE_ID: "0x442d21fd044b90274934614c3c41416c83582f42eaa8feb4fecea301aa6bdd54";
MARGIN_REGISTRY_ID: "0x851e63bd0a3e25a12f02df82f0a1683064ee7ed0b1297dcd18707aa22b382ad3";

// Margin Pools
SUI_MARGIN_POOL_ID: "0x52fae759e70a7fd35f2a4538589a949ad120dc67fa1bda7bf0b12dcc650b173a";
DBUSDC_MARGIN_POOL_ID: "0xfca47443db2177b3e7d93fdb4b3a7d33c3102688419146c9bac2628d735a7545";

// Referral Objects
SUI_MARGIN_POOL_REFERRAL: "0x27723f851291153be05e1e3d9e590fad7f79e8bae37a63a22ca48f93ef0ec6ea";
DBUSDC_MARGIN_POOL_REFERRAL: "0xd9f5b995d213258be1ed7c0d3e78435ffc55cd6042e98ca23910374de329bffe";
```

**Contract Methods Used:**

- `supply()` - Deposit assets to margin pool
- `withdraw()` - Withdraw assets (partial or full)
- Pool object queries with BCS data
- Registry queries for user positions

### 4.3 BCS (Binary Canonical Serialization) Parsing

**Implementation:**

- Generated TypeScript bindings from Move contracts
- Type-safe BCS parsing using `@mysten/bcs`
- Contract types in `src/contracts/deepbook_margin/`

**Key Parsed Objects:**

- `MarginPool` - Pool state and configuration
  - State: total_supply, total_borrow, share_index
  - Config: supply_cap, protocol_spread, min_borrow
  - Interest Config: base_rate, base_slope, optimal_utilization, excess_slope
- User positions (shares, deposits)

**Parsing Pattern:**

```typescript
import { MarginPool } from "../contracts/deepbook_margin/margin_pool";
const marginPool = MarginPool.fromBase64(bcsData.bcsBytes);

// Access properties directly (no .fields)
marginPool.state.total_supply;
marginPool.config.margin_pool_config.supply_cap;
```

### 4.4 Data Transformation

**Decimal Conversion Utilities:**

```typescript
// Token amounts (use token-specific decimals)
convertFromSmallestUnits(value, decimals);
// SUI: 9 decimals (divide by 1e9)
// DBUSDC: 6 decimals (divide by 1e6)

// Config values (always 9 decimals)
nineDecimalToPercent(nineDecimal);
// Example: 900000000 = 0.9 (90%)
```

**Data Flow:**

```
Blockchain Data → fetchMarginPool API → transformMarginPoolData → PoolOverview
                                           ↓
                                    Decimal conversion
                                    Field mapping
                                    Interest calculations
```

### 4.5 Event Indexing & Querying

**Event Types:**

- `AssetSupplied` - User deposits
- `AssetWithdrawn` - User withdrawals
- `LoanBorrowed` - Borrowing events
- `LoanRepaid` - Repayment events
- `Liquidation` - Liquidation events
- `InterestParamsUpdated` - Interest rate changes
- `MarginPoolConfigUpdated` - Pool config changes
- `DeepbookPoolUpdated` - DeepBook linkage updates

**Query Features:**

- Time-range filtering (1W, 1M, 3M, YTD, ALL)
- User address filtering
- Pool ID filtering
- Manager ID filtering
- Checkpoint-based pagination
- Real-time updates

**Event API Endpoints:**

- Base URL: `https://events-api.deepbook.tech`
- Endpoints for each event type
- RESTful query parameters
- JSON responses

### 4.6 Coin Balance Fetching

**Hook:** `useCoinBalance`

**Features:**

- Real-time balance queries for any coin type
- Automatic decimal conversion
- Formatted display strings
- Raw value access
- Support for:
  - SUI balance (for gas fees)
  - DBUSDC balance
  - Any custom coin type

---

## Analytics & Visualization

### 5.1 Charts & Graphs

**Library:** Recharts (v2.12.7)

**Implemented Charts:**

1. **Line Chart (Yield Curve):**

   - Piecewise linear interest rate curve
   - Reference lines for optimal utilization
   - Reference dots for current position
   - Custom tooltips with formatted values
   - Gradient colors (cyan theme)

2. **Area Chart (Historical Activity):**

   - Stacked area for supply/borrow trends
   - Gradient fills under curves
   - Vertical reference lines for rate changes
   - Time-based x-axis
   - Dual legend for multiple series

3. **Pie Chart (Depositor Distribution):**

   - Donut style (inner radius)
   - Gradient fills for each segment
   - Custom tooltips
   - Interactive hover states
   - Color-coded segments

4. **Composed Chart (Protocol Fees):**
   - Stacked bars for different fee types
   - Line overlay for cumulative totals
   - Dual y-axes
   - Multiple data series
   - Interactive legend

**Chart Features:**

- Responsive containers (100% width)
- Consistent dark theme styling
- Custom tooltips with branded colors
- Smooth animations
- Grid lines for readability
- Formatted axis labels
- Interactive hover states

### 5.2 Real-time Data Updates

**Refresh Mechanisms:**

- Automatic polling every 15 seconds for pool data
- React Query caching (30-60 second stale time)
- Manual refetch buttons where appropriate
- Optimistic updates for transactions
- Loading states during fetches
- Error boundaries for failed requests

### 5.3 Synthetic Data Fallback

**Purpose:** Development and testing without blockchain dependency

**Synthetic Data Files:**

- `src/data/synthetic/pools.ts` - Pool overviews
- `src/data/synthetic/metrics.ts` - Depositor distribution, fees
- `src/data/synthetic/admin.ts` - Admin audit log

**Features:**

- Realistic data structures
- Matches production types
- Easily switchable to real data
- Useful for UI development and testing

---

## Transaction Management

### 6.1 Transaction Building

**File:** `src/lib/suiTransactions.ts`

**Functions:**

1. **buildDepositTransaction:**

   - Coin selection and splitting
   - Referral integration
   - Gas payment handling
   - SUI-specific logic (deposit + gas)
   - Type safety with generated bindings
   - Error handling for insufficient funds

2. **buildWithdrawTransaction:**

   - Partial withdrawal support
   - Amount-based or share-based
   - Coin transfer back to user
   - Gas payment setup

3. **buildWithdrawAllTransaction:**
   - Full position withdrawal
   - Automatic share calculation
   - Same gas handling as partial

**Gas Management:**

- Default gas budget: 0.5 SUI (500_000_000 MIST)
- Gas payment explicitly set
- SUI deposit: uses separate coin for gas
- Non-SUI deposit: uses SUI for gas
- Minimum gas balance validation (0.01 SUI)

### 6.2 Transaction Execution

**Flow:**

```
User Action → Build Transaction → Sign with Wallet → Execute on Chain → Update UI
```

**States:**

- `idle` - No transaction in progress
- `pending` - Transaction being processed
- `success` - Transaction confirmed on chain
- `error` - Transaction failed

**Error Handling:**

- Insufficient balance detection
- Gas fee validation
- Network errors
- User rejection handling
- Detailed error messages

**Success Handling:**

- Success notification
- Automatic data refresh
- Transaction digest logging
- UI state updates

### 6.3 Transaction History

**Features:**

- Complete transaction log per user
- Filterable by pool
- Sortable by time
- Links to Sui Explorer
- Shows all deposits and withdrawals
- Real-time updates
- Formatted amounts with symbols

---

## Theming & Design System

### 7.1 Color Palette

**Ocean/Leviathan Theme:**

```css
Primary Colors:
- Cyan: #22d3ee (bright accents)
- Indigo: #6366f1 (backgrounds)
- Amber: #fbbf24 (highlights, CTAs)
- Deep Blue: #0f172a (dark backgrounds)

Gradients:
- Gradient text: cyan → indigo → purple
- Card glows: cyan + amber radial gradients
- Button gradients: cyan → blue

Transparency:
- Overlays: white/10, white/5
- Borders: white/10, white/20
- Text: white/60, white/70, white/80, white/90
```

**Semantic Colors:**

- Success: Emerald/Green (#10b981)
- Error: Rose/Red (#f43f5e)
- Warning: Amber (#fbbf24)
- Info: Cyan (#22d3ee)

### 7.2 Typography

**Font Family:**

- System font stack (default)
- Fallback to sans-serif

**Text Styles:**

- Headings: Bold, gradient text effects
- Body: Regular weight, high readability
- Numbers: Tabular nums for alignment
- Monospace: For addresses and hashes

**Size Scale:**

- xs: 0.75rem
- sm: 0.875rem
- base: 1rem
- lg: 1.125rem
- xl: 1.25rem
- 2xl: 1.5rem
- 3xl: 1.875rem
- 4xl: 2.25rem
- 5xl: 3rem
- 7xl: 4.5rem

### 7.3 Component Styling

**Card Surface:**

```css
.card-surface {
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Glow Effects:**

- `.glow-cyan` - Cyan shadow glow
- `.glow-amber` - Amber shadow glow
- `.glow-cyan.glow-amber` - Combined gradient glow

**Ring Effects:**

- `.card-ring` - Animated ring border
- Combined with glows for emphasis

**Animations:**

- `pulse-glow` - Subtle pulsing effect
- `slide-in-*` - Entrance animations
- `fade-in-up` - Fade + slide up
- `scale-in` - Scale up entrance

**Buttons:**

```css
.btn-primary {
  background: linear-gradient(135deg, #22d3ee, #6366f1);
  border-radius: 1rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.3);
}

.pill {
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
}
```

### 7.4 Layout System

**Responsive Grid:**

- Mobile-first design
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Flexible grid columns (1-12)
- Gap utilities for spacing

**Spacing Scale:**

- Based on 0.25rem increments
- Consistent padding and margins
- Content max-width: 1400px

**Background Effects:**

- Gradient backgrounds (indigo → blue)
- Animated "plankton dots" (floating particles)
- Blur overlays for depth
- Multiple gradient layers

---

## Hooks & State Management

### 8.1 Custom Hooks

#### usePoolData

**Purpose:** Fetch and manage pool data  
**Features:**

- Real-time pool state
- User position fetching
- Automatic refresh (15s interval)
- Error handling
- Loading states
- Manual refetch function

**Returns:**

- `data` - Pool overview with all stats
- `userPosition` - User's position in pool
- `error` - Error object if failed
- `isLoading` - Loading state
- `refetch` - Manual refresh function

#### useUserPositions

**Purpose:** Aggregate user positions across all pools  
**Features:**

- Multi-pool position aggregation
- Interest calculation
- Real-time updates
- Fallback handling

**Returns:**

- `data` - Array of user positions
- `error` - Error state
- `isLoading` - Loading state
- `refetch` - Manual refresh

#### useCoinBalance

**Purpose:** Fetch user's coin balance  
**Features:**

- Any coin type support
- Automatic decimal conversion
- Formatted output
- Real-time updates

**Returns:**

- `formatted` - Human-readable balance with symbol
- `raw` - Raw balance string
- `isLoading` - Loading state
- `error` - Error state

#### useUserActivity

**Purpose:** Fetch user's transaction history  
**Features:**

- Supply/withdraw event aggregation
- Time-based filtering
- Formatted display data
- Transaction digest tracking

**Returns:**

- `transactions` - Array of formatted transactions
- `isLoading` - Loading state
- `error` - Error state
- `refetch` - Manual refresh

#### useSupplyWithdrawEvents

**Purpose:** Fetch and aggregate supply/withdraw events  
**Features:**

- Time range filtering
- User-specific filtering
- Daily aggregation
- Decimal conversion

**Returns:**

- `supplied` - Supply events
- `withdrawn` - Withdraw events
- `aggregated` - Aggregated time series
- `isLoading`, `error`, `refetch`

#### useLoanEvents

**Purpose:** Fetch loan borrow/repaid events  
**Features:**

- Time range support
- Manager filtering
- Event aggregation

**Returns:**

- `borrowed` - Borrow events
- `repaid` - Repay events
- `aggregated` - Aggregated time series
- `isLoading`, `error`, `refetch`

#### useLiquidationEvents

**Purpose:** Fetch liquidation events  
**Features:**

- Pool/manager filtering
- Time range support
- Real-time updates

#### useInterestRateHistory

**Purpose:** Fetch interest rate change history  
**Features:**

- Rate parameter tracking
- Time-based aggregation
- Transformation for visualization

#### usePoolConfigHistory

**Purpose:** Fetch pool configuration changes  
**Features:**

- Config parameter tracking
- Change detection
- Admin audit support

#### useElementOnScreen

**Purpose:** Detect when element enters viewport  
**Features:**

- Intersection Observer API
- Configurable threshold
- Useful for scroll animations

### 8.2 State Management

**Local State (React.useState):**

- Component-specific UI state
- Form inputs
- Modal open/close states
- Selected pool/tab

**Derived State (React.useMemo):**

- Computed values from pool data
- Filtered/sorted lists
- Formatted display data
- Chart data transformations

**Query State (React Query):**

- Cached blockchain data
- Automatic refetching
- Stale-while-revalidate pattern
- Background updates

**Wallet State (Sui dApp Kit):**

- Connected account
- Network selection
- Wallet connection status
- Transaction signing

### 8.3 Data Caching Strategy

**React Query Configuration:**

```typescript
staleTime: 30-60 seconds  // Data considered fresh
refetchInterval: 60 seconds  // Auto-refetch interval
cacheTime: 5 minutes  // Keep cached data
```

**Cache Keys:**

- Pool-specific: `['poolData', poolId]`
- User-specific: `['userPositions', address]`
- Event-specific: `['assetSupplied', params]`

**Invalidation:**

- After successful transactions
- On manual refetch
- On network switch
- On wallet disconnect

---

## Additional Features

### 9.1 Developer Tools

**Debug Information:**

- `DebugInfo` component (removable)
- Console logging for:
  - Pool data fetching
  - BCS parsing
  - Interest calculations
  - Transaction building
- Network inspection tools

### 9.2 Error Handling

**Levels:**

1. Component-level error boundaries
2. Hook-level error catching
3. API-level error responses
4. Transaction-level validation

**User-Facing Errors:**

- Toast notifications (future)
- Inline error messages
- Error state displays
- Fallback UI components

### 9.3 Performance Optimizations

**Implemented:**

- React.memo for expensive components
- useMemo for computed values
- useCallback for event handlers
- Code splitting with React.lazy (future)
- Virtualization for long lists (future)

**Bundle Size:**

- Tree-shaking enabled
- Production builds optimized
- Asset optimization with Bun

### 9.4 Accessibility

**Features:**

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Color contrast compliance (WCAG AA)

### 9.5 Responsive Design

**Mobile Support:**

- Touch-friendly buttons (44px+ hit areas)
- Responsive grids
- Collapsible navigation
- Horizontal scroll for tables
- Optimized charts for small screens

**Tablet Support:**

- Medium breakpoint layouts
- Adaptive grid columns
- Touch and hover states

**Desktop Support:**

- Large viewport optimizations
- Sidebar navigation
- Multi-column layouts
- Hover effects

---

## Configuration Files

### 10.1 Contract Configuration

**File:** `src/config/contracts.ts`

- Network-specific contract addresses
- Package IDs
- Pool IDs
- Referral objects
- Coin type definitions

### 10.2 API Configuration

**File:** `src/config/api.ts`

- Event API base URLs
- Endpoint definitions
- Default parameters

### 10.3 Constants

**File:** `src/constants/index.ts`

- `ONE_BILLION` - Decimal conversion constant (1e9)
- `GAS_AMOUNT_MIST` - Gas amount in MIST (0.2 SUI)
- `MIN_GAS_BALANCE_SUI` - Minimum SUI for gas (0.01)
- `MIN_DEPOSIT_AMOUNT` - Minimum deposit threshold

---

## Testing & Development

### 11.1 Development Scripts

```bash
bun dev           # Start dev server with hot reload
bun build         # Build for production
bun preview       # Preview production build
bun codegen       # Generate TypeScript from Move contracts
bun lint          # Run ESLint
bun mint-referral # Script to mint referral objects
```

### 11.2 Testing Strategy

**Current State:**

- Manual testing in development
- Blockchain integration testing on testnet

**Future Improvements:**

- Unit tests for utilities
- Component tests with React Testing Library
- Integration tests for blockchain interactions
- E2E tests for critical user flows

---

## Future Enhancements & Roadmap

### Planned Features (Not Yet Implemented)

1. **Advanced Analytics:**

   - APR history over time
   - TVL trends
   - Utilization heatmaps
   - Comparative pool performance

2. **User Features:**

   - Notification system for rate changes
   - Position alerts
   - Yield optimization recommendations
   - Portfolio tracking across multiple addresses

3. **Pool Features:**

   - Multi-pool strategies
   - Auto-rebalancing
   - Compound interest reinvestment
   - Batch transactions

4. **Admin Features:**

   - Real-time parameter adjustment monitoring
   - Risk analytics dashboard
   - Emergency action panels

5. **Integration:**

   - Multiple DeepBook pools
   - Cross-chain bridges (future)
   - Additional asset support
   - Integration with other DeFi protocols

6. **UI/UX:**
   - Dark/light theme toggle (currently ocean theme only)
   - Customizable dashboard layouts
   - Advanced filtering and sorting
   - Export data functionality

---

## API Reference

### Pool Data Types

```typescript
interface PoolOverview {
  id: string;
  asset: "SUI" | "DBUSDC";
  state: {
    supply: number;
    borrow: number;
    share_index: number;
  };
  protocolConfig: {
    margin_pool_config: {
      supply_cap: number;
      protocol_spread: number;
      min_borrow: number;
      max_utilization_rate: number;
    };
    interest_config: {
      base_rate: number;
      base_slope: number;
      optimal_utilization: number;
      excess_slope: number;
    };
  };
  contracts: {
    marginPoolId: string;
    registryId: string;
    coinType: string;
    coinDecimals: number;
    marginPoolType: string;
    referralId: string;
  };
  ui: {
    aprSupplyPct: number;
    aprBorrowPct: number;
    depositors: number;
    deepbookPoolId: string;
  };
}

interface UserPosition {
  address: string;
  asset: "SUI" | "DBUSDC";
  shares: string;
  balance: string;
  balanceFormatted: string;
  shareIndex: string;
}
```

---

## Architecture Patterns

### Data Flow Pattern

```
Component → Hook → API/Blockchain → Transform → Component
```

### Component Hierarchy

```
App (Router)
├── LandingPage
│   ├── LandingNavBar
│   └── LandingPoolCard
└── MainLayout
    ├── NavBar
    └── PoolsPage
        ├── DashboardNav
        ├── PoolCards
        ├── DepositWithdrawPanel
        ├── PersonalPositions
        ├── YieldCurve
        ├── HistoricalActivity
        ├── DepositorDistribution
        ├── ProtocolFees
        ├── SlidePanel
        │   ├── PoolAdmin
        │   └── DepositHistory
        └── DebugInfo
```

---

## Dependencies Overview

**Core Dependencies:**

- `react` & `react-dom` - UI framework
- `@mysten/sui` - Sui blockchain SDK
- `@mysten/dapp-kit` - Wallet integration
- `@mysten/bcs` - BCS parsing
- `@tanstack/react-query` - Data fetching & caching
- `react-router-dom` - Routing
- `recharts` - Data visualization
- `@heroicons/react` - Icon library
- `tailwindcss` - Styling

**Dev Dependencies:**

- `bun` - Runtime and bundler
- `@mysten/codegen` - Contract code generation
- `eslint` - Linting
- `typescript` - Type safety

---

## Deployment

### Build Process

1. Generate CSS: `bun scripts/build-css.ts`
2. Build app: `bun build ./src/main.tsx --outdir ./dist`
3. Copy index.html to dist folder
4. Deploy dist folder to hosting

### Environment Variables

- No environment variables currently required
- All configuration is in source files

### Hosting Recommendations

- Static hosting (Vercel, Netlify, Cloudflare Pages)
- CDN for assets
- HTTPS required for wallet connections

---

## Troubleshooting Common Issues

### Issue: "Insufficient SUI for gas fees"

**Solution:** Ensure wallet has at least 0.01 SUI for gas

### Issue: Pool data not loading

**Solution:** Check network connection, verify pool IDs, check RPC endpoint

### Issue: Transaction fails

**Solution:** Check gas balance, validate amounts, ensure wallet is connected to correct network

### Issue: Interest calculation showing 0

**Solution:** Pool might be new with no accrued interest, check share_index updates

---

## Contact & Support

**Documentation:** This file (FEATURES.md)  
**Smart Contracts:** DeepBook Margin Protocol on Sui  
**Network:** Sui Testnet (for current deployment)

---

**End of Documentation**

This document serves as the comprehensive reference for all features currently implemented in the Leviathan Margin Dashboard. It should be updated whenever new features are added or existing features are modified.
