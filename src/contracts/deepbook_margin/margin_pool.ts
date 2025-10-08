/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as object from './deps/sui/object.js';
import * as balance from './deps/sui/balance.js';
import * as margin_state from './margin_state.js';
import * as protocol_config from './protocol_config.js';
import * as referral_fees from './referral_fees.js';
import * as position_manager from './position_manager.js';
import * as vec_set from './deps/sui/vec_set.js';
import * as vec_map from './deps/sui/vec_map.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/deepbook-margin::margin_pool';
export const MarginPool = new MoveStruct({ name: `${$moduleName}::MarginPool`, fields: {
        id: object.UID,
        vault: balance.Balance,
        state: margin_state.State,
        config: protocol_config.ProtocolConfig,
        referral_fees: referral_fees.ReferralFees,
        positions: position_manager.PositionManager,
        allowed_deepbook_pools: vec_set.VecSet(bcs.Address),
        extra_fields: vec_map.VecMap(bcs.string(), bcs.u64())
    } });
export const MarginPoolCreated = new MoveStruct({ name: `${$moduleName}::MarginPoolCreated`, fields: {
        margin_pool_id: bcs.Address,
        maintainer_cap_id: bcs.Address,
        asset_type: type_name.TypeName,
        config: protocol_config.ProtocolConfig,
        timestamp: bcs.u64()
    } });
export const DeepbookPoolUpdated = new MoveStruct({ name: `${$moduleName}::DeepbookPoolUpdated`, fields: {
        margin_pool_id: bcs.Address,
        deepbook_pool_id: bcs.Address,
        pool_cap_id: bcs.Address,
        enabled: bcs.bool(),
        timestamp: bcs.u64()
    } });
export const InterestParamsUpdated = new MoveStruct({ name: `${$moduleName}::InterestParamsUpdated`, fields: {
        margin_pool_id: bcs.Address,
        pool_cap_id: bcs.Address,
        interest_config: protocol_config.InterestConfig,
        timestamp: bcs.u64()
    } });
export const MarginPoolConfigUpdated = new MoveStruct({ name: `${$moduleName}::MarginPoolConfigUpdated`, fields: {
        margin_pool_id: bcs.Address,
        pool_cap_id: bcs.Address,
        margin_pool_config: protocol_config.MarginPoolConfig,
        timestamp: bcs.u64()
    } });
export const AssetSupplied = new MoveStruct({ name: `${$moduleName}::AssetSupplied`, fields: {
        margin_pool_id: bcs.Address,
        asset_type: type_name.TypeName,
        supplier: bcs.Address,
        supply_amount: bcs.u64(),
        supply_shares: bcs.u64(),
        timestamp: bcs.u64()
    } });
export const AssetWithdrawn = new MoveStruct({ name: `${$moduleName}::AssetWithdrawn`, fields: {
        margin_pool_id: bcs.Address,
        asset_type: type_name.TypeName,
        supplier: bcs.Address,
        withdraw_amount: bcs.u64(),
        withdraw_shares: bcs.u64(),
        timestamp: bcs.u64()
    } });
