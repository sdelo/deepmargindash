# DeepBook Margin Events Documentation

This document provides a comprehensive overview of all event types emitted by the DeepBook Margin protocol and indexed by the DeepBook indexer.

## Table of Contents

### Event Types (Indexed by Server)
- [Margin Manager Events](#margin-manager-events)
- [Margin Pool Operations Events](#margin-pool-operations-events)
- [Margin Pool Admin Events](#margin-pool-admin-events)
- [Margin Registry Events](#margin-registry-events)
- [Protocol Fees Events](#protocol-fees-events)

### On-Chain Objects (Query via SUI RPC)
- [On-Chain Objects Reference](#on-chain-objects-reference)
  - [Margin Manager Objects](#margin-manager-objects)
  - [Margin Pool Objects](#margin-pool-objects)
  - [Margin Registry Objects](#margin-registry-objects)
  - [Capability Objects](#capability-objects)
  - [Configuration Objects](#configuration-objects)

---

## Margin Manager Events

These events track the lifecycle and operations of margin managers, which are user-controlled accounts that enable leveraged trading on DeepBook.

### 1. MarginManagerCreatedEvent

**Purpose:** Emitted when a new margin manager is created.

**Event Structure:**
```rust
pub struct MarginManagerCreatedEvent {
    pub margin_manager_id: ObjectID,
    pub balance_manager_id: ObjectID,
    pub deepbook_pool_id: ObjectID,
    pub owner: Address,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_manager_id`: Unique identifier for the newly created margin manager
- `balance_manager_id`: Associated DeepBook balance manager ID
- `deepbook_pool_id`: The DeepBook trading pool this manager is tied to
- `owner`: Address of the account owner
- `timestamp`: Unix timestamp (milliseconds) when the manager was created

**Use Cases:**
- Track total number of margin managers
- Monitor user adoption and growth
- Associate margin managers with specific trading pools
- Identify active users in the margin protocol

---

### 2. LoanBorrowedEvent

**Purpose:** Emitted when a margin manager borrows assets from a margin pool to increase leverage.

**Event Structure:**
```rust
pub struct LoanBorrowedEvent {
    pub margin_manager_id: ObjectID,
    pub margin_pool_id: ObjectID,
    pub loan_amount: u64,
    pub loan_shares: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_manager_id`: The margin manager taking out the loan
- `margin_pool_id`: The margin pool providing the loan (either base or quote asset pool)
- `loan_amount`: Amount of assets borrowed (in asset units)
- `loan_shares`: Number of borrow shares allocated (represents debt ownership)
- `timestamp`: Unix timestamp (milliseconds) when the loan was taken

**Use Cases:**
- Calculate total borrowed amount per pool
- Track borrowing activity and trends
- Monitor individual margin manager debt positions
- Calculate utilization rates
- Identify high borrowing activity periods

**Important Notes:**
- A margin manager can only have an active loan from ONE margin pool at a time (either base or quote)
- Borrow shares accumulate interest over time, so the debt amount increases

---

### 3. LoanRepaidEvent

**Purpose:** Emitted when a margin manager repays part or all of their loan.

**Event Structure:**
```rust
pub struct LoanRepaidEvent {
    pub margin_manager_id: ObjectID,
    pub margin_pool_id: ObjectID,
    pub repay_amount: u64,
    pub repay_shares: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_manager_id`: The margin manager repaying the loan
- `margin_pool_id`: The margin pool receiving the repayment
- `repay_amount`: Amount of assets repaid (in asset units)
- `repay_shares`: Number of borrow shares burned/repaid
- `timestamp`: Unix timestamp (milliseconds) when the repayment occurred

**Use Cases:**
- Track loan repayment activity
- Calculate average loan duration
- Monitor pool liquidity restoration
- Track interest paid (difference between borrowed amount and repaid amount)
- Identify active deleveraging

**Important Notes:**
- Users can repay partially or fully
- If all shares are repaid (both base and quote = 0), the margin manager's `margin_pool_id` is cleared

---

### 4. LiquidationEvent

**Purpose:** Emitted when a margin manager is liquidated due to insufficient collateral (risk ratio below liquidation threshold).

**Event Structure:**
```rust
pub struct LiquidationEvent {
    pub margin_manager_id: ObjectID,
    pub margin_pool_id: ObjectID,
    pub liquidation_amount: u64,
    pub pool_reward: u64,
    pub pool_default: u64,
    pub risk_ratio: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_manager_id`: The margin manager being liquidated
- `margin_pool_id`: The margin pool that had the outstanding loan
- `liquidation_amount`: Amount of debt repaid during liquidation
- `pool_reward`: Reward given to the margin pool (from liquidation bonus)
- `pool_default`: Bad debt incurred if collateral was insufficient (0 if full coverage)
- `risk_ratio`: The risk ratio at the time of liquidation (9 decimal precision, e.g., 1.05e9)
- `timestamp`: Unix timestamp (milliseconds) when liquidation occurred

**Use Cases:**
- Monitor protocol health and bad debt
- Track liquidation opportunities for liquidators
- Calculate liquidation rewards
- Identify risky positions and market conditions
- Measure protocol risk exposure

**Important Notes:**
- Liquidations can be partial or full
- `pool_default > 0` indicates bad debt (collateral < debt + rewards)
- Liquidators receive a reward (user_liquidation_reward + pool_reward)
- Risk ratio is calculated as: (Total Assets in Debt Currency) / (Total Debt)

---

## Margin Pool Operations Events

These events track the supply-side (lending) operations in margin pools.

### 5. AssetSupplied

**Purpose:** Emitted when a user supplies (deposits) assets into a margin pool to earn interest.

**Event Structure:**
```rust
pub struct AssetSupplied {
    pub margin_pool_id: ObjectID,
    pub asset_type: String, // TypeName
    pub supplier: Address,
    pub supply_amount: u64,
    pub supply_shares: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool receiving the supply
- `asset_type`: The type of asset being supplied (e.g., "SUI", "USDC")
- `supplier`: Address of the supplier (actually the supplier_cap_id in indexed version)
- `supply_amount`: Amount of assets supplied (in asset units)
- `supply_shares`: Number of supply shares minted (represents ownership in the pool)
- `timestamp`: Unix timestamp (milliseconds) when supply occurred

**Use Cases:**
- Track total value locked (TVL) per pool
- Monitor supply/deposit activity
- Calculate individual supplier positions
- Track pool liquidity growth
- Identify large suppliers

**Important Notes:**
- Supply shares earn interest over time (share value increases)
- Users need a `SupplierCap` to supply to pools
- Optional referral tracking for fee distribution

---

### 6. AssetWithdrawn

**Purpose:** Emitted when a user withdraws their supplied assets from a margin pool.

**Event Structure:**
```rust
pub struct AssetWithdrawn {
    pub margin_pool_id: ObjectID,
    pub asset_type: String, // TypeName
    pub supplier: Address,
    pub withdraw_amount: u64,
    pub withdraw_shares: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool from which assets are withdrawn
- `asset_type`: The type of asset being withdrawn
- `supplier`: Address of the supplier withdrawing (actually supplier_cap_id in indexed version)
- `withdraw_amount`: Amount of assets withdrawn (in asset units)
- `withdraw_shares`: Number of supply shares burned
- `timestamp`: Unix timestamp (milliseconds) when withdrawal occurred

**Use Cases:**
- Track TVL outflows
- Monitor withdrawal activity and trends
- Calculate realized interest earnings (withdraw_amount - original supply)
- Identify large withdrawals that may affect liquidity

**Important Notes:**
- Withdrawal amount is limited by available vault balance
- Shares are burned at the current supply ratio
- Users can withdraw partially or fully

---

### 7. MaintainerFeesWithdrawn

**Purpose:** Emitted when the maintainer of a margin pool withdraws accumulated fees.

**Event Structure:**
```rust
pub struct MaintainerFeesWithdrawn {
    pub margin_pool_id: ObjectID,
    pub margin_pool_cap_id: ObjectID,
    pub maintainer_fees: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool from which fees are withdrawn
- `margin_pool_cap_id`: The capability ID authorizing the withdrawal
- `maintainer_fees`: Amount of fees withdrawn (in asset units)
- `timestamp`: Unix timestamp (milliseconds) when withdrawal occurred

**Use Cases:**
- Track maintainer revenue
- Monitor fee accumulation rates
- Calculate protocol revenue distribution
- Audit fee withdrawals

**Important Notes:**
- Requires `MarginPoolCap` for authorization
- Maintainer fees are a portion of interest earned by the pool

---

### 8. ProtocolFeesWithdrawn

**Purpose:** Emitted when protocol fees are withdrawn from a margin pool (admin operation).

**Event Structure:**
```rust
pub struct ProtocolFeesWithdrawn {
    pub margin_pool_id: ObjectID,
    pub protocol_fees: u64,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool from which protocol fees are withdrawn
- `protocol_fees`: Amount of protocol fees withdrawn (in asset units)
- `timestamp`: Unix timestamp (milliseconds) when withdrawal occurred

**Use Cases:**
- Track protocol revenue
- Monitor total fees generated
- Calculate protocol profitability
- Audit admin fee withdrawals

**Important Notes:**
- Requires `MarginAdminCap` for authorization
- Protocol fees are a portion of interest earned by the pool

---

### 9. SupplierCapMinted

**Purpose:** Emitted when a new SupplierCap is minted, which allows a user to supply to margin pools.

**Event Structure:**
```rust
pub struct SupplierCapMinted {
    pub supplier_cap_id: ObjectID,
    pub timestamp: u64,
}
```

**Fields:**
- `supplier_cap_id`: Unique identifier for the newly minted supplier capability
- `timestamp`: Unix timestamp (milliseconds) when the cap was minted

**Use Cases:**
- Track total number of unique suppliers
- Monitor supplier onboarding
- Count active vs inactive supplier caps

**Important Notes:**
- One SupplierCap can be used across multiple margin pools
- Caps are transferable NFTs

---

### 10. SupplyReferralMinted

**Purpose:** Emitted when a supply referral is created, enabling referral fee tracking.

**Event Structure:**
```rust
pub struct SupplyReferralMinted {
    pub margin_pool_id: ObjectID,
    pub supply_referral_id: ObjectID,
    pub owner: Address,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool for which the referral was created
- `supply_referral_id`: Unique identifier for the referral
- `owner`: Address of the referral owner
- `timestamp`: Unix timestamp (milliseconds) when the referral was minted

**Use Cases:**
- Track referral program growth
- Monitor referral-driven supply
- Calculate referral earnings
- Identify top referrers

**Important Notes:**
- Referrals earn a portion of the protocol spread
- Referral fees are claimable via `ReferralFeesClaimedEvent`

---

## Margin Pool Admin Events

These events track administrative actions on margin pools.

### 11. MarginPoolCreated

**Purpose:** Emitted when a new margin pool is created for a specific asset.

**Event Structure:**
```rust
pub struct MarginPoolCreated {
    pub margin_pool_id: ObjectID,
    pub maintainer_cap_id: ObjectID,
    pub asset_type: String, // TypeName
    pub config: ProtocolConfig,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: Unique identifier for the newly created margin pool
- `maintainer_cap_id`: The maintainer cap used to create the pool
- `asset_type`: The type of asset this pool manages (e.g., "SUI", "USDC")
- `config`: Initial protocol configuration (includes interest params and pool config)
- `timestamp`: Unix timestamp (milliseconds) when the pool was created

**Use Cases:**
- Track available margin pools
- Monitor protocol expansion (new assets)
- Audit pool creation authority
- Record initial configurations

**Important Notes:**
- Each asset type can only have ONE margin pool
- A `MarginPoolCap` is issued to the creator

---

### 12. DeepbookPoolUpdated

**Purpose:** Emitted when a DeepBook trading pool is enabled or disabled for borrowing from a margin pool.

**Event Structure:**
```rust
pub struct DeepbookPoolUpdated {
    pub margin_pool_id: ObjectID,
    pub deepbook_pool_id: ObjectID,
    pub pool_cap_id: ObjectID,
    pub enabled: bool,
    pub timestamp: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool being configured
- `deepbook_pool_id`: The DeepBook trading pool being enabled/disabled
- `pool_cap_id`: The capability ID authorizing the change
- `enabled`: `true` if pool is enabled for borrowing, `false` if disabled
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track which trading pools can borrow from which margin pools
- Monitor pool access controls
- Audit administrative changes
- Identify active trading pairs

**Important Notes:**
- Margin managers tied to a DeepBook pool can only borrow if that pool is enabled
- Requires `MarginPoolCap` for authorization

---

### 13. InterestParamsUpdated

**Purpose:** Emitted when the interest rate parameters of a margin pool are updated.

**Event Structure:**
```rust
pub struct InterestParamsUpdated {
    pub margin_pool_id: ObjectID,
    pub pool_cap_id: ObjectID,
    pub interest_config: InterestConfig,
    pub timestamp: u64,
}

// InterestConfig structure
pub struct InterestConfig {
    pub base_rate: u64,
    pub base_slope: u64,
    pub optimal_utilization: u64,
    pub excess_slope: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool being updated
- `pool_cap_id`: The capability ID authorizing the change
- `interest_config`: New interest rate parameters
  - `base_rate`: Base interest rate (when utilization = 0)
  - `base_slope`: Interest rate increase per utilization % before optimal
  - `optimal_utilization`: Target utilization rate
  - `excess_slope`: Interest rate increase per utilization % after optimal
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track interest rate changes over time
- Monitor protocol risk adjustments
- Calculate historical interest rates
- Audit rate changes and their impact

**Important Notes:**
- Interest rates follow a kinked curve model
- Updates trigger interest accrual calculation before applying new rates
- Requires `MarginPoolCap` for authorization

---

### 14. MarginPoolConfigUpdated

**Purpose:** Emitted when the configuration parameters of a margin pool are updated.

**Event Structure:**
```rust
pub struct MarginPoolConfigUpdated {
    pub margin_pool_id: ObjectID,
    pub pool_cap_id: ObjectID,
    pub margin_pool_config: MarginPoolConfig,
    pub timestamp: u64,
}

// MarginPoolConfig structure
pub struct MarginPoolConfig {
    pub supply_cap: u64,
    pub max_utilization_rate: u64,
    pub referral_spread: u64,
    pub min_borrow: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool being updated
- `pool_cap_id`: The capability ID authorizing the change
- `margin_pool_config`: New pool configuration
  - `supply_cap`: Maximum total supply allowed in the pool
  - `max_utilization_rate`: Maximum percentage of pool that can be borrowed
  - `referral_spread`: Percentage of interest allocated to referrals
  - `min_borrow`: Minimum borrow amount
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track pool capacity limits
- Monitor risk parameter adjustments
- Audit configuration changes
- Calculate historical pool constraints

**Important Notes:**
- Requires `MarginPoolCap` for authorization
- Changes affect future borrows and supplies immediately

---

## Margin Registry Events

These events track the registration and configuration of DeepBook pools in the margin system.

### 15. MaintainerCapUpdated

**Purpose:** Emitted when a maintainer capability is minted or revoked.

**Event Structure:**
```rust
pub struct MaintainerCapUpdated {
    pub maintainer_cap_id: ObjectID,
    pub allowed: bool,
    pub timestamp: u64,
}
```

**Fields:**
- `maintainer_cap_id`: The maintainer capability ID
- `allowed`: `true` if cap is being allowed/minted, `false` if revoked
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track authorized maintainers
- Audit access control changes
- Monitor governance actions
- Identify active maintainers

**Important Notes:**
- Requires `MarginAdminCap` to mint or revoke
- Maintainer caps can create margin pools and update pool configurations

---

### 16. DeepbookPoolRegistered

**Purpose:** Emitted when a DeepBook trading pool is registered in the margin system.

**Event Structure:**
```rust
pub struct DeepbookPoolRegistered {
    pub pool_id: ObjectID,
    pub timestamp: u64,
}
```

**Fields:**
- `pool_id`: The DeepBook pool being registered
- `timestamp`: Unix timestamp (milliseconds) when registration occurred

**Use Cases:**
- Track supported trading pools
- Monitor protocol expansion
- Identify available margin trading pairs
- Audit pool registration

**Important Notes:**
- Registration is required before a pool can be used for margin trading
- Requires `MarginAdminCap` for authorization
- Pool must be explicitly enabled after registration

---

### 17. DeepbookPoolUpdatedRegistry

**Purpose:** Emitted when a DeepBook pool's enabled/disabled status is changed in the registry.

**Event Structure:**
```rust
pub struct DeepbookPoolUpdated {
    pub pool_id: ObjectID,
    pub enabled: bool,
    pub timestamp: u64,
}
```

**Fields:**
- `pool_id`: The DeepBook pool being updated
- `enabled`: `true` if pool is enabled for margin trading, `false` if disabled
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track active/inactive trading pools
- Monitor protocol pauses
- Audit access control changes
- Identify available margin trading opportunities

**Important Notes:**
- When disabled, only reduce-only orders, cancels, and withdrawals are allowed
- Requires `MarginAdminCap` for authorization

---

### 18. DeepbookPoolConfigUpdated

**Purpose:** Emitted when a DeepBook pool's configuration (risk ratios, margin pools, rewards) is updated.

**Event Structure:**
```rust
pub struct DeepbookPoolConfigUpdated {
    pub pool_id: ObjectID,
    pub config: PoolConfig,
    pub timestamp: u64,
}

// PoolConfig structure
pub struct PoolConfig {
    pub base_margin_pool_id: ObjectID,
    pub quote_margin_pool_id: ObjectID,
    pub risk_ratios: RiskRatios,
    pub user_liquidation_reward: u64,
    pub pool_liquidation_reward: u64,
    pub enabled: bool,
    pub extra_fields: VecMap<String, u64>,
}

// RiskRatios structure
pub struct RiskRatios {
    pub min_withdraw_risk_ratio: u64,
    pub min_borrow_risk_ratio: u64,
    pub liquidation_risk_ratio: u64,
    pub target_liquidation_risk_ratio: u64,
}
```

**Fields:**
- `pool_id`: The DeepBook pool being configured
- `config`: The complete pool configuration including:
  - `base_margin_pool_id`: Margin pool for base asset
  - `quote_margin_pool_id`: Margin pool for quote asset
  - `risk_ratios`: Risk thresholds for the pool
    - `min_withdraw_risk_ratio`: Minimum risk ratio to allow withdrawals
    - `min_borrow_risk_ratio`: Minimum risk ratio to allow borrowing
    - `liquidation_risk_ratio`: Risk ratio threshold for liquidation
    - `target_liquidation_risk_ratio`: Target risk ratio after partial liquidation
  - `user_liquidation_reward`: Reward percentage for liquidators
  - `pool_liquidation_reward`: Reward percentage for the pool
  - `enabled`: Pool enabled status
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track risk parameter changes
- Monitor liquidation thresholds
- Calculate liquidation opportunities
- Audit configuration changes
- Compare risk profiles across pools

**Important Notes:**
- Risk ratios use 9 decimal precision (e.g., 1.5x = 1.5e9)
- Liquidation threshold can only be decreased (more conservative), never increased
- Requires `MarginAdminCap` for authorization

---

### 19. PauseCapUpdated

**Purpose:** Emitted when a pause capability is minted or revoked.

**Event Structure:**
```rust
pub struct PauseCapUpdated {
    pub pause_cap_id: ObjectID,
    pub allowed: bool,
    pub timestamp: u64,
}
```

**Fields:**
- `pause_cap_id`: The pause capability ID
- `allowed`: `true` if cap is being allowed/minted, `false` if revoked
- `timestamp`: Unix timestamp (milliseconds) when the update occurred

**Use Cases:**
- Track emergency pause authorities
- Audit access control for emergency actions
- Monitor governance changes
- Identify active pause capabilities

**Important Notes:**
- Pause caps can disable protocol versions in emergencies
- Requires `MarginAdminCap` to mint or revoke
- Critical for protocol safety

---

## Protocol Fees Events

These events track protocol fee accrual and distribution.

### 20. ProtocolFeesIncreasedEvent

**Purpose:** Emitted when protocol fees are accrued (from interest payments).

**Event Structure:**
```rust
pub struct ProtocolFeesIncreasedEvent {
    pub margin_pool_id: ObjectID,
    pub total_shares: u64,
    pub referral_fees: u64,
    pub maintainer_fees: u64,
    pub protocol_fees: u64,
}
```

**Fields:**
- `margin_pool_id`: The margin pool generating fees
- `total_shares`: Total fee shares distributed
- `referral_fees`: Fees allocated to referrals
- `maintainer_fees`: Fees allocated to maintainers
- `protocol_fees`: Fees allocated to protocol

**Use Cases:**
- Track protocol revenue generation
- Calculate fee distribution
- Monitor pool profitability
- Analyze revenue sources

**Important Notes:**
- Fees are generated from interest payments on borrows
- Fee split is determined by protocol configuration
- Fees accumulate but are not withdrawn automatically

---

### 21. ReferralFeesClaimedEvent

**Purpose:** Emitted when a referrer claims their accumulated fees.

**Event Structure:**
```rust
pub struct ReferralFeesClaimedEvent {
    pub referral_id: ObjectID,
    pub owner: Address,
    pub fees: u64,
}
```

**Fields:**
- `referral_id`: The referral ID claiming fees
- `owner`: Address of the referral owner
- `fees`: Amount of fees claimed (in asset units)

**Use Cases:**
- Track referral program payouts
- Calculate referral earnings
- Monitor referral program success
- Identify top-performing referrers

**Important Notes:**
- Referral fees accumulate from supplies made using the referral ID
- Fees are paid in the margin pool's asset

---

## Event Relationships & Workflows

### User Journey: Lender
1. `SupplierCapMinted` → User can now supply to pools
2. `AssetSupplied` → User deposits assets to earn interest
3. `ProtocolFeesIncreasedEvent` → Fees accrue from borrower interest
4. `AssetWithdrawn` → User withdraws principal + interest

### User Journey: Borrower (Margin Trader)
1. `MarginManagerCreated` → User creates margin account for a trading pool
2. `LoanBorrowedEvent` → User borrows to leverage position
3. (Trading happens on DeepBook)
4. `LoanRepaidEvent` → User repays loan
   OR
5. `LiquidationEvent` → User gets liquidated if undercollateralized

### Admin Journey: Pool Setup
1. `MaintainerCapUpdated` → Admin grants maintainer permissions
2. `MarginPoolCreated` → Maintainer creates margin pool for an asset
3. `DeepbookPoolRegistered` → Admin registers a trading pool
4. `DeepbookPoolConfigUpdated` → Admin sets risk parameters
5. `DeepbookPoolUpdatedRegistry` → Admin enables the pool
6. `DeepbookPoolUpdated` (margin pool) → Maintainer enables trading pool for borrowing

---

## Data Precision Notes

- **Timestamps**: Unix milliseconds (u64)
- **Amounts**: Asset-specific decimals (e.g., SUI = 9 decimals, USDC = 6 decimals)
- **Shares**: Internal accounting units (9 decimals precision)
- **Risk Ratios**: 9 decimal precision (1.0 = 1_000_000_000)
- **Interest Rates**: 9 decimal precision (5% APY = 50_000_000)
- **Reward Percentages**: 9 decimal precision (2% = 20_000_000)

---

## Indexing Recommendations

### High-Priority Events for Real-Time Monitoring
- `LiquidationEvent` - Critical for liquidators and risk management
- `LoanBorrowedEvent` / `LoanRepaidEvent` - Track active positions
- `AssetSupplied` / `AssetWithdrawn` - Monitor liquidity

### Aggregation Opportunities
- Sum `AssetSupplied` - `AssetWithdrawn` = Net TVL per pool
- Sum `LoanBorrowedEvent` - `LoanRepaidEvent` = Total outstanding borrows
- Count `MarginManagerCreated` = Total users
- Sum `LiquidationEvent.pool_default` = Total bad debt

### Time-Series Metrics
- Utilization rate over time
- Interest rates over time
- Liquidation frequency
- TVL growth
- Bad debt accumulation

---

## Security & Monitoring

### Critical Events to Alert On
- `LiquidationEvent` with `pool_default > 0` (bad debt)
- Large `AssetWithdrawn` (potential liquidity crisis)
- Rapid increase in `LoanBorrowedEvent` (potential attack)
- `DeepbookPoolUpdatedRegistry` with `enabled: false` (pause)
- `PauseCapUpdated` (emergency action)

### Anomaly Detection
- Unusual liquidation volume
- Interest rate spikes
- Utilization approaching 100%
- Large single-user borrows
- Rapid manager creation

---

## On-Chain Objects Reference

> **⚠️ IMPORTANT:** These objects are stored on-chain and **NOT emitted as events**. To access these objects, you must query the **SUI RPC endpoint** using `sui_getObject` or similar RPC calls. They **CANNOT** be retrieved from the event indexer/server endpoint.

The following section documents all important on-chain objects that contain state information critical for building a complete dashboard or monitoring system for DeepBook Margin.

---

### Margin Manager Objects

These are the primary account objects for users engaging in margin trading.

#### MarginManager<BaseAsset, QuoteAsset>

**Type:** Shared Object (`has key`)

**Purpose:** Represents a user's margin trading account for a specific trading pair.

**Structure:**
```move
public struct MarginManager<phantom BaseAsset, phantom QuoteAsset> has key {
    id: UID,
    owner: address,
    deepbook_pool: ID,
    margin_pool_id: Option<ID>,
    balance_manager: BalanceManager,
    deposit_cap: DepositCap,
    withdraw_cap: WithdrawCap,
    trade_cap: TradeCap,
    borrowed_base_shares: u64,
    borrowed_quote_shares: u64,
    extra_fields: VecMap<String, u64>,
}
```

**Key Fields:**
- `id`: Unique identifier for this margin manager
- `owner`: Address of the owner (who controls this manager)
- `deepbook_pool`: The DeepBook trading pool ID this manager trades on
- `margin_pool_id`: Optional ID of the margin pool from which assets are borrowed (None if no active loans)
- `balance_manager`: DeepBook balance manager containing asset balances
- `borrowed_base_shares`: Shares of base asset borrowed (0 if no base debt)
- `borrowed_quote_shares`: Shares of quote asset borrowed (0 if no quote debt)

**How to Query:**
```typescript
// Using Sui TypeScript SDK
const marginManager = await client.getObject({
  id: marginManagerId,
  options: { showContent: true }
});
```

**Use Cases:**
- Display user's margin position details
- Calculate current debt amounts
- Show collateral balances
- Determine which pool has active loans
- Calculate risk ratios

**Related Events:** `MarginManagerCreatedEvent`, `LoanBorrowedEvent`, `LoanRepaidEvent`, `LiquidationEvent`

---

#### ManagerInitializer

**Type:** Hot Potato (must be consumed)

**Purpose:** Ensures a margin manager is shared immediately after creation.

**Structure:**
```move
public struct ManagerInitializer {
    margin_manager_id: ID,
}
```

**Key Fields:**
- `margin_manager_id`: The ID of the margin manager that must be shared

**Use Cases:**
- Enforces correct initialization pattern
- Cannot be stored or dropped, must be used with `share()` function

---

### Margin Pool Objects

These objects manage the lending pools where suppliers deposit assets and borrowers take loans.

#### MarginPool<Asset>

**Type:** Shared Object (`has key, store`)

**Purpose:** Main pool object for lending and borrowing a specific asset.

**Structure:**
```move
public struct MarginPool<phantom Asset> has key, store {
    id: UID,
    vault: Balance<Asset>,
    state: State,
    config: ProtocolConfig,
    protocol_fees: ProtocolFees,
    positions: PositionManager,
    allowed_deepbook_pools: VecSet<ID>,
    extra_fields: VecMap<String, u64>,
}
```

**Key Fields:**
- `id`: Unique identifier for this margin pool
- `vault`: The actual asset balance in the pool (available liquidity)
- `state`: Current state of the pool (supplies, borrows, shares, timestamps)
- `config`: Protocol configuration (interest rates, limits, spreads)
- `protocol_fees`: Fee tracking and distribution
- `positions`: Tracks individual supplier positions
- `allowed_deepbook_pools`: Set of DeepBook pool IDs allowed to borrow from this pool

**How to Query:**
```typescript
const marginPool = await client.getObject({
  id: marginPoolId,
  options: { 
    showContent: true,
    showType: true 
  }
});
```

**Use Cases:**
- Display pool liquidity (vault balance)
- Show total supply and borrow
- Calculate utilization rate
- Display current interest rates
- Show which trading pools can borrow
- Calculate supplier APYs

**Related Events:** `MarginPoolCreated`, `AssetSupplied`, `AssetWithdrawn`, `DeepbookPoolUpdated`

---

#### State

**Type:** Stored struct (`has drop, store`)

**Purpose:** Tracks the current state of a margin pool's supplies and borrows.

**Structure:**
```move
public struct State has drop, store {
    total_supply: u64,
    total_borrow: u64,
    supply_shares: u64,
    borrow_shares: u64,
    last_update_timestamp: u64,
    extra_fields: VecMap<String, u64>,
}
```

**Key Fields:**
- `total_supply`: Total assets supplied to the pool
- `total_borrow`: Total assets borrowed from the pool
- `supply_shares`: Total supply shares outstanding
- `borrow_shares`: Total borrow shares outstanding
- `last_update_timestamp`: Last time interest was accrued

**Derived Metrics:**
- **Utilization Rate** = `total_borrow / total_supply`
- **Supply Ratio** = `total_supply / supply_shares` (1 share → ? assets)
- **Borrow Ratio** = `total_borrow / borrow_shares` (1 share → ? debt)

**Use Cases:**
- Calculate real-time utilization
- Convert shares to amounts
- Calculate interest accrual
- Determine pool health

**Access:** Contained within `MarginPool` object

---

#### ProtocolConfig

**Type:** Stored struct (`has copy, drop, store`)

**Purpose:** Contains all configuration parameters for a margin pool.

**Structure:**
```move
public struct ProtocolConfig has copy, drop, store {
    margin_pool_config: MarginPoolConfig,
    interest_config: InterestConfig,
    extra_fields: VecMap<String, u64>,
}
```

**Sub-structures:**

**MarginPoolConfig:**
```move
public struct MarginPoolConfig has copy, drop, store {
    supply_cap: u64,              // Maximum total supply allowed
    max_utilization_rate: u64,    // Maximum % that can be borrowed
    protocol_spread: u64,         // % of interest taken as protocol fees
    min_borrow: u64,              // Minimum borrow amount
}
```

**InterestConfig:**
```move
public struct InterestConfig has copy, drop, store {
    base_rate: u64,           // Base interest rate (9 decimals)
    base_slope: u64,          // Rate increase below optimal utilization
    optimal_utilization: u64, // Target utilization rate
    excess_slope: u64,        // Rate increase above optimal utilization
}
```

**Use Cases:**
- Display pool limits and constraints
- Calculate current interest rates
- Show fee distribution
- Visualize interest rate curves
- Enforce borrowing limits

**Related Events:** `InterestParamsUpdated`, `MarginPoolConfigUpdated`

---

#### ProtocolFees

**Type:** Stored struct (`has store`)

**Purpose:** Tracks fee accumulation and distribution to referrals, maintainers, and protocol.

**Structure:**
```move
public struct ProtocolFees has store {
    referrals: Table<ID, ReferralTracker>,
    total_shares: u64,
    fees_per_share: u64,
    maintainer_fees: u64,
    protocol_fees: u64,
    extra_fields: VecMap<String, u64>,
}
```

**Key Fields:**
- `referrals`: Table tracking each referral's shares and unclaimed fees
- `total_shares`: Total supply shares across all referrals
- `fees_per_share`: Cumulative fees per share (for calculating referral earnings)
- `maintainer_fees`: Accumulated fees for the pool maintainer
- `protocol_fees`: Accumulated fees for the protocol

**Use Cases:**
- Display accrued fees
- Calculate referral earnings
- Show fee distribution breakdown
- Track maintainer and protocol revenue

**Related Events:** `ProtocolFeesIncreasedEvent`, `ReferralFeesClaimedEvent`, `MaintainerFeesWithdrawn`, `ProtocolFeesWithdrawn`

---

#### PositionManager

**Type:** Stored struct (`has store`)

**Purpose:** Manages individual supplier positions within a margin pool.

**Structure:**
```move
public struct PositionManager has store {
    positions: Table<ID, Position>,
    extra_fields: VecMap<String, u64>,
}
```

**Position:**
```move
public struct Position has store {
    shares: u64,           // Supply shares owned by this supplier
    referral: Option<ID>,  // Optional referral ID
}
```

**Key Fields:**
- `positions`: Table mapping SupplierCap ID → Position
- Each position tracks shares and referral

**Use Cases:**
- Lookup individual supplier positions
- Track referral usage
- Calculate supplier balances

**Access:** Contained within `MarginPool` object

---

#### SupplierCap

**Type:** Owned Object (`has key, store`)

**Purpose:** Capability object that allows a user to supply to margin pools.

**Structure:**
```move
public struct SupplierCap has key, store {
    id: UID,
}
```

**Key Fields:**
- `id`: Unique identifier for this capability

**Use Cases:**
- Required to supply assets to pools
- Required to withdraw assets from pools
- One cap can be used across multiple pools
- Transferable (can be sold/transferred)

**Related Events:** `SupplierCapMinted`, `AssetSupplied`, `AssetWithdrawn`

---

#### SupplyReferral

**Type:** Shared Object (`has key`)

**Purpose:** Represents a referral link for earning fees from referred supplies.

**Structure:**
```move
public struct SupplyReferral has key {
    id: UID,
    owner: address,
}
```

**Key Fields:**
- `id`: Unique identifier for this referral
- `owner`: Address that can claim accumulated referral fees

**Use Cases:**
- Create referral links
- Track referral usage
- Claim referral fees
- Build referral programs

**Related Events:** `SupplyReferralMinted`, `ReferralFeesClaimedEvent`

---

### Margin Registry Objects

The central registry managing the entire margin protocol.

#### MarginRegistry

**Type:** Shared Object (`has key`)

**Purpose:** Central registry managing all margin pools, DeepBook pools, and access control.

**Structure:**
```move
public struct MarginRegistry has key {
    id: UID,
    inner: Versioned,
}
```

**MarginRegistryInner (versioned content):**
```move
public struct MarginRegistryInner has store {
    registry_id: ID,
    allowed_versions: VecSet<u64>,
    pool_registry: Table<ID, PoolConfig>,
    margin_pools: Table<TypeName, ID>,
    margin_managers: Table<address, VecSet<ID>>,
    allowed_maintainers: VecSet<ID>,
    allowed_pause_caps: VecSet<ID>,
}
```

**Key Fields:**
- `allowed_versions`: Enabled protocol versions
- `pool_registry`: Maps DeepBook pool ID → PoolConfig
- `margin_pools`: Maps asset TypeName → MarginPool ID
- `margin_managers`: Maps owner address → set of MarginManager IDs
- `allowed_maintainers`: Set of valid MaintainerCap IDs
- `allowed_pause_caps`: Set of valid PauseCap IDs

**How to Query:**
```typescript
const registry = await client.getObject({
  id: MARGIN_REGISTRY_ID,
  options: { showContent: true }
});
```

**Use Cases:**
- Look up margin pool ID for an asset
- Find all margin managers for a user
- Check if a DeepBook pool is enabled
- Verify capability validity
- Get pool configurations

**Related Events:** `DeepbookPoolRegistered`, `DeepbookPoolConfigUpdated`, `MaintainerCapUpdated`, `PauseCapUpdated`

---

#### PoolConfig

**Type:** Stored struct (`has copy, drop, store`)

**Purpose:** Configuration for a DeepBook trading pool in the margin system.

**Structure:**
```move
public struct PoolConfig has copy, drop, store {
    base_margin_pool_id: ID,
    quote_margin_pool_id: ID,
    risk_ratios: RiskRatios,
    user_liquidation_reward: u64,
    pool_liquidation_reward: u64,
    enabled: bool,
    extra_fields: VecMap<String, u64>,
}
```

**RiskRatios:**
```move
public struct RiskRatios has copy, drop, store {
    min_withdraw_risk_ratio: u64,       // Min ratio to allow withdrawals
    min_borrow_risk_ratio: u64,         // Min ratio to allow borrowing
    liquidation_risk_ratio: u64,        // Ratio below which liquidation allowed
    target_liquidation_risk_ratio: u64, // Target ratio after partial liquidation
}
```

**Key Fields:**
- `base_margin_pool_id`: Margin pool for the base asset
- `quote_margin_pool_id`: Margin pool for the quote asset
- `risk_ratios`: Risk thresholds (all in 9 decimal precision)
- `user_liquidation_reward`: Reward % for liquidators
- `pool_liquidation_reward`: Reward % for the pool
- `enabled`: Whether margin trading is enabled for this pool

**Use Cases:**
- Display risk parameters for a trading pair
- Calculate liquidation thresholds
- Show which margin pools back a trading pair
- Determine if margin trading is enabled
- Calculate liquidation rewards

**Related Events:** `DeepbookPoolConfigUpdated`

---

### Capability Objects

Access control objects that grant permissions for various operations.

#### MarginAdminCap

**Type:** Owned Object (`has key, store`)

**Purpose:** Admin capability for protocol-level operations.

**Structure:**
```move
public struct MarginAdminCap has key, store {
    id: UID,
}
```

**Permissions:**
- Mint and revoke MaintainerCaps
- Mint and revoke PauseCaps
- Register DeepBook pools
- Enable/disable DeepBook pools
- Update risk parameters
- Add/remove oracle configurations
- Enable/disable protocol versions

**Use Cases:**
- Governance actions
- Protocol upgrades
- Emergency interventions

---

#### MaintainerCap

**Type:** Owned Object (`has key, store`)

**Purpose:** Maintainer capability for creating and managing margin pools.

**Structure:**
```move
public struct MaintainerCap has key, store {
    id: UID,
}
```

**Permissions:**
- Create margin pools
- Update margin pool configurations
- Update interest parameters
- Enable/disable DeepBook pools for borrowing
- Withdraw maintainer fees

**Use Cases:**
- Pool management
- Configuration updates
- Fee collection

**Related Events:** `MaintainerCapUpdated`, `MarginPoolCreated`

---

#### MarginPoolCap

**Type:** Owned Object (`has key, store`)

**Purpose:** Capability tied to a specific margin pool for authorized operations.

**Structure:**
```move
public struct MarginPoolCap has key, store {
    id: UID,
    margin_pool_id: ID,
}
```

**Key Fields:**
- `margin_pool_id`: The specific margin pool this cap controls

**Permissions:**
- Update pool interest parameters
- Update pool configuration
- Enable/disable DeepBook pools for borrowing
- Withdraw maintainer fees

**Use Cases:**
- Pool-specific administration
- Fee withdrawals

**Related Events:** Issued when `MarginPoolCreated`

---

#### MarginPauseCap

**Type:** Owned Object (`has key, store`)

**Purpose:** Emergency capability to pause protocol versions.

**Structure:**
```move
public struct MarginPauseCap has key, store {
    id: UID,
}
```

**Permissions:**
- Disable protocol versions in emergencies

**Use Cases:**
- Emergency protocol pauses
- Risk mitigation

**Related Events:** `PauseCapUpdated`

---

### Configuration Objects

Oracle and other configuration objects stored in the registry.

#### PythConfig

**Type:** Stored struct (`has drop, store`)

**Purpose:** Configuration for Pyth oracle price feeds.

**Structure:**
```move
public struct PythConfig has drop, store {
    currencies: VecMap<TypeName, CoinTypeData>,
    max_age_secs: u64,
    max_conf_bps: u64,
}
```

**CoinTypeData:**
```move
public struct CoinTypeData has copy, drop, store {
    decimals: u8,
    price_feed_id: vector<u8>,
    type_name: TypeName,
}
```

**Key Fields:**
- `currencies`: Map of asset types to their oracle configurations
- `max_age_secs`: Maximum age tolerance for price data
- `max_conf_bps`: Maximum confidence interval in basis points

**Use Cases:**
- Validate oracle prices
- Convert between asset values
- Calculate USD values
- Ensure price feed integrity

**Access:** Stored as dynamic field in MarginRegistry

---

## Querying On-Chain Objects

### Using Sui TypeScript SDK

```typescript
import { SuiClient } from '@mysten/sui.js/client';

const client = new SuiClient({ url: 'https://fullnode.mainnet.sui.io:443' });

// Query a Margin Manager
const marginManager = await client.getObject({
  id: '0x123...', // margin_manager_id
  options: {
    showContent: true,
    showType: true,
    showOwner: true,
  }
});

// Query a Margin Pool
const marginPool = await client.getObject({
  id: '0x456...', // margin_pool_id
  options: { showContent: true }
});

// Query the Margin Registry
const registry = await client.getObject({
  id: MARGIN_REGISTRY_ADDRESS,
  options: { showContent: true }
});

// Get all objects owned by an address
const ownedObjects = await client.getOwnedObjects({
  owner: '0x789...',
  filter: {
    StructType: 'PACKAGE_ID::margin_manager::MarginManager'
  }
});
```

### Using Sui CLI

```bash
# Query an object
sui client object 0x123...

# Query with JSON output
sui client object 0x123... --json

# Get objects owned by an address
sui client objects 0x789...
```

### Using GraphQL (if available)

```graphql
query GetMarginManager($id: ID!) {
  object(address: $id) {
    address
    version
    digest
    owner {
      ... on AddressOwner { owner { address } }
      ... on Shared { initialSharedVersion }
    }
    contents {
      json
      type {
        repr
      }
    }
  }
}
```

---

## Key Differences: Events vs Objects

| Aspect | Events (Indexed) | Objects (On-Chain) |
|--------|------------------|-------------------|
| **Data Source** | Event indexer / Server endpoint | SUI RPC endpoint |
| **Access Method** | REST API / WebSocket subscriptions | `sui_getObject` RPC calls |
| **Data Type** | Historical activity logs | Current state snapshots |
| **Update Frequency** | Emitted when actions occur | Updated with every transaction |
| **Query Capability** | Filter by type, timestamp, pool, user | Query by object ID or owner |
| **Use Case** | Analytics, history, alerts | Real-time positions, configurations |
| **Cost** | Low (indexed data) | Higher (RPC calls) |
| **Example** | "User borrowed 100 USDC at timestamp X" | "User currently has 150 USDC debt" |

### When to Use Events:
- Historical analysis and trends
- Transaction history
- Fee tracking over time
- User activity timelines
- Liquidation history
- Aggregated statistics

### When to Use On-Chain Objects:
- Current position details
- Live risk ratios
- Real-time balances
- Current configurations
- Available liquidity
- Liquidation opportunities (real-time risk assessment)

---

## Complete Dashboard Data Flow

### For a Comprehensive Dashboard:

1. **Use Events for:**
   - Activity feeds
   - Historical charts
   - Total volumes
   - User transaction history
   - Fee earnings over time
   - Protocol growth metrics

2. **Use On-Chain Objects for:**
   - Current TVL per pool
   - Live utilization rates
   - User position details
   - Risk ratio calculations
   - Available borrow capacity
   - Current interest rates
   - Pool configurations

3. **Combine Both:**
   - **Position Health Dashboard**: Events show borrow history, Objects show current debt and risk
   - **Pool Analytics**: Events show supply/withdraw flow, Objects show current liquidity and config
   - **Liquidation Bot**: Events identify liquidation events, Objects check real-time liquidation opportunities
   - **User Portfolio**: Events show earning history, Objects show current balance and shares

---

## Conclusion

These 21 event types plus the comprehensive on-chain object structure provide complete observability into the DeepBook Margin protocol. They enable:

✅ **Real-time monitoring** of all protocol activities  
✅ **Risk management** through liquidation tracking  
✅ **Analytics** for protocol health and growth  
✅ **Governance** transparency through admin action tracking  
✅ **User experience** through position and earning tracking  

**For dashboard implementation:**
- Prioritize real-time websocket subscriptions for liquidation opportunities and time-series aggregations for historical analytics (from events)
- Use SUI RPC queries for live position data, pool states, and risk calculations (from on-chain objects)
- Cache frequently-accessed objects and update them based on related events
- Combine both data sources for the most complete and accurate user experience



