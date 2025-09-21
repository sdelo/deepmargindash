/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** Registry holds all margin pools. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs, type BcsType } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as object from './deps/sui/object.js';
import * as versioned from './deps/sui/versioned.js';
import * as vec_set from './deps/sui/vec_set.js';
import * as table from './deps/sui/table.js';
const $moduleName = '@local-pkg/margin_trading::margin_registry';
export const MARGIN_REGISTRY = new MoveStruct({ name: `${$moduleName}::MARGIN_REGISTRY`, fields: {
        dummy_field: bcs.bool()
    } });
export const MarginRegistry = new MoveStruct({ name: `${$moduleName}::MarginRegistry`, fields: {
        id: object.UID,
        inner: versioned.Versioned
    } });
export const MarginRegistryInner = new MoveStruct({ name: `${$moduleName}::MarginRegistryInner`, fields: {
        registry_id: bcs.Address,
        allowed_versions: vec_set.VecSet(bcs.u64()),
        pool_registry: table.Table,
        margin_pools: table.Table,
        allowed_maintainers: vec_set.VecSet(bcs.Address)
    } });
export const RiskRatios = new MoveStruct({ name: `${$moduleName}::RiskRatios`, fields: {
        min_withdraw_risk_ratio: bcs.u64(),
        min_borrow_risk_ratio: bcs.u64(),
        liquidation_risk_ratio: bcs.u64(),
        target_liquidation_risk_ratio: bcs.u64()
    } });
export const PoolConfig = new MoveStruct({ name: `${$moduleName}::PoolConfig`, fields: {
        base_margin_pool_id: bcs.Address,
        quote_margin_pool_id: bcs.Address,
        risk_ratios: RiskRatios,
        user_liquidation_reward: bcs.u64(),
        pool_liquidation_reward: bcs.u64(),
        enabled: bcs.bool()
    } });
export const ConfigKey = new MoveStruct({ name: `${$moduleName}::ConfigKey`, fields: {
        dummy_field: bcs.bool()
    } });
export const MarginAdminCap = new MoveStruct({ name: `${$moduleName}::MarginAdminCap`, fields: {
        id: object.UID
    } });
export const MaintainerCap = new MoveStruct({ name: `${$moduleName}::MaintainerCap`, fields: {
        id: object.UID
    } });
export const MarginPoolCap = new MoveStruct({ name: `${$moduleName}::MarginPoolCap`, fields: {
        id: object.UID,
        margin_pool_id: bcs.Address
    } });
export const MaintainerCapUpdated = new MoveStruct({ name: `${$moduleName}::MaintainerCapUpdated`, fields: {
        maintainer_cap_id: bcs.Address,
        allowed: bcs.bool(),
        timestamp: bcs.u64()
    } });
export const DeepbookPoolRegistered = new MoveStruct({ name: `${$moduleName}::DeepbookPoolRegistered`, fields: {
        pool_id: bcs.Address,
        timestamp: bcs.u64()
    } });
export const DeepbookPoolUpdated = new MoveStruct({ name: `${$moduleName}::DeepbookPoolUpdated`, fields: {
        pool_id: bcs.Address,
        enabled: bcs.bool(),
        timestamp: bcs.u64()
    } });
export const DeepbookPoolConfigUpdated = new MoveStruct({ name: `${$moduleName}::DeepbookPoolConfigUpdated`, fields: {
        pool_id: bcs.Address,
        config: PoolConfig,
        timestamp: bcs.u64()
    } });