export interface CreateMarginPoolArguments {
    registry: RawTransactionArgument<string>;
    config: RawTransactionArgument<string>;
    maintainerCap: RawTransactionArgument<string>;
}
export interface CreateMarginPoolOptions {
    package?: string;
    arguments: CreateMarginPoolArguments | [
        registry: RawTransactionArgument<string>,
        config: RawTransactionArgument<string>,
        maintainerCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Creates and registers a new margin pool. If a same asset pool already exists,
 * abort. Sends a `MarginPoolCap` to the pool creator. Returns the created margin
 * pool id.
 */
export function createMarginPool(options: CreateMarginPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::protocol_config::ProtocolConfig`,
        `${packageAddress}::margin_registry::MaintainerCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["registry", "config", "maintainerCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'create_margin_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EnableDeepbookPoolForLoanArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    deepbookPoolId: RawTransactionArgument<string>;
    marginPoolCap: RawTransactionArgument<string>;
}
export interface EnableDeepbookPoolForLoanOptions {
    package?: string;
    arguments: EnableDeepbookPoolForLoanArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        deepbookPoolId: RawTransactionArgument<string>,
        marginPoolCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Allow a margin manager tied to a deepbook pool to borrow from the margin pool. */
export function enableDeepbookPoolForLoan(options: EnableDeepbookPoolForLoanOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::object::ID',
        `${packageAddress}::margin_registry::MarginPoolCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "deepbookPoolId", "marginPoolCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'enable_deepbook_pool_for_loan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DisableDeepbookPoolForLoanArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    deepbookPoolId: RawTransactionArgument<string>;
    marginPoolCap: RawTransactionArgument<string>;
}
export interface DisableDeepbookPoolForLoanOptions {
    package?: string;
    arguments: DisableDeepbookPoolForLoanArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        deepbookPoolId: RawTransactionArgument<string>,
        marginPoolCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Disable a margin manager tied to a deepbook pool from borrowing from the margin
 * pool.
 */
export function disableDeepbookPoolForLoan(options: DisableDeepbookPoolForLoanOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::object::ID',
        `${packageAddress}::margin_registry::MarginPoolCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "deepbookPoolId", "marginPoolCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'disable_deepbook_pool_for_loan',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdateInterestParamsArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    interestConfig: RawTransactionArgument<string>;
    marginPoolCap: RawTransactionArgument<string>;
}
export interface UpdateInterestParamsOptions {
    package?: string;
    arguments: UpdateInterestParamsArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        interestConfig: RawTransactionArgument<string>,
        marginPoolCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Updates interest params for the margin pool */
export function updateInterestParams(options: UpdateInterestParamsOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::protocol_config::InterestConfig`,
        `${packageAddress}::margin_registry::MarginPoolCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "interestConfig", "marginPoolCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'update_interest_params',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdateMarginPoolConfigArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    marginPoolConfig: RawTransactionArgument<string>;
    marginPoolCap: RawTransactionArgument<string>;
}
export interface UpdateMarginPoolConfigOptions {
    package?: string;
    arguments: UpdateMarginPoolConfigArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        marginPoolConfig: RawTransactionArgument<string>,
        marginPoolCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Updates margin pool config */
export function updateMarginPoolConfig(options: UpdateMarginPoolConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::protocol_config::MarginPoolConfig`,
        `${packageAddress}::margin_registry::MarginPoolCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "marginPoolConfig", "marginPoolCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'update_margin_pool_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SupplyArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
    referral: RawTransactionArgument<string | null>;
}
export interface SupplyOptions {
    package?: string;
    arguments: SupplyArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>,
        referral: RawTransactionArgument<string | null>
    ];
    typeArguments: [
        string
    ];
}
/** Supply to the margin pool. Returns the new user supply amount. */
export function supply(options: SupplyOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${options.typeArguments[0]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000001::option::Option<address>',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "coin", "referral"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    amount: RawTransactionArgument<number | bigint | null>;
}
export interface WithdrawOptions {
    package?: string;
    arguments: WithdrawArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        amount: RawTransactionArgument<number | bigint | null>
    ];
    typeArguments: [
        string
    ];
}
/** Withdraw from the margin pool. Returns the withdrawn coin. */
export function withdraw(options: WithdrawOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000001::option::Option<u64>',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'withdraw',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MintSupplyReferralArguments {
    self: RawTransactionArgument<string>;
}
export interface MintSupplyReferralOptions {
    package?: string;
    arguments: MintSupplyReferralArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Mint a supply referral. */
export function mintSupplyReferral(options: MintSupplyReferralOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'mint_supply_referral',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawReferralFeesArguments {
    self: RawTransactionArgument<string>;
    referral: RawTransactionArgument<string>;
}
export interface WithdrawReferralFeesOptions {
    package?: string;
    arguments: WithdrawReferralFeesArguments | [
        self: RawTransactionArgument<string>,
        referral: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Withdraw the referral fees. */
export function withdrawReferralFees(options: WithdrawReferralFeesOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::referral_fees::SupplyReferral`
    ] satisfies string[];
    const parameterNames = ["self", "referral"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'withdraw_referral_fees',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DeepbookPoolAllowedArguments {
    self: RawTransactionArgument<string>;
    deepbookPoolId: RawTransactionArgument<string>;
}
export interface DeepbookPoolAllowedOptions {
    package?: string;
    arguments: DeepbookPoolAllowedArguments | [
        self: RawTransactionArgument<string>,
        deepbookPoolId: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function deepbookPoolAllowed(options: DeepbookPoolAllowedOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::object::ID'
    ] satisfies string[];
    const parameterNames = ["self", "deepbookPoolId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'deepbook_pool_allowed',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalSupplyArguments {
    self: RawTransactionArgument<string>;
}
export interface TotalSupplyOptions {
    package?: string;
    arguments: TotalSupplyArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalSupply(options: TotalSupplyOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'total_supply',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SupplySharesArguments {
    self: RawTransactionArgument<string>;
}
export interface SupplySharesOptions {
    package?: string;
    arguments: SupplySharesArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function supplyShares(options: SupplySharesOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'supply_shares',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface TotalBorrowArguments {
    self: RawTransactionArgument<string>;
}
export interface TotalBorrowOptions {
    package?: string;
    arguments: TotalBorrowArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function totalBorrow(options: TotalBorrowOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'total_borrow',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowSharesArguments {
    self: RawTransactionArgument<string>;
}
export interface BorrowSharesOptions {
    package?: string;
    arguments: BorrowSharesArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function borrowShares(options: BorrowSharesOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'borrow_shares',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LastUpdateTimestampArguments {
    self: RawTransactionArgument<string>;
}
export interface LastUpdateTimestampOptions {
    package?: string;
    arguments: LastUpdateTimestampArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function lastUpdateTimestamp(options: LastUpdateTimestampOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'last_update_timestamp',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SupplyCapArguments {
    self: RawTransactionArgument<string>;
}
export interface SupplyCapOptions {
    package?: string;
    arguments: SupplyCapArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function supplyCap(options: SupplyCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'supply_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MaxUtilizationRateArguments {
    self: RawTransactionArgument<string>;
}
export interface MaxUtilizationRateOptions {
    package?: string;
    arguments: MaxUtilizationRateArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function maxUtilizationRate(options: MaxUtilizationRateOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'max_utilization_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ReferralSpreadArguments {
    self: RawTransactionArgument<string>;
}
export interface ReferralSpreadOptions {
    package?: string;
    arguments: ReferralSpreadArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function referralSpread(options: ReferralSpreadOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'referral_spread',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface MinBorrowArguments {
    self: RawTransactionArgument<string>;
}
export interface MinBorrowOptions {
    package?: string;
    arguments: MinBorrowArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function minBorrow(options: MinBorrowOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'min_borrow',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface InterestRateArguments {
    self: RawTransactionArgument<string>;
}
export interface InterestRateOptions {
    package?: string;
    arguments: InterestRateArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function interestRate(options: InterestRateOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_pool',
        function: 'interest_rate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}