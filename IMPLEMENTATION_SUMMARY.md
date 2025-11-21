# DeepBook Margin Dashboard - Implementation Summary

## Overview

This document describes the comprehensive dashboard implementation for DeepBook Margin protocol. The dashboard provides a user-friendly interface to view all protocol metrics, lending activity, borrowing activity, liquidations, and administrative actions.

## What Was Implemented

### 1. **Global Metrics Panel**

- **Location:** `src/features/lending/components/GlobalMetricsPanel.tsx`
- **Features:**
  - Total Value Locked (TVL) across all margin pools
  - Total Borrowed amount
  - Total Supply (assets supplied by lenders)
  - Active Margin Managers count
  - Total Liquidations count
- **Data Source:** Aggregates data from on-chain pool objects and event history

### 2. **Enhanced Pool Analytics**

- **Location:** `src/features/lending/components/EnhancedPoolAnalytics.tsx`
- **Features:**
  - Real-time vault balance (available liquidity)
  - Total supply with accrued interest
  - Total borrowed amount
  - Utilization rate with visual progress bar
  - Borrow APR (what borrowers pay)
  - Supply APR (what suppliers earn)
  - Complete pool configuration display
  - Interest rate model parameters with formula
- **Data Source:** Direct BCS parsing from MarginPool on-chain object

### 3. **Supplier Analytics**

- **Location:** `src/features/lending/components/SupplierAnalytics.tsx`
- **Features:**
  - Top 20 suppliers by net supply ranking
  - Unique supplier count
  - New suppliers in last 24 hours
  - Total transaction count
  - Supply/withdraw activity feed
  - Time range filtering (1W, 1M, 3M, YTD, ALL)
- **Data Source:** AssetSupplied and AssetWithdrawn events from API

### 4. **Borrower Overview**

- **Location:** `src/features/lending/components/BorrowerOverview.tsx`
- **Features:**
  - Total margin managers count
  - New managers in last 24 hours
  - Active trading pools count
  - Managers per DeepBook pool distribution
  - Recently created managers list
- **Data Source:** MarginManagerCreated events from API

### 5. **Liquidation Dashboard**

- **Location:** `src/features/lending/components/LiquidationDashboard.tsx`
- **Features:**
  - Total liquidations count
  - Liquidation volume
  - Rewards distributed
  - Bad debt incurred
  - Complete liquidation history table
  - Bad debt alert monitor
  - Time range filtering
- **Data Source:** Liquidation events from API

### 6. **Administrative Panel**

- **Location:** `src/features/lending/components/AdministrativePanel.tsx`
- **Features:**
  - Maintainer fees withdrawn history
  - Protocol fees withdrawn history
  - Interest rate updates log with before/after values
  - Pool configuration updates log
  - DeepBook pool enabled/disabled changes
  - Summary KPI cards
  - Time range filtering
- **Data Source:** Multiple admin-related events (MaintainerFeesWithdrawn, ProtocolFeesWithdrawn, InterestParamsUpdated, MarginPoolConfigUpdated, etc.)

### 7. **Section Navigation**

- **Location:** `src/features/shared/components/SectionNav.tsx`
- **Features:**
  - Tab-based navigation for 5 main sections:
    - Overview (protocol metrics + pool selection)
    - Lending (supplier analytics)
    - Borrowing (margin manager analytics)
    - Liquidations (liquidation history & monitoring)
    - Admin (fee withdrawals & config changes)
  - Desktop: Beautiful horizontal tabs with icons
  - Mobile: Dropdown selector
- **Design:** Ocean-themed with gradient highlights

### 8. **Custom Hooks**

- **useProtocolMetrics** (`src/hooks/useProtocolMetrics.ts`)
  - Aggregates protocol-wide metrics
  - Auto-refreshes every 30 seconds
- **useMarginManagers** (`src/hooks/useMarginManagers.ts`)
  - Fetches and analyzes margin manager data
  - Provides manager distribution by pool
  - Tracks recent manager creation
- **useMarginManagerState** (`src/hooks/useMarginManagers.ts`)
  - Fetches on-chain state for specific margin manager
  - Parses BCS data for detailed position info

### 9. **Reorganized PoolsPage**

- **Location:** `src/pages/PoolsPageNew.tsx`
- **Structure:**
  - Global metrics at the top
  - Section navigation tabs
  - Content dynamically switches based on selected section
  - Maintains existing deposit/withdraw functionality
  - All features accessible without complex navigation

## Key Design Decisions

### 1. **Data Architecture**

- **On-Chain Objects:** Used for current state (pool balances, configurations, vault)
- **Events:** Used for historical data (supply/withdraw activity, liquidations, admin changes)
- **Hybrid Approach:** Combines both for complete picture

### 2. **User Experience**

- **Single Page:** All information accessible from one page with tabs
- **No Deep Navigation:** Users don't need to click through multiple pages
- **Contextual Data:** Information grouped logically by user role:
  - Suppliers see supply analytics in Lending tab
  - Borrowers see margin manager analytics in Borrowing tab
  - Liquidators see opportunities in Liquidations tab
  - Admins see fee withdrawals and config changes in Admin tab

