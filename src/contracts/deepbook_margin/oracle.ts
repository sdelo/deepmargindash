/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/** Oracle module for margin trading. */

import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/std/type_name.js';
import * as vec_map from './deps/sui/vec_map.js';
const $moduleName = '@local-pkg/deepbook-margin::oracle';
export const CoinTypeData = new MoveStruct({ name: `${$moduleName}::CoinTypeData`, fields: {
        decimals: bcs.u8(),
        price_feed_id: bcs.vector(bcs.u8()),
        type_name: type_name.TypeName
    } });
export const PythConfig = new MoveStruct({ name: `${$moduleName}::PythConfig`, fields: {
        currencies: vec_map.VecMap(type_name.TypeName, CoinTypeData),
        max_age_secs: bcs.u64()
    } });
export const ConversionConfig = new MoveStruct({ name: `${$moduleName}::ConversionConfig`, fields: {
        target_decimals: bcs.u8(),
        base_decimals: bcs.u8(),
        pyth_price: bcs.u64(),
        pyth_decimals: bcs.u8()
    } });
export interface NewCoinTypeDataArguments {
    coinMetadata: RawTransactionArgument<string>;
    priceFeedId: RawTransactionArgument<number[]>;
}
export interface NewCoinTypeDataOptions {
    package?: string;
    arguments: NewCoinTypeDataArguments | [
        coinMetadata: RawTransactionArgument<string>,
        priceFeedId: RawTransactionArgument<number[]>
    ];
    typeArguments: [
        string
    ];
}
/**
 * Creates a new CoinTypeData struct of type T. Uses CoinMetadata to avoid any
 * errors in decimals.
 */
export function newCoinTypeData(options: NewCoinTypeDataOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `0x0000000000000000000000000000000000000000000000000000000000000002::coin::CoinMetadata<${options.typeArguments[0]}>`,
        'vector<u8>'
    ] satisfies string[];
    const parameterNames = ["coinMetadata", "priceFeedId"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'oracle',
        function: 'new_coin_type_data',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface NewPythConfigArguments {
    setups: RawTransactionArgument<string[]>;
    maxAgeSecs: RawTransactionArgument<number | bigint>;
}
export interface NewPythConfigOptions {
    package?: string;
    arguments: NewPythConfigArguments | [
        setups: RawTransactionArgument<string[]>,
        maxAgeSecs: RawTransactionArgument<number | bigint>
    ];
}
/**
 * Creates a new PythConfig struct. Can be attached by the Admin to MarginRegistry
 * to allow oracle to work.
 */
export function newPythConfig(options: NewPythConfigOptions) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    const argumentsTypes = [
        `vector<${packageAddress}::oracle::CoinTypeData>`,
        'u64'
    ] satisfies string[];
    const parameterNames = ["setups", "maxAgeSecs"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'oracle',
        function: 'new_pyth_config',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
    });
}