export interface MintMaintainerCapArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
}
export interface MintMaintainerCapOptions {
    package?: string;
    arguments: MintMaintainerCapArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>
    ];
}
/** Mint a `MaintainerCap`, only admin can mint a `MaintainerCap`. */
export function mintMaintainerCap(options: MintMaintainerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'mint_maintainer_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RevokeMaintainerCapArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    maintainerCapId: RawTransactionArgument<string>;
}
export interface RevokeMaintainerCapOptions {
    package?: string;
    arguments: RevokeMaintainerCapArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        maintainerCapId: RawTransactionArgument<string>
    ];
}
/** Revoke a `MaintainerCap`. Only the admin can revoke a `MaintainerCap`. */
export function revokeMaintainerCap(options: RevokeMaintainerCapOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::object::ID',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "maintainerCapId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'revoke_maintainer_cap',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface RegisterDeepbookPoolArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    poolConfig: RawTransactionArgument<string>;
}
export interface RegisterDeepbookPoolOptions {
    package?: string;
    arguments: RegisterDeepbookPoolArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        poolConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Register a margin pool for margin trading with existing margin pools */
export function registerDeepbookPool(options: RegisterDeepbookPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::PoolConfig`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "pool", "poolConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'register_deepbook_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EnableDeepbookPoolArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
}
export interface EnableDeepbookPoolOptions {
    package?: string;
    arguments: EnableDeepbookPoolArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Enables a deepbook pool for margin trading. */
export function enableDeepbookPool(options: EnableDeepbookPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'enable_deepbook_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DisableDeepbookPoolArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
}
export interface DisableDeepbookPoolOptions {
    package?: string;
    arguments: DisableDeepbookPoolArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/**
 * Disables a deepbook pool from margin trading. Only reduce only orders, cancels,
 * and withdraw settled amounts are allowed.
 */
export function disableDeepbookPool(options: DisableDeepbookPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'disable_deepbook_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UpdateRiskParamsArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    poolConfig: RawTransactionArgument<string>;
}
export interface UpdateRiskParamsOptions {
    package?: string;
    arguments: UpdateRiskParamsArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        poolConfig: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Updates risk params for a deepbook pool as the admin. */
export function updateRiskParams(options: UpdateRiskParamsOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::PoolConfig`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "pool", "poolConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'update_risk_params',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface AddConfigArguments<Config extends BcsType<any>> {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
    config: RawTransactionArgument<Config>;
}
export interface AddConfigOptions<Config extends BcsType<any>> {
    package?: string;
    arguments: AddConfigArguments<Config> | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>,
        config: RawTransactionArgument<Config>
    ];
    typeArguments: [
        string
    ];
}
/** Add Pyth Config to the MarginRegistry. */
export function addConfig<Config extends BcsType<any>>(options: AddConfigOptions<Config>) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`,
        `${options.typeArguments[0]}`
    ] satisfies string[];
    const parameterNames = ["self", "Cap", "config"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'add_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RemoveConfigArguments {
    self: RawTransactionArgument<string>;
    Cap: RawTransactionArgument<string>;
}
export interface RemoveConfigOptions {
    package?: string;
    arguments: RemoveConfigArguments | [
        self: RawTransactionArgument<string>,
        Cap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Remove Pyth Config from the MarginRegistry. */
export function removeConfig(options: RemoveConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_registry::MarginAdminCap`
    ] satisfies string[];
    const parameterNames = ["self", "Cap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'remove_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface EnableVersionArguments {
    self: RawTransactionArgument<string>;
    version: RawTransactionArgument<number | bigint>;
    Cap: RawTransactionArgument<string>;
}
export interface EnableVersionOptions {
    package?: string;
    arguments: EnableVersionArguments | [
        self: RawTransactionArgument<string>,
        version: RawTransactionArgument<number | bigint>,
        Cap: RawTransactionArgument<string>
    ];
}
/**
 * Enables a package version Only Admin can enable a package version This function
 * does not have version restrictions
 */
export function enableVersion(options: EnableVersionOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        'u64',
        `${packageAddress}::margin_registry::MarginAdminCap`
    ] satisfies string[];
    const parameterNames = ["self", "version", "Cap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'enable_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface DisableVersionArguments {
    self: RawTransactionArgument<string>;
    version: RawTransactionArgument<number | bigint>;
    Cap: RawTransactionArgument<string>;
}
export interface DisableVersionOptions {
    package?: string;
    arguments: DisableVersionArguments | [
        self: RawTransactionArgument<string>,
        version: RawTransactionArgument<number | bigint>,
        Cap: RawTransactionArgument<string>
    ];
}
/**
 * Disables a package version Only Admin can disable a package version This
 * function does not have version restrictions
 */