### 3. **Performance**

- **Auto-Refresh:** Protocol metrics refresh every 30 seconds
- **Time Range Filters:** Users can adjust data scope to reduce load
- **Lazy Loading:** Only active section's data is actively displayed

### 4. **Data Formatting**

- **Decimal Conversion:** Properly handles 9-decimal (SUI) and 6-decimal (DBUSDC) values
- **9-Decimal Config Values:** All config values (interest rates, spreads) use 9-decimal format
- **Address Truncation:** Long addresses shown as `0x1234...5678` for readability
- **Percentages:** Consistently formatted with 2-3 decimal places

## How to Use

### For Suppliers/Lenders

1. Navigate to **Overview** tab
2. View global TVL and your positions
3. Select a pool and deposit/withdraw
4. Switch to **Lending** tab to see:
   - Top suppliers ranking
   - Your position relative to others
   - Recent supply/withdraw activity

### For Borrowers/Margin Traders

1. Switch to **Borrowing** tab
2. View all margin managers across pools
3. See distribution by DeepBook trading pools
4. Track recently created managers

### For Liquidators

1. Switch to **Liquidations** tab
2. View liquidation history
3. Monitor bad debt
4. Track liquidation rewards

### For Protocol Admins

1. Switch to **Admin** tab
2. View all fee withdrawals
3. Track interest rate changes over time
4. Monitor pool configuration updates
5. See DeepBook pool enabled/disabled changes

## Integration Points

### API Endpoints

All event data comes from:

- Base URL configured in `src/config/api.ts`
- Default: `http://localhost:9008`
- Override with `API_URL` environment variable

### On-Chain Data

- Fetched via `@mysten/dapp-kit` hooks
- Network configured in app (testnet/mainnet/localnet)
- Pool IDs from `src/config/contracts.ts`

### Generated Contracts

- BCS parsing types in `src/contracts/deepbook_margin/`
- Auto-generated from Move contracts
- Ensures type safety

## File Structure

```
src/
├── hooks/
│   ├── useProtocolMetrics.ts          # Protocol-wide aggregated metrics
│   ├── useMarginManagers.ts           # Margin manager analytics
│   ├── usePoolData.ts                 # Individual pool data (existing)
│   └── useUserPositions.ts            # User positions (existing)
├── features/
│   ├── lending/
│   │   ├── components/
│   │   │   ├── GlobalMetricsPanel.tsx         # Protocol overview KPIs
│   │   │   ├── EnhancedPoolAnalytics.tsx      # Detailed pool info
│   │   │   ├── SupplierAnalytics.tsx          # Supplier rankings & activity
│   │   │   ├── BorrowerOverview.tsx           # Margin manager overview
│   │   │   ├── LiquidationDashboard.tsx       # Liquidation history & monitor
│   │   │   ├── AdministrativePanel.tsx        # Admin actions & config changes
│   │   │   └── ... (existing components)
│   │   └── api/
│   │       └── events.ts                      # Event API functions (existing)
│   └── shared/
│       └── components/
│           └── SectionNav.tsx                 # Tab navigation
└── pages/
    └── PoolsPageNew.tsx                       # Reorganized main page
```

## Technical Notes

### Why Separate Files?

- **Modularity:** Each feature is self-contained
- **Maintainability:** Easy to update individual sections
- **Performance:** Can optimize rendering per component
- **Reusability:** Components can be used elsewhere if needed

### Event API vs On-Chain Objects

| Use Case            | Data Source            | Why                                                  |
| ------------------- | ---------------------- | ---------------------------------------------------- |
| Current pool state  | On-chain objects (BCS) | Most up-to-date, includes vault balance              |
| Historical activity | Event API              | Efficient for time series, no need to replay history |
| User positions      | On-chain objects       | Current balance with interest                        |
| Liquidation history | Event API              | Complete historical record                           |
| Config changes      | Event API              | Track all changes over time                          |

### Performance Considerations

- **Initial Load:** Fetches all pools + protocol metrics (~2-3 API calls)
- **Tab Switch:** Only loads data for active tab
- **Auto-Refresh:** 30-second interval for protocol metrics
- **Event Queries:** Limited to 1000-5000 events with time range filters

## Future Enhancements (Not Implemented)

1. **Real-time WebSocket Updates**
   - Currently polls every 30 seconds
   - Could add WebSocket for instant updates

2. **Liquidation Opportunities**
   - Would require fetching all active margin managers
   - Calculate risk ratios in real-time
   - Flag at-risk positions

3. **Referral Analytics**
   - Track referral usage and fees earned
   - Top referrers leaderboard

4. **Export Functionality**
   - CSV export of tables
   - Historical data download

5. **Notifications**
   - Alert users of rate changes
   - Notify of position risks

## Conclusion

This implementation provides a comprehensive, user-friendly dashboard that presents all DeepBook Margin protocol information in a logical, streamlined way. The tab-based navigation ensures users can quickly access the information relevant to their role without complex navigation or information duplication.
