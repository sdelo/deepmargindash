# Testing Interest Calculation

## Manual Testing Guide

### Prerequisites
- Connected wallet with testnet funds
- Access to http://localhost:3000/pools
- Browser console open to view logs

### Test Case 1: Fresh Deposit (Indexer Behind)

**Expected Behavior:** UI should gracefully handle missing event data.

1. Make a fresh deposit into the SUI pool
2. Navigate to Pools page
3. Check the "My Positions" table:
   - ✅ **Current Balance** should show the deposit amount
   - ⚠️ **Interest Earned** should show "— (indexer pending)" with info icon
4. Hover over the ⓘ icon - should show tooltip explaining indexer is behind
5. Check browser console:
   - Should see: `[fetchUserOriginalValue] No supply events found - indexer may be behind`
   - Should see: `[useEnrichedUserPositions] interest: 'pending'`

**Why:** The indexer is ~11 days behind on testnet, so fresh transactions won't have events yet.

### Test Case 2: Older Position (Indexer Synced)

**Expected Behavior:** Should calculate and show interest earned.

If you have a position that's older than the indexer lag:

1. Navigate to Pools page
2. Check the "My Positions" table:
   - ✅ **Current Balance** shows current value (with interest)
   - ✅ **Interest Earned** shows a positive number
3. Verify math: `Current Balance ≈ Original Deposit + Interest Earned`
4. Check browser console:
   - Should see: `[fetchUserOriginalValue] Processing events: { supplies: X, withdrawals: Y }`
   - Should see: `[useEnrichedUserPositions] interest: '<some_value>'`

### Test Case 3: Verify Current Value is Correct

**Expected Behavior:** The displayed "Current Balance" should match what you can withdraw.

1. Note the **Current Balance** shown in the UI (e.g., "100 SUI")
2. Click "Withdraw" on that pool
3. The withdrawal panel should show the same amount available
4. (Optional) Withdraw a portion to verify the blockchain agrees with the displayed value

### Test Case 4: Multiple Deposits (Advanced)

**Expected Behavior:** Weighted-average cost basis should be used.

1. Make a deposit of 100 tokens when ratio is ~1.0
2. Wait for interest to accrue (or check a pool with existing interest)
3. Make another deposit of 110 tokens when ratio is ~1.1
4. Check console logs:
   ```
   [fetchUserOriginalValue] Cost basis result: {
     totalSharesAcquired: "200",  // 100 + 100
     totalCost: "210",            // 100 + 110
     netShares: "200",
     netCost: "210",
     currentShares: "200",
     originalValue: "210"
   }
   ```
5. Verify Interest = Current Value - 210

### Test Case 5: Withdrawal Adjustment

**Expected Behavior:** Cost basis should adjust when withdrawing.

1. Start with position: 200 shares, cost basis 210 tokens
2. Withdraw 50 shares
3. Check console logs should show:
   ```
   [fetchUserOriginalValue] Cost basis result: {
     totalSharesAcquired: "200",
     totalCost: "210",
     netShares: "150",           // 200 - 50 withdrawn
     netCost: "157.5",           // 210 - (210/200 * 50)
     currentShares: "150",
     originalValue: "157.5"
   }
   ```

## Automated Testing (Future)

### Unit Tests for `fetchUserOriginalValue`

```typescript
describe('fetchUserOriginalValue', () => {
  it('should calculate weighted average cost basis', async () => {
    // Mock supply events
    const mockSupplies = [
      { supply_amount: 100, supply_shares: 100 },  // ratio 1.0
      { supply_amount: 110, supply_shares: 100 },  // ratio 1.1
    ];
    
    // Expected: 200 shares cost 210 tokens
    // Average: 1.05 per share
    // For 200 shares: 210 tokens
    
    const result = await fetchUserOriginalValue('cap', 'pool', 200n);
    expect(result).toBe(210n);
  });
  
  it('should adjust for withdrawals', async () => {
    const mockSupplies = [
      { supply_amount: 100, supply_shares: 100 },
      { supply_amount: 110, supply_shares: 100 },
    ];
    const mockWithdrawals = [
      { withdraw_shares: 50 },
    ];
    
    // Started with 200 shares, 210 cost
    // Withdrew 50 shares at avg cost 1.05 = 52.5
    // Remaining: 150 shares, 157.5 cost
    
    const result = await fetchUserOriginalValue('cap', 'pool', 150n);
    expect(result).toBe(157n); // 157.5 rounded down in BigInt
  });
});
```

### Integration Tests

```typescript
describe('PersonalPositions interest display', () => {
  it('should show interest when events available', async () => {
    // Mock user with position
    // Mock indexer with events
    render(<PersonalPositions ... />);
    
    await waitFor(() => {
      expect(screen.getByText(/Interest Earned/i)).toBeInTheDocument();
      expect(screen.getByText(/20 SUI/i)).toBeInTheDocument(); // expected interest
    });
  });
  
  it('should show "indexer pending" when events unavailable', async () => {
    // Mock user with fresh position
    // Mock empty event response
    render(<PersonalPositions ... />);
    
    await waitFor(() => {
      expect(screen.getByText(/indexer pending/i)).toBeInTheDocument();
      expect(screen.getByTitle(/indexer is currently behind/i)).toBeInTheDocument();
    });
  });
});
```

## Edge Cases to Test

### Zero Interest
- Pool with no borrows (utilization = 0%)
- Expected: Interest Earned = 0 or very small amount

### Negative Interest (Should Not Happen)
- If ever shown, indicates a bug in cost basis calculation
- Interest should always be >= 0

### Very Large Numbers
- Test with large deposits (e.g., 1 million tokens)
- Verify no overflow or precision loss

### High Precision
- Small deposits (e.g., 0.01 tokens)
- Verify interest shows correctly (not rounded to 0)

## Debugging Checklist

If interest is not displaying correctly:

1. ✅ Check browser console for errors
2. ✅ Verify `fetchUserCurrentSupply` returns a value
3. ✅ Check if `fetchUserOriginalValue` found any events
4. ✅ Compare event timestamps with indexer lag
5. ✅ Verify SupplierCap ID matches between UI and events
6. ✅ Check token decimals (9 for SUI, 6 for DBUSDC)
7. ✅ Inspect `useEnrichedUserPositions` calculation logs

### Common Issues

**"indexer pending" shows forever:**
- Indexer is permanently behind or not running
- Check: https://deepbook-indexer.testnet.mystenlabs.com/asset_supplied
- If empty, indexer is down

**Interest shows as 0:**
- No time has passed since deposit
- OR interest rate is very low
- OR position is very small (rounded to 0 in display)

**Interest shows incorrect value:**
- Check console logs for cost basis calculation
- Verify supply/withdraw events are being fetched correctly
- Ensure BigInt arithmetic is not overflowing

## Performance Testing

### Load Test
- Test with user having 10+ positions
- Verify all positions load without timeout
- Check for excessive API calls

### Network Latency
- Simulate slow indexer response
- Verify loading states show appropriately
- Ensure no race conditions in parallel fetches

## Regression Testing

After any changes to:
- `userHistory.ts`
- `useEnrichedUserPositions.ts`
- `PersonalPositions.tsx`
- Move contract (ratio calculations)

Re-run all test cases above to ensure accuracy is maintained.