export function disableVersion(options: DisableVersionOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        'u64',
        `${packageAddress}::margin_registry::MarginAdminCap`
    ] satisfies string[];
    const parameterNames = ["self", "version", "Cap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'disable_version',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NewPoolConfigArguments {
    self: RawTransactionArgument<string>;
    minWithdrawRiskRatio: RawTransactionArgument<number | bigint>;
    minBorrowRiskRatio: RawTransactionArgument<number | bigint>;
    liquidationRiskRatio: RawTransactionArgument<number | bigint>;
    targetLiquidationRiskRatio: RawTransactionArgument<number | bigint>;
    userLiquidationReward: RawTransactionArgument<number | bigint>;
    poolLiquidationReward: RawTransactionArgument<number | bigint>;
}
export interface NewPoolConfigOptions {
    package?: string;
    arguments: NewPoolConfigArguments | [
        self: RawTransactionArgument<string>,
        minWithdrawRiskRatio: RawTransactionArgument<number | bigint>,
        minBorrowRiskRatio: RawTransactionArgument<number | bigint>,
        liquidationRiskRatio: RawTransactionArgument<number | bigint>,
        targetLiquidationRiskRatio: RawTransactionArgument<number | bigint>,
        userLiquidationReward: RawTransactionArgument<number | bigint>,
        poolLiquidationReward: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
/**
 * Create a PoolConfig with margin pool IDs and risk parameters Enable is false by
 * default, must be enabled after registration
 */
export function newPoolConfig(options: NewPoolConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        'u64',
        'u64',
        'u64',
        'u64',
        'u64',
        'u64'
    ] satisfies string[];
    const parameterNames = ["self", "minWithdrawRiskRatio", "minBorrowRiskRatio", "liquidationRiskRatio", "targetLiquidationRiskRatio", "userLiquidationReward", "poolLiquidationReward"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'new_pool_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface NewPoolConfigWithLeverageArguments {
    self: RawTransactionArgument<string>;
    leverage: RawTransactionArgument<number | bigint>;
}
export interface NewPoolConfigWithLeverageOptions {
    package?: string;
    arguments: NewPoolConfigWithLeverageArguments | [
        self: RawTransactionArgument<string>,
        leverage: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Create a PoolConfig with default risk parameters based on leverage */
export function newPoolConfigWithLeverage(options: NewPoolConfigWithLeverageOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        'u64'
    ] satisfies string[];
    const parameterNames = ["self", "leverage"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'new_pool_config_with_leverage',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface PoolEnabledArguments {
    self: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
}
export interface PoolEnabledOptions {
    package?: string;
    arguments: PoolEnabledArguments | [
        self: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Check if a deepbook pool is registered for margin trading */
export function poolEnabled(options: PoolEnabledOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self", "pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'pool_enabled',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetMarginPoolIdArguments {
    self: RawTransactionArgument<string>;
}
export interface GetMarginPoolIdOptions {
    package?: string;
    arguments: GetMarginPoolIdArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
/** Get the margin pool id for the given asset. */
export function getMarginPoolId(options: GetMarginPoolIdOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'get_margin_pool_id',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface GetDeepbookPoolMarginPoolIdsArguments {
    self: RawTransactionArgument<string>;
    deepbookPoolId: RawTransactionArgument<string>;
}
export interface GetDeepbookPoolMarginPoolIdsOptions {
    package?: string;
    arguments: GetDeepbookPoolMarginPoolIdsArguments | [
        self: RawTransactionArgument<string>,
        deepbookPoolId: RawTransactionArgument<string>
    ];
}
/** Get the margin pool IDs for a deepbook pool */
export function getDeepbookPoolMarginPoolIds(options: GetDeepbookPoolMarginPoolIdsOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::object::ID'
    ] satisfies string[];
    const parameterNames = ["self", "deepbookPoolId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_registry',
        function: 'get_deepbook_pool_margin_pool_ids',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}