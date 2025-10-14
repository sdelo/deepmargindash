import { SuiClient } from '@mysten/sui/client';
import { MarginPool } from '../contracts/deepbook_margin/margin_pool';
import { Position } from '../contracts/deepbook_margin/position_manager';
import { CONTRACTS } from '../config/contracts';
import type { UserPosition, PoolAssetSymbol } from '../features/lending/types';

/**
 * Converts shares to balance using the formula from margin_state.move supply_shares_to_amount
 * Based on lines 127-151 of margin_state.move
 */
function convertSharesToBalance(
  shares: bigint,
  totalSupply: bigint,
  supplyShares: bigint,
  decimals: number,
  asset: PoolAssetSymbol
): string {
  // FLOAT_SCALING constant from deepbook (1e9)
  const FLOAT_SCALING = 1_000_000_000n;
  
  const ratio = supplyShares === 0n 
    ? FLOAT_SCALING
    : (totalSupply * FLOAT_SCALING) / supplyShares;
  
  const balanceSmallUnits = (shares * ratio) / FLOAT_SCALING;
  const balance = Number(balanceSmallUnits) / (10 ** decimals);
  
  return `${balance.toLocaleString()} ${asset}`;
}

/**
 * Fetches a user's position from a specific margin pool
 */
export async function fetchUserPositionFromPool(
  suiClient: SuiClient,
  poolId: string,
  userAddress: string,
  asset: PoolAssetSymbol,
  decimals: number
): Promise<UserPosition | null> {
  console.log(`🔍 Fetching user position for ${userAddress} in ${asset} pool (${poolId})`);
  
  try {
    // First, get the margin pool to access the position manager
    console.log(`📡 Fetching margin pool object for ${poolId}`);
    const poolResponse = await suiClient.getObject({
      id: poolId,
      options: {
        showBcs: true,
        showType: true,
      },
    });

    if (!poolResponse.data || !poolResponse.data.bcs) {
      console.warn(`❌ No BCS data found for pool ${poolId}`);
      return null;
    }

    const bcsData = poolResponse.data.bcs;
    console.log(`📦 Pool BCS data type: ${bcsData.dataType}`);
    
    if (bcsData.dataType !== 'moveObject') {
      console.warn(`❌ Object ${poolId} is not a move object`);
      return null;
    }

    // Parse the MarginPool to get the position manager
    console.log(`🔧 Parsing MarginPool from BCS data`);
    const marginPool = MarginPool.fromBase64(bcsData.bcsBytes);
    const positionManager = marginPool.positions;
    
    console.log(`📊 Position manager table ID: ${positionManager.positions.id.id}`);
    console.log(`📊 Position manager table size: ${positionManager.positions.size}`);
    
    // Query the dynamic field for this user's position
    console.log(`🔍 Querying dynamic field for user ${userAddress} ${positionManager.positions.id.id}`);
    const positionField = await suiClient.getDynamicFieldObject({
      parentId: positionManager.positions.id.id,
      name: {
        type: 'address',
        value: userAddress,
      },
    });

    console.log(`📋 Dynamic field response:`, {
      hasData: !!positionField.data,
      hasBcs: !!(positionField.data?.bcs),
      dataType: positionField.data?.bcs?.dataType,
    });

    if (!positionField.data || !positionField.data.bcs) {
      console.log(`❌ No position found for user ${userAddress} in ${asset} pool`);
      return null;
    }

    // Parse the Position object
    const positionBcsData = positionField.data.bcs;
    if (positionBcsData.dataType !== 'moveObject') {
      console.warn(`❌ Position field is not a move object for user ${userAddress}`);
      return null;
    }
    
    console.log(`🔧 Parsing Position from BCS data`);
    const position = Position.fromBase64(positionBcsData.bcsBytes);
    console.log(`📊 Position shares: ${position.shares}`);
    
    // Convert shares to balance using pool state
    const balanceFormatted = convertSharesToBalance(
      BigInt(position.shares),
      BigInt(marginPool.state.total_supply),
      BigInt(marginPool.state.supply_shares),
      decimals,
      asset
    );

    console.log(`✅ Successfully fetched position:`, {
      asset,
      shares: position.shares,
      balanceFormatted,
      totalSupply: marginPool.state.total_supply,
      supplyShares: marginPool.state.supply_shares,
    });

    return {
      address: userAddress,
      asset,
      shares: Number(position.shares),
      balanceFormatted,
    };
  } catch (error) {
    console.error(`❌ Error fetching user position from pool ${poolId}:`, error);
    return null;
  }
}

/**
 * Fetches all user positions across all margin pools
 */
export async function fetchUserPositions(
  suiClient: SuiClient,
  userAddress: string
): Promise<UserPosition[]> {
  console.log(`🚀 Starting to fetch all user positions for ${userAddress}`);
  
  if (!userAddress) {
    console.log(`❌ No user address provided`);
    return [];
  }

  const positions: UserPosition[] = [];

  // Fetch positions from both pools in parallel
  console.log(`🔄 Fetching positions from both pools in parallel...`);
  const [suiPosition, dbusdcPosition] = await Promise.all([
    fetchUserPositionFromPool(
      suiClient,
      CONTRACTS.testnet.SUI_MARGIN_POOL_ID,
      userAddress,
      'SUI',
      9 // SUI has 9 decimals
    ),
    fetchUserPositionFromPool(
      suiClient,
      CONTRACTS.testnet.DBUSDC_MARGIN_POOL_ID,
      userAddress,
      'DBUSDC',
      6 // DBUSDC has 6 decimals
    ),
  ]);

  console.log(`📊 Pool fetch results:`, {
    suiPosition: suiPosition ? 'Found' : 'Not found',
    dbusdcPosition: dbusdcPosition ? 'Found' : 'Not found',
  });

  // Add non-null positions to the result
  if (suiPosition) {
    positions.push(suiPosition);
    console.log(`✅ Added SUI position:`, suiPosition);
  }
  if (dbusdcPosition) {
    positions.push(dbusdcPosition);
    console.log(`✅ Added DBUSDC position:`, dbusdcPosition);
  }

  console.log(`🎯 Total positions found: ${positions.length}`, positions);
  return positions;
}
