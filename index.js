import WalletFoundation from './WalletFoundation.js';

/**
 * Main entry point for WDK Wallet Foundation
 * This file demonstrates the complete wallet initialization flow
 */

async function main() {
  const wallet = new WalletFoundation();

  try {
    console.log('🚀 WDK Wallet Foundation - Initialization\n');
    console.log('=' .repeat(60));
    console.log('\n');

    // Step 1: Initialize wallet (generates new seed phrase)
    // To use existing seed, pass it as parameter: wallet.initialize('your twelve word seed phrase here...')
    await wallet.initialize();

    // Step 2: Derive accounts for index 0
    await wallet.deriveAccounts(0);

    // Step 3: Fetch balances
    await wallet.fetchBalances();

    // Step 4: Demonstrate transaction preparation (safe, no broadcast)
    console.log('📤 Transaction Examples:\n');
    
    // Example Ethereum transaction (using dummy testnet address)
    await wallet.prepareEthereumTransaction(
      '0x0000000000000000000000000000000000000000',
      '0.001' // 0.001 ETH
    );

    // Example Bitcoin transaction (using dummy testnet address)
    await wallet.prepareBitcoinTransaction(
      'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
      '0.0001' // 0.0001 BTC
    );

    // Step 5: Save wallet data
    await wallet.saveWalletData();

    // Step 6: Generate and display summary
    console.log('=' .repeat(60));
    console.log('\n📊 WALLET SUMMARY\n');
    const summary = wallet.getSummary();
    console.log(JSON.stringify(summary, null, 2));
    console.log('\n' + '=' .repeat(60));

    console.log('\n✅ Foundation wallet is ready!');
    console.log('\nNext steps:');
    console.log('  • Fund your testnet wallets to test transactions');
    console.log('  • Add more chains or protocols as needed');
    console.log('  • Integrate with UI or AI agent wrapper');
    console.log('  • Implement transaction broadcasting (when ready)\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    // Cleanup
    wallet.dispose();
  }
}

// Run the main function
main().catch(console.error);

