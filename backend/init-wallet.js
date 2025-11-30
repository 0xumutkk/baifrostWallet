import WalletFoundation from './WalletFoundation.js';
import WDK from '@tetherto/wdk';

/**
 * Wallet Initialization Script
 * Use this to create a new wallet or restore from existing seed
 */

async function initWallet() {
  const wallet = new WalletFoundation();

  try {
    console.log('🔐 Wallet Initialization\n');

    // Check if user wants to restore or create new
    const args = process.argv.slice(2);
    let seedPhrase = null;

    if (args.length > 0) {
      // Restore from provided seed phrase
      seedPhrase = args.join(' ');
      console.log('📥 Restoring wallet from provided seed phrase...\n');
    } else {
      // Generate new seed phrase
      console.log('🆕 Creating new wallet...\n');
    }

    // Initialize
    await wallet.initialize(seedPhrase);

    // Derive first account
    await wallet.deriveAccounts(0);

    // Save wallet info
    await wallet.saveWalletData();

    console.log('✅ Wallet initialized successfully!\n');
    console.log('⚠️  IMPORTANT: Save your seed phrase in a secure location!');
    console.log('⚠️  Without it, you cannot recover your wallet!\n');

  } catch (error) {
    console.error('❌ Initialization failed:', error.message);
  } finally {
    wallet.dispose();
  }
}

initWallet().catch(console.error);

