/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = '@local-pkg/margin_trading::margin_state';
export const State = new MoveStruct({ name: `${$moduleName}::State`, fields: {
        supply: bcs.u64(),
        borrow: bcs.u64(),
        supply_shares: bcs.u64(),
        borrow_shares: bcs.u64(),
        last_update_timestamp: bcs.u64()
    } });