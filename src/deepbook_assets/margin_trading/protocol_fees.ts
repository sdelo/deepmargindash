/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as table from './deps/sui/table.js';
import * as object from './deps/sui/object.js';
const $moduleName = '@local-pkg/margin_trading::protocol_fees';
export const ProtocolFees = new MoveStruct({ name: `${$moduleName}::ProtocolFees`, fields: {
        referrals: table.Table,
        total_shares: bcs.u64(),
        fees_per_share: bcs.u64()
    } });
export const ReferralTracker = new MoveStruct({ name: `${$moduleName}::ReferralTracker`, fields: {
        shares: bcs.u64(),
        share_ms: bcs.u64(),
        last_update_timestamp: bcs.u64()
    } });
export const Referral = new MoveStruct({ name: `${$moduleName}::Referral`, fields: {
        id: object.UID,
        owner: bcs.Address,
        last_claim_timestamp: bcs.u64(),
        last_claim_share_ms: bcs.u64(),
        last_fees_per_share: bcs.u64()
    } });