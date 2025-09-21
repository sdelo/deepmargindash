/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as object from './deps/sui/object.js';
import * as balance_manager from './deps/deepbook/balance_manager.js';
const $moduleName = '@local-pkg/margin_trading::margin_manager';
export const MarginManager = new MoveStruct({ name: `${$moduleName}::MarginManager`, fields: {
        id: object.UID,
        owner: bcs.Address,
        deepbook_pool: bcs.Address,
        margin_pool_id: bcs.option(bcs.Address),
        balance_manager: balance_manager.BalanceManager,
        deposit_cap: balance_manager.DepositCap,
        withdraw_cap: balance_manager.WithdrawCap,
        trade_cap: balance_manager.TradeCap,
        borrowed_base_shares: bcs.u64(),
        borrowed_quote_shares: bcs.u64()
    } });
export const ManagerInitializer = new MoveStruct({ name: `${$moduleName}::ManagerInitializer`, fields: {
        margin_manager_id: bcs.Address
    } });
export const MarginManagerEvent = new MoveStruct({ name: `${$moduleName}::MarginManagerEvent`, fields: {
        margin_manager_id: bcs.Address,
        balance_manager_id: bcs.Address,
        owner: bcs.Address,
        timestamp: bcs.u64()
    } });
export const LoanBorrowedEvent = new MoveStruct({ name: `${$moduleName}::LoanBorrowedEvent`, fields: {
        margin_manager_id: bcs.Address,
        margin_pool_id: bcs.Address,
        loan_amount: bcs.u64(),
        total_borrow: bcs.u64(),
        total_shares: bcs.u64(),
        timestamp: bcs.u64()
    } });
export const LoanRepaidEvent = new MoveStruct({ name: `${$moduleName}::LoanRepaidEvent`, fields: {
        margin_manager_id: bcs.Address,
        margin_pool_id: bcs.Address,
        repay_amount: bcs.u64(),
        repay_shares: bcs.u64(),
        timestamp: bcs.u64()
    } });
export const LiquidationEvent = new MoveStruct({ name: `${$moduleName}::LiquidationEvent`, fields: {
        margin_manager_id: bcs.Address,
        margin_pool_id: bcs.Address,
        liquidation_amount: bcs.u64(),
        pool_reward: bcs.u64(),
        pool_default: bcs.u64(),
        risk_ratio: bcs.u64(),
        timestamp: bcs.u64()
    } });
