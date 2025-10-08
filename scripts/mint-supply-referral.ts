#!/usr/bin/env tsx

import { Transaction } from '@mysten/sui/transactions';
import { mintSupplyReferral } from '../src/deepbook_assets/deepbook_margin/margin_pool.js';
import { getActiveAddress, signAndExecute, ACTIVE_NETWORK } from '../src/utils/account.js';
import { CONTRACTS } from '../src/config/contracts.js';

/**
 * Script to mint a supply referral for the DeepBook margin pool.
 * This creates a SupplyReferral object that can be used to earn referral fees.
 * 
 * Usage:
 *   NETWORK=testnet tsx scripts/mint-supply-referral.ts <MARGIN_POOL_ID>
 * 
 * Example:
 *   NETWORK=testnet tsx scripts/mint-supply-referral.ts 0x1234...
 */

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Usage: tsx scripts/mint-supply-referral.ts <MARGIN_POOL_ID>');
    console.error('Example: tsx scripts/mint-supply-referral.ts 0x1234...');
    process.exit(1);
  }
  
  const marginPoolId: string = args[0];
  const marginPoolType: string = args[1];
  const sender = getActiveAddress();
  
  console.log(`🔧 Minting supply referral for margin pool: ${marginPoolId}`);
  console.log(`📍 Network: ${ACTIVE_NETWORK}`);
  console.log(`👤 Sender: ${sender}`);
  console.log('');

  try {
    // Create transaction
    const tx = new Transaction();
    
    // Add the mint_supply_referral call
    mintSupplyReferral({
      arguments: {
        self: marginPoolId,
      },
      typeArguments: [marginPoolType],
    })(tx);

    // Set gas budget
    tx.setGasBudget(50_000_000);

    console.log('📝 Transaction created, signing and executing...');
    
    // Sign and execute
    const result = await signAndExecute(tx, ACTIVE_NETWORK);
    
    if (result.effects?.status?.status === 'success') {
      console.log('✅ Supply referral minted successfully!');
      console.log(`📋 Transaction digest: ${result.digest}`);
      
      // Find the created SupplyReferral object
      const createdObjects = result.objectChanges?.filter(
        change => change.type === 'created' && change.objectType?.includes('SupplyReferral')
      );
      
      if (createdObjects && createdObjects.length > 0) {
        const referralObject = createdObjects[0];
        if (referralObject.type === 'created') {
          console.log(`🎯 SupplyReferral object ID: ${referralObject.objectId}`);
          console.log('');
          console.log('💡 You can now use this referral address when calling supply():');
          console.log(`   referral: "${referralObject.objectId}"`);
          console.log('');
          console.log('📖 To claim referral fees later, use the SupplyReferral object with withdraw_referral_fees()');
        }
      }
    } else {
      console.error('❌ Transaction failed:', result.effects?.status);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error minting supply referral:', error);
    process.exit(1);
  }
}

main().catch(console.error);
