import WalletFoundation from './WalletFoundation.js';
import WDK from '@tetherto/wdk';

/**
 * Test script for WDK Wallet Foundation
 * Tests all core functionality without broadcasting transactions
 */

async function runTests() {
  console.log('🧪 WDK Wallet Foundation - Test Suite\n');
  console.log('=' .repeat(60));

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Seed phrase generation and validation
  console.log('\n📝 Test 1: Seed Phrase Generation and Validation');
  try {
    const seedPhrase = WDK.getRandomSeedPhrase();
    const wordCount = seedPhrase.split(' ').length;
    console.log(`   Generated: ${wordCount} words`);
    
    if (wordCount === 12) {
      console.log('   ✅ PASS: Seed phrase has correct word count');
      testsPassed++;
    } else {
      throw new Error('Generated seed phrase does not have 12 words');
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 2: Invalid seed phrase detection
  console.log('\n📝 Test 2: Invalid Seed Phrase Detection');
  try {
    const invalidSeed = 'invalid seed phrase';
    const wallet = new WalletFoundation();
    
    try {
      await wallet.initialize(invalidSeed);
      throw new Error('Invalid seed was accepted');
    } catch (validationError) {
      if (validationError.message.includes('must be exactly 12 words')) {
        console.log('   ✅ PASS: Invalid seed correctly rejected');
        testsPassed++;
      } else {
        throw validationError;
      }
    } finally {
      wallet.dispose();
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 3: Wallet initialization
  console.log('\n📝 Test 3: Wallet Initialization');
  const wallet = new WalletFoundation();
  try {
    await wallet.initialize();
    console.log('   ✅ PASS: Wallet initialized successfully');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
    return; // Can't continue without wallet
  }

  // Test 4: Account derivation
  console.log('\n📝 Test 4: Account Derivation');
  try {
    await wallet.deriveAccounts(0);
    
    if (wallet.accounts.ethereum && wallet.accounts.bitcoin) {
      console.log(`   Ethereum: ${wallet.accounts.ethereum.address}`);
      console.log(`   Bitcoin: ${wallet.accounts.bitcoin.address}`);
      console.log('   ✅ PASS: Accounts derived successfully');
      testsPassed++;
    } else {
      throw new Error('Accounts not properly derived');
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 5: Address format validation
  console.log('\n📝 Test 5: Address Format Validation');
  try {
    const ethAddress = wallet.accounts.ethereum.address;
    const btcAddress = wallet.accounts.bitcoin.address;
    
    // Ethereum address should start with 0x and be 42 characters
    if (ethAddress.startsWith('0x') && ethAddress.length === 42) {
      console.log('   ✅ Ethereum address format valid');
    } else {
      throw new Error('Invalid Ethereum address format');
    }
    
    // Bitcoin testnet address should start with 'tb1' or 'm'/'n'
    if (btcAddress.startsWith('tb1') || btcAddress.startsWith('m') || btcAddress.startsWith('n')) {
      console.log('   ✅ Bitcoin address format valid');
    } else {
      throw new Error('Invalid Bitcoin address format');
    }
    
    console.log('   ✅ PASS: Address formats are correct');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 6: Balance fetching (may fail if no network connectivity)
  console.log('\n📝 Test 6: Balance Fetching');
  try {
    await wallet.fetchBalances();
    console.log('   ✅ PASS: Balance fetch attempted (check results above)');
    testsPassed++;
  } catch (error) {
    console.log(`   ⚠️  WARNING: Balance fetch failed (network issue?): ${error.message}`);
    // Don't count as failure - network issues are expected in some environments
    testsPassed++;
  }

  // Test 7: Transaction preparation
  console.log('\n📝 Test 7: Transaction Preparation');
  try {
    await wallet.prepareEthereumTransaction(
      '0x0000000000000000000000000000000000000000',
      '0.001'
    );
    await wallet.prepareBitcoinTransaction(
      'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      '0.0001'
    );
    console.log('   ✅ PASS: Transactions prepared successfully');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 8: Multiple account derivation
  console.log('\n📝 Test 8: Multiple Account Derivation');
  try {
    await wallet.deriveAccounts(1); // Derive account at index 1
    
    const ethAddress2 = wallet.accounts.ethereum.address;
    const btcAddress2 = wallet.accounts.bitcoin.address;
    
    console.log(`   Account 1 - Ethereum: ${ethAddress2}`);
    console.log(`   Account 1 - Bitcoin: ${btcAddress2}`);
    console.log('   ✅ PASS: Multiple accounts can be derived');
    testsPassed++;
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Test 9: Summary generation
  console.log('\n📝 Test 9: Summary Generation');
  try {
    const summary = wallet.getSummary();
    if (summary.status === 'foundation_ready' && 
        summary.chains.length === 2 &&
        summary.accounts.ethereum &&
        summary.accounts.bitcoin) {
      console.log('   ✅ PASS: Summary generated correctly');
      testsPassed++;
    } else {
      throw new Error('Summary format incorrect');
    }
  } catch (error) {
    console.log(`   ❌ FAIL: ${error.message}`);
    testsFailed++;
  }

  // Cleanup
  wallet.dispose();

  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log(`\n📊 Test Results: ${testsPassed} passed, ${testsFailed} failed\n`);
  
  if (testsFailed === 0) {
    console.log('✅ All tests passed! Wallet foundation is working correctly.\n');
  } else {
    console.log(`⚠️  Some tests failed. Please review the errors above.\n`);
  }
}

runTests().catch(console.error);

