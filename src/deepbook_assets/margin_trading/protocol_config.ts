/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
const $moduleName = '@local-pkg/margin_trading::protocol_config';
export const MarginPoolConfig = new MoveStruct({ name: `${$moduleName}::MarginPoolConfig`, fields: {
        supply_cap: bcs.u64(),
        max_utilization_rate: bcs.u64(),
        protocol_spread: bcs.u64(),
        min_borrow: bcs.u64()
    } });
export const InterestConfig = new MoveStruct({ name: `${$moduleName}::InterestConfig`, fields: {
        base_rate: bcs.u64(),
        base_slope: bcs.u64(),
        optimal_utilization: bcs.u64(),
        excess_slope: bcs.u64()
    } });
export const ProtocolConfig = new MoveStruct({ name: `${$moduleName}::ProtocolConfig`, fields: {
        margin_pool_config: MarginPoolConfig,
        interest_config: InterestConfig
    } });
export interface NewProtocolConfigArguments {
    marginPoolConfig: RawTransactionArgument<string>;
    interestConfig: RawTransactionArgument<string>;
}
export interface NewProtocolConfigOptions {
    package?: string;
    arguments: NewProtocolConfigArguments | [
        marginPoolConfig: RawTransactionArgument<string>,
        interestConfig: RawTransactionArgument<string>
    ];
}
export function newProtocolConfig(options: NewProtocolConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::protocol_config::MarginPoolConfig`,
        `${packageAddress}::protocol_config::InterestConfig`
    ] satisfies string[];
    const parameterNames = ["marginPoolConfig", "interestConfig"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'protocol_config',
        function: 'new_protocol_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NewMarginPoolConfigArguments {
    supplyCap: RawTransactionArgument<number | bigint>;
    maxUtilizationRate: RawTransactionArgument<number | bigint>;
    protocolSpread: RawTransactionArgument<number | bigint>;
    minBorrow: RawTransactionArgument<number | bigint>;
}
export interface NewMarginPoolConfigOptions {
    package?: string;
    arguments: NewMarginPoolConfigArguments | [
        supplyCap: RawTransactionArgument<number | bigint>,
        maxUtilizationRate: RawTransactionArgument<number | bigint>,
        protocolSpread: RawTransactionArgument<number | bigint>,
        minBorrow: RawTransactionArgument<number | bigint>
    ];
}
export function newMarginPoolConfig(options: NewMarginPoolConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        'u64',
        'u64',
        'u64',
        'u64'
    ] satisfies string[];
    const parameterNames = ["supplyCap", "maxUtilizationRate", "protocolSpread", "minBorrow"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'protocol_config',
        function: 'new_margin_pool_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}
export interface NewInterestConfigArguments {
    baseRate: RawTransactionArgument<number | bigint>;
    baseSlope: RawTransactionArgument<number | bigint>;
    optimalUtilization: RawTransactionArgument<number | bigint>;
    excessSlope: RawTransactionArgument<number | bigint>;
}
export interface NewInterestConfigOptions {
    package?: string;
    arguments: NewInterestConfigArguments | [
        baseRate: RawTransactionArgument<number | bigint>,
        baseSlope: RawTransactionArgument<number | bigint>,
        optimalUtilization: RawTransactionArgument<number | bigint>,
        excessSlope: RawTransactionArgument<number | bigint>
    ];
}
export function newInterestConfig(options: NewInterestConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        'u64',
        'u64',
        'u64',
        'u64'
    ] satisfies string[];
    const parameterNames = ["baseRate", "baseSlope", "optimalUtilization", "excessSlope"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'protocol_config',
        function: 'new_interest_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}