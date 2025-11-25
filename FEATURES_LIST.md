# 🌊 Leviathan Margin Dashboard - Features List

> **Living Document** - Last Updated: November 25, 2025  
> Quick reference guide to what the application can do

---

## 🎯 Overview

Leviathan is a comprehensive dashboard for monitoring and interacting with DeepBook Margin lending pools on the Sui blockchain. Users can supply liquidity to margin pools and earn competitive yields from borrowers.

**Supported Networks:** Testnet, Mainnet  
**Supported Pools:** All margin pools currently available for deposit and withdraw

---

## 🏠 Landing Page Features

**Route:** `/`

- ✨ **Hero Section** with animated title and tagline
- 📊 **Live Pool Cards** showing:
  - Current Supply APR
  - Pool utilization
  - Total Value Locked (TVL)
  - Active depositor count
- 🚀 **Quick Start Guide** - 3-step onboarding
- 📚 **Educational Content** about DeepBook Margin
- 🎨 **Feature Preview Cards** highlighting key capabilities
- 🔒 **Trust & Transparency Section**
- ⚡ **Real-time Data** with automatic fallback to synthetic data
- 🎬 **Smooth Animations** (fade-in, slide-in effects)

---

## 💼 Main Dashboard Features

**Routes:** `/pools` or `/dashboard`

### 1. Pool Management

#### 📈 Pool Cards

- View all available pools
- Key metrics at a glance:
  - Supply (TVL) with progress bar
  - Total Borrow amount
  - Pool Utilization percentage
  - Current Supply APR
  - Number of depositors
- Links to DeepBook Pool settings:
  - Liquidation levels
  - Minimum borrow levels
  - Deep pool configuration history
- Liquidity health checks
- Quick deposit buttons
- Pool selection and highlighting
- Admin audit panel showing lifecycle of objects and maintainer cap holders

#### 💰 Deposit & Withdraw Panel

**Deposit Tab:**

- Amount input with decimal precision (up to 6 decimals)
- Quick percentage buttons (25%, 50%, 75%, 100%)
- Real-time balance display
- Projected 1-year returns from deposit using current APR
- Gas fee validation (0.01 SUI minimum)
- Min borrow and supply cap enforcement
- Transaction status feedback
- Auto-rounded balance display

**Withdraw Tab:**

- Partial withdrawal support
- Withdraw all functionality
- Real-time balance tracking
- Transaction status feedback
- Gas fee validation

**Smart Validations:**

- Insufficient balance detection
- Gas availability check
- Minimum deposit enforcement
- Supply cap validation

#### 📜 Deposit/Withdraw History

**Location:** Slide panel (50% viewport width)

- User-specific transaction history
- Sortable table with:
  - Timestamp
  - Type (Supply/Withdraw with color coding)
  - Asset
  - Amount (formatted)
  - Shares (minted/burned)
  - Transaction link to Sui Explorer
- Real-time data from blockchain events
- Time-based filtering
- External links to transaction details

#### 📍 Personal Positions

- Real-time position tracking across all pools
- View deposited amounts with accrued interest
- Interest earned calculation
- Deposit history access
- Empty state for new users
- Wallet connection prompts

---

### 2. Analytics & Visualization

#### 📊 Yield Curve Visualization

- Interactive utilization curve chart
- Real-time KPI cards:
  - Supply APR (supplier earnings)
  - Borrow APR (borrower costs)
  - Current utilization percentage
- Piecewise linear curve showing:
  - Base rate + base slope
  - Kink point at optimal utilization
  - Excess slope above optimal
- Interest rate parameter update history over time
- Historical yield curve visualization showing how rates have changed
- Reference lines for current and optimal utilization
- Hover tooltips with exact values
- Parameter breakdown cards
- Mathematical formula explanations

#### 👥 Depositor Distribution

- KPI cards showing:
  - Unique depositor count
  - Top 10 share percentage
  - Concentration risk with Gini coefficient & HHI
- Interactive pie chart (donut style):
  - Top suppliers visualization
  - Gradient fills
  - Hover tooltips
- Top suppliers list table:
  - Masked addresses for privacy
  - Color-coded indicators
  - Share percentages

#### 💵 Protocol Fees & Liquidations

- Summary KPI cards:
  - Cumulative fees (since inception)
  - 24-hour fees
  - 7-day fees
  - Total liquidation events
- Composed chart showing:
  - Stacked bars (protocol fees, liquidation rewards, defaults)
  - Cumulative fees line
- Detailed breakdown:
  - Spread fees
  - Liquidation rewards
  - Pool losses (defaults)

---

### 3. Admin & History

#### 🔧 Pool Admin Audit

**Location:** Slide panel (50% viewport width)

- Shows admin lifecycle of objects
- Displays who the admins are through maintainer cap
- Links to SuiVision for on-chain object transparency
- Complete admin configuration change log
- Summary cards:
  - Total changes
  - Interest parameter updates
  - Pool config updates
  - DeepBook link updates
- Chronological history feed (most recent first)
- Event types tracked:
  - Interest Parameter Updates (base rate, slopes, optimal utilization)
  - Pool Configuration Updates (supply cap, max utilization, spread, min borrow)
  - DeepBook Link Updates (pool ID, cap ID, enabled status)