export interface NewArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
}
export interface NewOptions {
    package?: string;
    arguments: NewArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Creates a new margin manager and shares it. */
export function _new(options: NewOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["pool", "registry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'new',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface NewWithInitializerArguments {
    pool: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
}
export interface NewWithInitializerOptions {
    package?: string;
    arguments: NewWithInitializerArguments | [
        pool: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/**
 * Creates a new margin manager and returns it along with an initializer. The
 * initializer is used to ensure the margin manager is shared after creation.
 */
export function newWithInitializer(options: NewWithInitializerOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["pool", "registry"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'new_with_initializer',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface ShareArguments {
    manager: RawTransactionArgument<string>;
    initializer: RawTransactionArgument<string>;
}
export interface ShareOptions {
    package?: string;
    arguments: ShareArguments | [
        manager: RawTransactionArgument<string>,
        initializer: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Shares the margin manager. The initializer is dropped in the process. */
export function share(options: ShareOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_manager::ManagerInitializer`
    ] satisfies string[];
    const parameterNames = ["manager", "initializer"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'share',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface SetReferralArguments {
    self: RawTransactionArgument<string>;
    referralCap: RawTransactionArgument<string>;
}
export interface SetReferralOptions {
    package?: string;
    arguments: SetReferralArguments | [
        self: RawTransactionArgument<string>,
        referralCap: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Set the referral for the margin manager. */
export function setReferral(options: SetReferralOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::balance_manager::DeepBookReferral`
    ] satisfies string[];
    const parameterNames = ["self", "referralCap"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'set_referral',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface UnsetReferralArguments {
    self: RawTransactionArgument<string>;
}
export interface UnsetReferralOptions {
    package?: string;
    arguments: UnsetReferralArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Unset the referral for the margin manager. */
export function unsetReferral(options: UnsetReferralOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'unset_referral',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DepositArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    coin: RawTransactionArgument<string>;
}
export interface DepositOptions {
    package?: string;
    arguments: DepositArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        coin: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
/**
 * Deposit a coin into the margin manager. The coin must be of the same type as
 * either the base, quote, or DEEP.
 */
export function deposit(options: DepositOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${options.typeArguments[2]}>`
    ] satisfies string[];
    const parameterNames = ["self", "registry", "coin"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'deposit',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface WithdrawArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    baseMarginPool: RawTransactionArgument<string>;
    quoteMarginPool: RawTransactionArgument<string>;
    baseOracle: RawTransactionArgument<string>;
    quoteOracle: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    withdrawAmount: RawTransactionArgument<number | bigint>;
}
export interface WithdrawOptions {
    package?: string;
    arguments: WithdrawArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        baseMarginPool: RawTransactionArgument<string>,
        quoteMarginPool: RawTransactionArgument<string>,
        baseOracle: RawTransactionArgument<string>,
        quoteOracle: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        withdrawAmount: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
/**
 * Withdraw a specified amount of an asset from the margin manager. The asset must
 * be of the same type as either the base, quote, or DEEP. The withdrawal is
 * subject to the risk ratio limit.
 */
export function withdraw(options: WithdrawOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[1]}>`,
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        'u64',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "baseMarginPool", "quoteMarginPool", "baseOracle", "quoteOracle", "pool", "withdrawAmount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'withdraw',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowBaseArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    baseMarginPool: RawTransactionArgument<string>;
    baseOracle: RawTransactionArgument<string>;
    quoteOracle: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    loanAmount: RawTransactionArgument<number | bigint>;
}
export interface BorrowBaseOptions {
    package?: string;
    arguments: BorrowBaseArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        baseMarginPool: RawTransactionArgument<string>,
        baseOracle: RawTransactionArgument<string>,
        quoteOracle: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        loanAmount: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Borrow the base asset using the margin manager. */
export function borrowBase(options: BorrowBaseOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        'u64',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "baseMarginPool", "baseOracle", "quoteOracle", "pool", "loanAmount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'borrow_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowQuoteArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    quoteMarginPool: RawTransactionArgument<string>;
    baseOracle: RawTransactionArgument<string>;
    quoteOracle: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    loanAmount: RawTransactionArgument<number | bigint>;
}
export interface BorrowQuoteOptions {
    package?: string;
    arguments: BorrowQuoteArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        quoteMarginPool: RawTransactionArgument<string>,
        baseOracle: RawTransactionArgument<string>,
        quoteOracle: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        loanAmount: RawTransactionArgument<number | bigint>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Borrow the quote asset using the margin manager. */
export function borrowQuote(options: BorrowQuoteOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[1]}>`,
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        'u64',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "quoteMarginPool", "baseOracle", "quoteOracle", "pool", "loanAmount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'borrow_quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RepayBaseArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    marginPool: RawTransactionArgument<string>;
    amount: RawTransactionArgument<number | bigint | null>;
}
export interface RepayBaseOptions {
    package?: string;
    arguments: RepayBaseArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        marginPool: RawTransactionArgument<string>,
        amount: RawTransactionArgument<number | bigint | null>
    ];
    typeArguments: [
        string,
        string
    ];
}
/**
 * Repay the base asset loan using the margin manager. Returns the total amount
 * repaid
 */
export function repayBase(options: RepayBaseOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[0]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000001::option::Option<u64>',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "marginPool", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'repay_base',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RepayQuoteArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    marginPool: RawTransactionArgument<string>;
    amount: RawTransactionArgument<number | bigint | null>;
}
export interface RepayQuoteOptions {
    package?: string;
    arguments: RepayQuoteArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        marginPool: RawTransactionArgument<string>,
        amount: RawTransactionArgument<number | bigint | null>
    ];
    typeArguments: [
        string,
        string
    ];
}
/**
 * Repay the quote asset loan using the margin manager. Returns the total amount
 * repaid
 */
export function repayQuote(options: RepayQuoteOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[1]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000001::option::Option<u64>',
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "marginPool", "amount"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'repay_quote',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface LiquidateArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    baseOracle: RawTransactionArgument<string>;
    quoteOracle: RawTransactionArgument<string>;
    marginPool: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    repayCoin: RawTransactionArgument<string>;
}
export interface LiquidateOptions {
    package?: string;
    arguments: LiquidateArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        baseOracle: RawTransactionArgument<string>,
        quoteOracle: RawTransactionArgument<string>,
        marginPool: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        repayCoin: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function liquidate(options: LiquidateOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[2]}>`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `0x0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<${options.typeArguments[2]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "baseOracle", "quoteOracle", "marginPool", "pool", "repayCoin"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'liquidate',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface RiskRatioArguments {
    self: RawTransactionArgument<string>;
    registry: RawTransactionArgument<string>;
    baseOracle: RawTransactionArgument<string>;
    quoteOracle: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
    marginPool: RawTransactionArgument<string>;
}
export interface RiskRatioOptions {
    package?: string;
    arguments: RiskRatioArguments | [
        self: RawTransactionArgument<string>,
        registry: RawTransactionArgument<string>,
        baseOracle: RawTransactionArgument<string>,
        quoteOracle: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>,
        marginPool: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string,
        string
    ];
}
export function riskRatio(options: RiskRatioOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_registry::MarginRegistry`,
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        '0x00b53b0f4174108627fbee72e2498b58d6a2714cded53fac537034c220d26302::price_info::PriceInfoObject',
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::margin_pool::MarginPool<${options.typeArguments[2]}>`,
        '0x0000000000000000000000000000000000000000000000000000000000000002::clock::Clock'
    ] satisfies string[];
    const parameterNames = ["self", "registry", "baseOracle", "quoteOracle", "pool", "marginPool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'risk_ratio',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BalanceManagerArguments {
    self: RawTransactionArgument<string>;
}
export interface BalanceManagerOptions {
    package?: string;
    arguments: BalanceManagerArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function balanceManager(options: BalanceManagerOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'balance_manager',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface CalculateAssetsArguments {
    self: RawTransactionArgument<string>;
    pool: RawTransactionArgument<string>;
}
export interface CalculateAssetsOptions {
    package?: string;
    arguments: CalculateAssetsArguments | [
        self: RawTransactionArgument<string>,
        pool: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
/** Returns (base_asset, quote_asset) for margin manager. */
export function calculateAssets(options: CalculateAssetsOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`,
        `${packageAddress}::pool::Pool<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self", "pool"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'calculate_assets',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface DeepbookPoolArguments {
    self: RawTransactionArgument<string>;
}
export interface DeepbookPoolOptions {
    package?: string;
    arguments: DeepbookPoolArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function deepbookPool(options: DeepbookPoolOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'deepbook_pool',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowedSharesArguments {
    self: RawTransactionArgument<string>;
}
export interface BorrowedSharesOptions {
    package?: string;
    arguments: BorrowedSharesArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowedShares(options: BorrowedSharesOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'borrowed_shares',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowedBaseSharesArguments {
    self: RawTransactionArgument<string>;
}
export interface BorrowedBaseSharesOptions {
    package?: string;
    arguments: BorrowedBaseSharesArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowedBaseShares(options: BorrowedBaseSharesOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'borrowed_base_shares',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}
export interface BorrowedQuoteSharesArguments {
    self: RawTransactionArgument<string>;
}
export interface BorrowedQuoteSharesOptions {
    package?: string;
    arguments: BorrowedQuoteSharesArguments | [
        self: RawTransactionArgument<string>
    ];
    typeArguments: [
        string,
        string
    ];
}
export function borrowedQuoteShares(options: BorrowedQuoteSharesOptions) {
    const packageAddress = options.package ?? '@local-pkg/margin_trading';
    const argumentsTypes = [
        `${packageAddress}::margin_manager::MarginManager<${options.typeArguments[0]}, ${options.typeArguments[1]}>`
    ] satisfies string[];
    const parameterNames = ["self"];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_manager',
        function: 'borrowed_quote_shares',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes, parameterNames),
        typeArguments: options.typeArguments
    });
}