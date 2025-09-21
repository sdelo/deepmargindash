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
import * as protocol_fees from './protocol_fees.js';
import * as position_manager from './position_manager.js';
import * as vec_set from './deps/sui/vec_set.js';
import * as type_name from './deps/std/type_name.js';
const $moduleName = '@local-pkg/margin_trading::margin_pool';

export const MarginPool = new MoveStruct({ name: `${$moduleName}::MarginPool`, fields: {
        id: object.UID,
        vault: balance.Balance,
        state: margin_state.State,
        config: protocol_config.ProtocolConfig,
        protocol_fees: protocol_fees.ProtocolFees,
        positions: position_manager.PositionManager,
        allowed_deepbook_pools: vec_set.VecSet(bcs.Address)
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::protocol_fees::Referral`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
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
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
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