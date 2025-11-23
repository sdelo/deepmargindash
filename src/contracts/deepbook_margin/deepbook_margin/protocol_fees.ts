/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as table from './deps/sui/table.js';
import * as vec_map from './deps/sui/vec_map.js';
import * as object from './deps/sui/object.js';
const $moduleName = '@local-pkg/deepbook-margin::protocol_fees';
export const ProtocolFees = new MoveStruct({ name: `${$moduleName}::ProtocolFees`, fields: {
        referrals: table.Table,
        total_shares: bcs.u64(),
        fees_per_share: bcs.u64(),
        maintainer_fees: bcs.u64(),
        protocol_fees: bcs.u64(),
        extra_fields: vec_map.VecMap(bcs.string(), bcs.u64())
    } });
export const ReferralTracker = new MoveStruct({ name: `${$moduleName}::ReferralTracker`, fields: {
        current_shares: bcs.u64(),
        last_fees_per_share: bcs.u64(),
        unclaimed_fees: bcs.u64()
    } });
export const SupplyReferral = new MoveStruct({ name: `${$moduleName}::SupplyReferral`, fields: {
        id: object.UID,
        owner: bcs.Address
    } });
export const ProtocolFeesIncreasedEvent = new MoveStruct({ name: `${$moduleName}::ProtocolFeesIncreasedEvent`, fields: {
        margin_pool_id: bcs.Address,
        total_shares: bcs.u64(),
        referral_fees: bcs.u64(),
        maintainer_fees: bcs.u64(),
        protocol_fees: bcs.u64()
    } });
export const ReferralFeesClaimedEvent = new MoveStruct({ name: `${$moduleName}::ReferralFeesClaimedEvent`, fields: {
        referral_id: bcs.Address,
        owner: bcs.Address,
        fees: bcs.u64()
    } });