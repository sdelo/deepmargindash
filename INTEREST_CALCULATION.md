# Interest Calculation System

## Overview

This document explains how the DeepDashboard calculates interest earned on user deposits in the DeepBook Margin lending pools.

## How the Move Contract Works

The DeepBook Margin contract uses a **share-based accounting system** to track user deposits and calculate interest:

### Core Concepts

1. **Shares are constant**: When a user deposits, they receive shares. These shares never change (unless they deposit/withdraw more).

2. **Ratio increases over time**: The share-to-amount ratio increases as interest accrues to the pool.

3. **No historical ratio storage**: The contract does NOT store historical ratios. It only stores:
   - `total_supply`: Current total supply in the pool (including accrued interest)
   - `supply_shares`: Total shares issued across all users
   - User shares: Each user's share count (stored in `PositionManager`)

### Key Functions

From `margin_state.move`:

```move
/// Calculate current supply ratio
public(package) fun supply_ratio(self: &State): u64 {
    if (self.supply_shares == 0) {
        constants::float_scaling()  // 1e9 when pool is empty
    } else {
        math::div(self.total_supply, self.supply_shares)
    }
}

/// Convert shares to amount using current ratio
public(package) fun supply_shares_to_amount(
    self: &State,
    shares: u64,
    config: &ProtocolConfig,
    clock: &Clock,
): u64 {
    // Calculate accrued interest since last update
    let interest = config.calculate_interest_with_borrow(...);
    let protocol_fees = math::mul(interest, config.protocol_spread());
    let supply = self.total_supply + interest - protocol_fees;
    
    // Calculate current ratio
    let ratio = if (self.supply_shares == 0) {
        constants::float_scaling()
    } else {
        math::div(supply, self.supply_shares)
    };
    
    // Return: shares × current_ratio
    math::mul(shares, ratio)
}
```

### Deposit Flow

When a user deposits:
1. Contract calculates current ratio: `ratio = total_supply / supply_shares`
2. User receives shares: `shares = deposit_amount / ratio`
3. Event is emitted: `AssetSupplied { supply_amount, supply_shares, ... }`
4. The event contains BOTH amount and shares, giving us the exact ratio at deposit time!

### View Functions

The contract exposes two public view functions:

```move
// Get user's share count
public fun user_supply_shares<Asset>(self: &MarginPool<Asset>, supplier_cap_id: ID): u64

// Get user's current value (shares × current_ratio)
public fun user_supply_amount<Asset>(
    self: &MarginPool<Asset>,
    supplier_cap_id: ID,
    clock: &Clock,
): u64
```

## Calculating Interest Earned

To calculate interest earned, we need:
- **Current Value**: What the user's shares are worth now
- **Original Value**: What the user paid for those shares (cost basis)
- **Interest** = Current Value - Original Value

### Current Value (From Chain)

We call the `user_supply_amount` view function using `devInspectTransactionBlock`:

```typescript
const currentValue = await fetchUserCurrentSupply(
  suiClient,
  poolId,
  supplierCapId,
  poolType,
  packageId
);
// Returns: shares × current_ratio (in smallest token units)
```

This is implemented in `src/api/onChainReads.ts`.

### Original Value (From Events)

**The Move contract CANNOT provide this directly** because it doesn't store historical ratios or deposit amounts.

Instead, we use blockchain events (`AssetSupplied` and `AssetWithdrawn`) which contain both amounts and shares:

```typescript
// Each supply event tells us: amount deposited and shares received
// This lets us reconstruct the ratio at deposit time
const ratioAtDeposit = event.supply_amount / event.supply_shares;

// For users with multiple deposits/withdrawals, we use weighted-average cost accounting
// 1. Sum all tokens spent to acquire shares
// 2. When shares are withdrawn, remove proportional cost basis
// 3. Calculate average cost per share for remaining position

const avgCostPerShare = (totalCostPaid * SCALING) / totalSharesAcquired;
const originalValue = (currentShares * avgCostPerShare) / SCALING;
```

