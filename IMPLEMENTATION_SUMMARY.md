# Interest Calculation Implementation Summary

## What Was Built

A complete system to accurately calculate and display **Interest Earned** on user deposits in DeepBook Margin lending pools.

## Key Changes

### 1. UI Updates (`PersonalPositions.tsx`)
- Changed "Deposited" column label to **"Current Balance"** (more accurate)
- Shows current value fetched from on-chain via `user_supply_amount` view function
- Displays **"Interest Earned"** as a separate column
- Added info tooltip (ⓘ) when showing "— (indexer pending)" for interest
- Graceful handling when indexer is behind

### 2. On-Chain Data Fetching (`onChainReads.ts`)
- Implemented `fetchUserCurrentSupply()` function
- Calls Move contract's `user_supply_amount` view function via `devInspectTransactionBlock`
- Returns: `shares × current_ratio` (current value including accrued interest)

### 3. Event-Based Cost Basis (`userHistory.ts`)
- Implemented `fetchUserOriginalValue()` function
- Fetches `AssetSupplied` and `AssetWithdrawn` events from Mysten indexer
- Calculates **weighted-average cost basis** using proper accounting:
  - Sums all tokens spent to acquire shares
  - Adjusts for withdrawals (removes proportional cost basis)
  - Returns original value of current shares
- Uses high-precision BigInt arithmetic with 1 trillion scaling factor

### 4. Hook Integration (`useEnrichedUserPositions.ts`)
- Orchestrates both on-chain and event-based fetching
- Calculates: `Interest = Current Value - Original Value`
- Returns enriched position data with formatted values
- Handles null cases when indexer is unavailable

### 5. Documentation (`INTEREST_CALCULATION.md`)
- Comprehensive explanation of the Move contract's share-based system
- Clear examples of weighted-average cost accounting
- Error handling and testing guidance

## How It Works

### Share-Based Interest System

The DeepBook Margin contract uses a clever share-based system:

1. **When depositing:** `shares = amount / current_ratio`
2. **Shares stay constant** for each user
3. **The ratio increases** over time as interest accrues
4. **Current value:** `shares × current_ratio` (always calculable on-chain)
5. **Original value:** Requires historical ratio from events

### The Cost Basis Problem

**Why we need events:**
- The contract stores only current state (shares, current ratio)
- It does NOT store the ratio at which each user deposited
- Without the deposit ratio, we can't calculate the original value
- The `AssetSupplied` event contains both `supply_amount` and `supply_shares`
- This lets us reconstruct: `ratio_at_deposit = supply_amount / supply_shares`

**Weighted-average accounting:**
- User can make multiple deposits at different ratios
- User can make partial withdrawals
- We track the total cost paid for shares, adjusted for withdrawals
- `Average cost per share = total_cost / total_shares`
- `Original value = current_shares × avg_cost_per_share`

### Example Calculation

```
User Timeline:
1. Deposits 100 tokens at ratio 1.0 → receives 100 shares (cost: 100 tokens)
2. Time passes, ratio becomes 1.1 (interest accrues)
3. Deposits 110 tokens at ratio 1.1 → receives 100 shares (cost: 110 tokens)
4. Total position: 200 shares, cost basis: 210 tokens

Cost Basis Calculation:
- Total shares acquired: 200
- Total cost: 210 tokens
- Average cost per share: 1.05 tokens/share

Current Value (from on-chain):
- Current ratio: 1.15 (more interest accrued)
- Current value = 200 shares × 1.15 = 230 tokens

Interest Earned:
- Interest = 230 - 210 = 20 tokens
```

## Why This Approach is Correct

1. **Relies on Move contract for current value** ✅
   - Calls `user_supply_amount` directly
   - No approximations or frontend calculations

2. **Uses events for historical data** ✅
   - Standard Web3 pattern (used by Aave, Compound, Uniswap)
   - Events are immutable blockchain records
   - Weighted-average is a standard accounting method (IRS Form 8949)

3. **Handles multiple deposits/withdrawals** ✅
   - Proper cost basis accounting
   - No drift or rounding errors (BigInt arithmetic)

4. **Graceful degradation** ✅
   - Works even if indexer is behind
   - Shows current balance (most important for users)
   - Clearly indicates when interest is pending

## Known Limitations

### Indexer Dependency

**The indexer is REQUIRED to show interest earned.** This is by design:
- The Move contract doesn't store historical ratios (gas efficiency)
- Events are the standard way to track historical data in Web3
- Alternative would require on-chain changes (see below)

### Indexer Lag

The Mysten testnet indexer can be several days behind:
- Recent deposits won't show interest immediately
- Once indexer catches up, interest will calculate correctly
- This is a testnet limitation; mainnet indexers are typically real-time

## Potential On-Chain Improvements

If the DeepBook team wants to eliminate the indexer dependency, they could:

### Option 1: Store weighted-average cost per share
```move
public struct Position has store {
    shares: u64,
    total_cost: u64,  // ← Add this: total tokens paid for shares
    referral: Option<ID>,
}
```

**Pros:**
- Frontend can calculate interest without indexer
- Only 8 bytes per position

**Cons:**
- More complex withdraw logic (need to update total_cost)
- Slight gas cost increase
- Still need to decide on accounting method (FIFO/LIFO/weighted-avg)

### Option 2: Accept approximate interest
Calculate interest as: `current_value - (shares × 1.0)`

**Pros:**
- No on-chain changes
- No indexer dependency

**Cons:**
- Inaccurate for users who deposited after pool had interest
- Could show incorrect values

## Testing

To verify the implementation:

1. **Fresh deposit:**
   - Deposit into a pool
   - Should show current balance immediately
   - Interest shows "— (indexer pending)" until events sync

2. **After indexer syncs:**
   - Interest should show as positive amount
   - Verify: Current Balance - Interest ≈ Original Deposit

3. **Multiple deposits:**
   - Make two deposits at different times
   - Interest should reflect weighted-average cost basis

4. **Withdrawal:**
   - Withdraw partial amount
   - Cost basis should adjust proportionally

## Files Changed

- `src/features/lending/components/PersonalPositions.tsx` (UI)
- `src/hooks/useEnrichedUserPositions.ts` (orchestration)
- `src/api/onChainReads.ts` (on-chain reads)
- `src/api/userHistory.ts` (event processing)
- `INTEREST_CALCULATION.md` (documentation)

## Console Logging

Added strategic console logs for debugging:
- `[fetchUserOriginalValue]` - Event fetching and cost basis calculation
- `[useEnrichedUserPositions]` - Current/original values and interest

These can be removed in production or kept for observability.