- Before/after comparisons with visual indicators

---

## 🎨 UI/UX Features

### Wallet Features

- 🔐 **Multi-Wallet Support:**
  - Sui Wallet
  - Suiet Wallet
  - Other Sui-compatible wallets
- 🔄 **Auto-connect** on return visits
- 💾 **Persistent connection state**
- 🌐 **Network Switcher** (Testnet/Mainnet)
- 🔍 **View on Sui Explorer** links

### Transaction Management

- 🔐 **Secure wallet signing**
- ⛽ **Smart gas management:**
  - Default budget: 0.5 SUI
  - Minimum balance validation (0.01 SUI)
  - Separate gas handling for SUI deposits
- ✅ **Transaction states:**
  - Idle, Pending, Success, Error
- 🔔 **Status feedback** with detailed error messages
- 🔄 **Automatic data refresh** after transactions

### Design System

- 🌊 **Ocean/Leviathan Theme:**
  - Cyan, indigo, amber color palette
  - Gradient text effects
  - Glass morphism backgrounds
  - Card glow effects
  - Animated submarine icon
- 🎬 **Smooth Animations:**
  - Fade-in, slide-in, scale-in effects
  - Pulse glow effects
  - Scroll-triggered animations
- 📱 **Fully Responsive:**
  - Mobile-first design
  - Touch-friendly buttons
  - Adaptive layouts
  - Optimized charts for all screens

### Interactive Components

- 💡 **Tooltips** for parameter explanations
- 📊 **Interactive Charts** with hover states
- 🎚️ **Slide Panels** for detailed views
- ⏱️ **Loading Skeletons** for smooth UX
- 📭 **Empty States** for no-data scenarios
- 🎯 **Quick Action Buttons** throughout

### Navigation

- 🧭 **Landing Navigation Bar:**
  - Branding with gradient effects
  - Launch App button
  - Wallet connection
- 📍 **Dashboard Navigation:**
  - Horizontal nav with anchor links
  - Active section highlighting
  - Smooth scroll behavior
  - Network switcher

---

## 📊 Real-Time Features

### Data Updates

- 🔄 **Auto-refresh** every 15 seconds for pool data
- 💾 **React Query caching** (30-60 second stale time)
- ⚡ **Optimistic updates** for transactions
- 🌐 **Real-time event tracking** from blockchain

### Dynamic APR Calculations

- 📈 **Supply APR:**
  - Based on current utilization
  - Adjusted for protocol spread
  - Real-time recalculation
- 💰 **Interest Earned Tracking:**
  - Share index growth calculation
  - Current balance = shares × share index
  - Formatted with proper decimals

---

## 🚀 Quick Actions Available

### For Suppliers (Depositors)

- ✅ Connect Sui wallet
- ✅ View live pool statistics
- ✅ Deposit to any available margin pool
- ✅ Withdraw funds (partial or full)
- ✅ Track positions across pools
- ✅ View earned interest
- ✅ Check transaction history
- ✅ Monitor APR changes

### For Observers (Non-depositors)

- ✅ Browse pool statistics
- ✅ View yield curves
- ✅ Analyze historical activity
- ✅ Check depositor distribution
- ✅ Monitor protocol fees
- ✅ Review admin changes
- ✅ Compare pool performance

### For Administrators

- ✅ Monitor all pool parameters
- ✅ Track configuration changes
- ✅ Audit interest rate adjustments
- ✅ Review DeepBook integrations
- ✅ Analyze concentration risk
- ✅ Track liquidation events

---

## 🎯 Use Cases

1. **💰 Earn Yield**
   - Deposit idle SUI or DBUSDC
   - Earn competitive APR from borrowers
   - Monitor interest accrual in real-time

2. **📊 Monitor Performance**
   - Track pool utilization trends
   - Compare historical APR changes
   - Analyze depositor distribution

3. **🔍 Due Diligence**
   - Review pool parameters
   - Check concentration risk
   - Monitor admin changes
   - Verify protocol fees

4. **⚖️ Risk Management**
   - Monitor utilization rates
   - Track liquidation events
   - Analyze interest rate curves
   - Check supply caps

---

## 📝 Summary Table

| Category               | Features Count                         |
| ---------------------- | -------------------------------------- |
| **Pages**              | 2 (Landing, Dashboard)                 |
| **Pool Operations**    | 2 (Deposit, Withdraw)                  |
| **Analytics Views**    | 3 (Yield Curve, Distribution, Fees)    |
| **Admin Panels**       | 1 (Audit Log with Transaction History) |
| **Supported Networks** | 2 (Testnet, Mainnet)                   |
| **Chart Types**        | 3 (Line, Pie, Composed)                |
| **UI Components**      | 15+ (Tooltips, panels, cards, etc.)    |
| **Wallet Support**     | Multiple (Sui Wallet, Suiet, others)   |

---

**🌊 Dive deep with Leviathan - Your gateway to DeepBook Margin Protocol**

---

_This document is a living reference and will be updated as new features are added._