**Weighted-Average Example:**
- Deposit 100 tokens at ratio 1.0 → get 100 shares (cost: 100 tokens)
- Deposit 110 tokens at ratio 1.1 → get 100 shares (cost: 110 tokens)
- Total: 200 shares, 210 tokens spent
- Withdraw 50 shares → remove (210/200) × 50 = 52.5 tokens from cost basis
- Remaining: 150 shares, 157.5 tokens cost basis
- Average cost per share: 157.5 / 150 = 1.05

This is implemented in `src/api/userHistory.ts` with high-precision BigInt arithmetic.

### Interest Earned

```typescript
const interestEarned = currentValue - originalValue;
```

## Why We Need the Indexer

**The indexer is REQUIRED to calculate interest earned** because:

1. The Move contract only stores current state (total_supply, supply_shares, user shares)
2. The Move contract does NOT store historical ratios
3. We need the ratio at deposit time to calculate cost basis
4. This ratio is captured in `AssetSupplied` events
5. Events can only be fetched from an indexer (or by replaying the entire blockchain history)

Without the indexer:
- ✅ We can show current value (from `user_supply_amount`)
- ❌ We CANNOT calculate interest earned (no historical ratio data)
- ⚠️ We could approximate by assuming ratio was 1.0 at deposit, but this would be inaccurate for:
  - Users who deposited after the pool had already accrued interest
  - Users with multiple deposits at different times

## Implementation

### Files

- **`src/api/onChainReads.ts`**: Calls `user_supply_amount` view function to get current value
- **`src/api/userHistory.ts`**: Fetches events and calculates weighted average cost basis
- **`src/hooks/useEnrichedUserPositions.ts`**: Orchestrates both calls and calculates interest
- **`src/features/lending/components/PersonalPositions.tsx`**: Displays the enriched data

### Flow

```
User opens Pools page
    ↓
PersonalPositions component renders
    ↓
useEnrichedUserPositions hook runs
    ↓
├─ fetchUserCurrentSupply (on-chain)
│  └─ Calls user_supply_amount view function
│  └─ Returns: shares × current_ratio
│
├─ fetchUserOriginalValue (indexer)
│  └─ Fetches AssetSupplied/AssetWithdrawn events
│  └─ Calculates weighted average cost per share
│  └─ Returns: shares × average_cost_per_share
│
└─ Calculate: interest = current - original
    ↓
Display in UI:
- Current Balance: currentValue (shares × current_ratio)
- Interest Earned: currentValue - originalValue
```

## Error Handling

**When the indexer is behind or unavailable:**
- ✅ Current balance still displays correctly (fetched from on-chain)
- ⚠️ Interest shows "— (indexer pending)" with info tooltip
- Console logs indicate: "No supply events found - indexer may be behind"

**Graceful degradation:**
- The UI never breaks or shows errors
- Users can still see their current balance and perform actions
- Once the indexer catches up, interest will automatically calculate

**Known limitation:** The Mysten testnet indexer can lag by several days. Recent transactions may not appear in the event history immediately.

## Testing

To test the interest calculation:

1. **Deposit funds** into a pool
2. **Wait for time to pass** (interest accrues continuously)
3. **Check the UI**:
   - "Deposited" should show current value (increasing over time)
   - "Interest Earned" should show the difference from your original deposit
4. **Withdraw funds** to verify the amount matches the displayed "Deposited" value

## Mathematical Precision

- All calculations use `BigInt` to avoid floating-point errors
- Scaling factor of `1_000_000_000_000` (1 trillion) is used for intermediate calculations
- Final values are converted to `Number` only for display formatting
- Token decimals are correctly applied (9 for SUI, 6 for DBUSDC)

## Contract Source Reference

The Move contract source is located at:
```
/home/ubuntu/projects/leva/deepbookv3/packages/deepbook_margin/sources/
├── margin_pool.move              # Main pool logic
├── margin_pool/
│   ├── margin_state.move         # State management and ratio calculations
│   └── position_manager.move     # User position tracking (shares only)
└── protocol_config.move          # Interest rate configuration
```

Key insight: The `Position` struct in `position_manager.move` only stores `shares` (line 16-19), not amounts or ratios.




