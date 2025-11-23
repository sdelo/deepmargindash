import { SuiClient } from '@mysten/sui/client';
import { MarginPool } from '../contracts/deepbook_margin/deepbook_margin/margin_pool';
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
 * Extracts shares value from dynamic field content structure
 * Handles the nested structure: Field<address, Position> -> Position -> shares
 */
function extractSharesFromDynamicField(content: any): string | number | null {
  // Standard structure: content.fields.value.fields.shares
  const fields = content?.fields;
  const value = fields?.value;
  const valueFields = value?.fields;
  
  if (valueFields?.shares !== undefined) {
    return valueFields.shares;
  }
  
  // Fallback patterns
  if (value?.shares !== undefined) {
    return value.shares;
  }
  
  if (content?.value?.fields?.shares !== undefined) {
    return content.value.fields.shares;
  }
  
  return null;
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
  try {
    // Fetch the margin pool to access the position manager
    const poolResponse = await suiClient.getObject({
      id: poolId,
      options: {
        showBcs: true,
        showType: true,
      },
    });

    if (!poolResponse.data?.bcs || poolResponse.data.bcs.dataType !== 'moveObject') {
      return null;
    }

    // Parse the MarginPool to get the position manager
    const marginPool = MarginPool.fromBase64(poolResponse.data.bcs.bcsBytes);
    const positionTableId = marginPool.positions.positions.id.id;
    
    // Query the dynamic field for this user's position
    const positionField = await suiClient.getDynamicFieldObject({
      parentId: positionTableId,
      name: {
        type: 'address',
        value: userAddress,
      },
    });

    // Dynamic fields return content, not BCS
    if (!positionField.data?.content) {
      return null;
    }
    
    // Extract shares from the nested dynamic field structure
    const shares = extractSharesFromDynamicField(positionField.data.content);
    
    if (!shares) {
      console.warn(`Could not extract shares from position for ${userAddress} in ${asset} pool`);
      return null;
    }
    
    // Convert shares to balance using pool state
    const balanceFormatted = convertSharesToBalance(
      BigInt(shares),
      BigInt(marginPool.state.total_supply),
      BigInt(marginPool.state.supply_shares),
      decimals,
      asset
    );

    return {
      address: userAddress,
      asset,
      shares: Number(shares),
      balanceFormatted,
    };
  } catch (error) {
    console.error(`Error fetching user position from ${asset} pool:`, error);
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
  if (!userAddress) {
    return [];
  }

  // Fetch positions from both pools in parallel
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

  // Return only non-null positions
  return [suiPosition, dbusdcPosition].filter((pos): pos is UserPosition => pos !== null);
}
