/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/


/**
 * Position manager is responsible for managing the positions of the users. It is
 * used to track the supply and loan shares of the users.
 */

import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as table from './deps/sui/table.js';
const $moduleName = '@local-pkg/margin_trading::position_manager';
export const PositionManager = new MoveStruct({ name: `${$moduleName}::PositionManager`, fields: {
        positions: table.Table
    } });
export const Position = new MoveStruct({ name: `${$moduleName}::Position`, fields: {
        shares: bcs.u64(),
        referral: bcs.option(bcs.Address)
    } });