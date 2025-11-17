# Quick Start Guide - New Dashboard Features

## What Changed

Your DeepBook Margin dashboard now has comprehensive analytics organized into **5 intuitive tabs**:

1. **Overview** - Protocol metrics, pool selection, and your positions
2. **Lending** - Supplier rankings and supply activity
3. **Borrowing** - Margin manager analytics and distribution
4. **Liquidations** - Liquidation history and bad debt monitoring
5. **Admin** - Fee withdrawals and configuration changes

## How to Test

### 1. Start the Development Server
```bash
bun dev
```

### 2. Navigate to Dashboard
Go to `http://localhost:5173/pools` (or click "Launch App" from landing page)

### 3. Explore Each Tab

#### Overview Tab
- **Top Section:** See protocol-wide metrics (TVL, Total Borrowed, Active Managers, etc.)
- **Pool Cards:** Select SUI or DBUSDC pool
- **Deposit/Withdraw:** Existing functionality preserved
- **Your Positions:** See your positions with deposit history button
- **Pool Analytics:** Expanded to show vault balance, utilization, APRs
- **Yield Curve:** Interest rate visualization

#### Lending Tab  
- View top 20 suppliers by net supply
- See supply/withdraw activity feed
- Adjust time range (1W, 1M, 3M, YTD, ALL)
- Track new suppliers in last 24 hours

#### Borrowing Tab
- See total margin managers
- View distribution across DeepBook pools
- Track recently created managers (last 24h)
- Visual bar charts for pool distribution

#### Liquidations Tab
- View liquidation history table
- See total liquidations, volume, rewards
- **Red Alert:** Shows if any bad debt incurred
- Filter by time range
- Sort by most recent

#### Admin Tab
- View fee withdrawal history (Maintainer + Protocol)
- See interest rate updates with before/after values
- Track pool configuration changes
- Monitor DeepBook pool enabled/disabled changes
- Filter by time range

### 4. Test Wallet Connection
- **Connect wallet** to see your positions in Overview
- Deposit/withdraw still works as before
- View your transaction history in the slide panel

## Key Features

### Navigation
- **Desktop:** Beautiful tab bar at the top with icons
- **Mobile:** Dropdown selector
- **Fast switching:** No page reloads, instant tab switching

### Data Sources
- **Real-time:** Pool state fetched from blockchain every 15 seconds
- **Historical:** Events fetched from API with time range filters
- **Accurate:** Uses proper decimal conversion (9 for SUI, 6 for DBUSDC)

### Time Range Filters
Available on Lending, Liquidations, and Admin tabs:
- **1W** - Last 7 days
- **1M** - Last 30 days
- **3M** - Last 90 days
- **YTD** - Year to date
- **ALL** - All time

## What Didn't Change

✅ **Deposit/Withdraw functionality** - Works exactly as before  
✅ **Personal positions** - Still shows your deposits with interest  
✅ **Wallet connection** - Same flow  
✅ **Pool selection** - Same pool cards  
✅ **Transaction history** - Same slide panel

## API Configuration

The dashboard expects an events API running at:
- **Default:** `http://localhost:9008`
- **Override:** Set `VITE_API_URL` environment variable

Example:
```bash
VITE_API_URL=https://events-api.deepbook.tech bun dev
```

## Architecture

```
┌─────────────────────────────────────────┐
│         Global Metrics Panel            │
│  TVL | Borrowed | Supply | Managers     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Section Navigation              │
│  Overview | Lending | Borrowing | ...   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│         Active Section Content          │
│  (Only one section visible at a time)   │
└─────────────────────────────────────────┘
```

## Components Created

1. `GlobalMetricsPanel.tsx` - Protocol overview KPIs
2. `EnhancedPoolAnalytics.tsx` - Detailed pool information
3. `SupplierAnalytics.tsx` - Supplier rankings and activity
4. `BorrowerOverview.tsx` - Margin manager overview
5. `LiquidationDashboard.tsx` - Liquidation history
6. `AdministrativePanel.tsx` - Admin actions and configs
7. `SectionNav.tsx` - Tab navigation component

## Hooks Created

1. `useProtocolMetrics` - Aggregates protocol-wide data
2. `useMarginManagers` - Fetches margin manager analytics
3. `useMarginManagerState` - Gets on-chain state for specific manager

## Troubleshooting

### "No data showing"
- Check if API is running at `http://localhost:9008`
- Check browser console for errors
- Try switching to testnet if on localnet

### "Events not loading"
- Verify API endpoint in `src/config/api.ts`
- Check network connectivity
- Look for CORS issues in console

### "Pool data not loading"
- Check wallet is connected to correct network
- Verify pool IDs in `src/config/contracts.ts`
- Check RPC endpoint is responsive

### "Linting errors"
All files have been checked and should have no linting errors. If you see any:
```bash
bun run lint
```

## Next Steps

1. **Test each tab** with real data
2. **Adjust time ranges** to see different data scopes
3. **Connect wallet** to see personal positions
4. **Customize styling** if needed (all components use Tailwind)
5. **Add more features** using the same pattern

## Questions?

Check these files for reference:
- `IMPLEMENTATION_SUMMARY.md` - Detailed technical documentation
- `FEATURES.md` - Original features documentation
- `EVENTS_DATESET.md` - Event types and structures

Enjoy your enhanced dashboard! 🚀

