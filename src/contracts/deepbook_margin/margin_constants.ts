/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type Transaction } from '@mysten/sui/transactions';
export interface MarginVersionOptions {
    package?: string;
    arguments?: [
    ];
}
export function marginVersion(options: MarginVersionOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'margin_version',
    });
}
export interface MaxRiskRatioOptions {
    package?: string;
    arguments?: [
    ];
}
export function maxRiskRatio(options: MaxRiskRatioOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'max_risk_ratio',
    });
}
export interface DefaultUserLiquidationRewardOptions {
    package?: string;
    arguments?: [
    ];
}
export function defaultUserLiquidationReward(options: DefaultUserLiquidationRewardOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'default_user_liquidation_reward',
    });
}
export interface DefaultPoolLiquidationRewardOptions {
    package?: string;
    arguments?: [
    ];
}
export function defaultPoolLiquidationReward(options: DefaultPoolLiquidationRewardOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'default_pool_liquidation_reward',
    });
}
export interface MinLeverageOptions {
    package?: string;
    arguments?: [
    ];
}
export function minLeverage(options: MinLeverageOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'min_leverage',
    });
}
export interface MaxLeverageOptions {
    package?: string;
    arguments?: [
    ];
}
export function maxLeverage(options: MaxLeverageOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'max_leverage',
    });
}
export interface YearMsOptions {
    package?: string;
    arguments?: [
    ];
}
export function yearMs(options: YearMsOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'year_ms',
    });
}
export interface MinMinBorrowOptions {
    package?: string;
    arguments?: [
    ];
}
export function minMinBorrow(options: MinMinBorrowOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'min_min_borrow',
    });
}
export interface MaxMarginManagersOptions {
    package?: string;
    arguments?: [
    ];
}
export function maxMarginManagers(options: MaxMarginManagersOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'max_margin_managers',
    });
}
export interface DefaultReferralOptions {
    package?: string;
    arguments?: [
    ];
}
export function defaultReferral(options: DefaultReferralOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'default_referral',
    });
}
export interface MaxReferralSpreadOptions {
    package?: string;
    arguments?: [
    ];
}
export function maxReferralSpread(options: MaxReferralSpreadOptions = {}) {
    const packageAddress = options.package ?? '@local-pkg/deepbook-margin';
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'margin_constants',
        function: 'max_referral_spread',
    });
}