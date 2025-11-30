import WalletFoundation from './WalletFoundation.js';

/**
 * Example: Using the Wallet Foundation Programmatically
 * This file shows how to integrate the wallet into your own application
 */

// Example 1: Create a new wallet and get account info
async function example1_CreateNewWallet() {
  console.log('=== Example 1: Create New Wallet ===\n');
  
  const wallet = new WalletFoundation();
  
  // Initialize with a new seed (will be generated)
  await wallet.initialize();
  
  // Derive accounts
  await wallet.deriveAccounts(0);
  
  // Access account information
  const ethAddress = wallet.accounts.ethereum.address;
  const btcAddress = wallet.accounts.bitcoin.address;
  
  console.log('Ethereum Address:', ethAddress);
  console.log('Bitcoin Address:', btcAddress);
  
  wallet.dispose();
}

// Example 2: Restore wallet from existing seed
async function example2_RestoreWallet() {
  console.log('\n=== Example 2: Restore Wallet from Seed ===\n');
  
  const wallet = new WalletFoundation();
  
  // Use an existing seed phrase (NEVER share your real seed!)
  const existingSeed = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
  
  await wallet.initialize(existingSeed);
  await wallet.deriveAccounts(0);
  
  console.log('Wallet restored!');
  console.log('Ethereum Address:', wallet.accounts.ethereum.address);
  console.log('Bitcoin Address:', wallet.accounts.bitcoin.address);
  
  wallet.dispose();
}

// Example 3: Check balances
async function example3_CheckBalances() {
  console.log('\n=== Example 3: Check Balances ===\n');
  
  const wallet = new WalletFoundation();
  await wallet.initialize();
  await wallet.deriveAccounts(0);
  
  // Fetch current balances
  await wallet.fetchBalances();
  
  console.log('Ethereum Balance:', wallet.accounts.ethereum.balance, 'ETH');
  console.log('Bitcoin Balance:', wallet.accounts.bitcoin.balance, 'BTC');
  
  wallet.dispose();
}

// Example 4: Prepare a transaction (safe, no broadcast)
async function example4_PrepareTransaction() {
  console.log('\n=== Example 4: Prepare Transaction ===\n');
  
  const wallet = new WalletFoundation();
  await wallet.initialize();
  await wallet.deriveAccounts(0);
  
  // Prepare Ethereum transaction
  const ethTx = await wallet.prepareEthereumTransaction(
    '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', // Example address
    '0.01' // 0.01 ETH
  );
  
  console.log('Ethereum transaction prepared:', ethTx);
  
  // To actually send (ONLY DO THIS IF YOU HAVE FUNDS AND KNOW WHAT YOU'RE DOING):
  // const result = await wallet.accounts.ethereum.account.sendTransaction(ethTx);
  // console.log('Transaction hash:', result.hash);
  // console.log('Transaction fee:', result.fee);
  
  wallet.dispose();
}

// Example 5: Derive multiple accounts
async function example5_MultipleAccounts() {
  console.log('\n=== Example 5: Multiple Accounts ===\n');
  
  const wallet = new WalletFoundation();
  await wallet.initialize();
  
  // Derive multiple accounts from the same seed
  for (let i = 0; i < 3; i++) {
    await wallet.deriveAccounts(i);
    console.log(`\nAccount ${i}:`);
    console.log('  ETH:', wallet.accounts.ethereum.address);
    console.log('  BTC:', wallet.accounts.bitcoin.address);
  }
  
  wallet.dispose();
}

// Example 6: Using the wallet in an async context
async function example6_AsyncContext() {
  console.log('\n=== Example 6: Using in Async Context ===\n');
  
  const wallet = new WalletFoundation();
  
  try {
    await wallet.initialize();
    await wallet.deriveAccounts(0);
    
    // Get summary
    const summary = wallet.getSummary();
    console.log('Wallet Summary:', JSON.stringify(summary, null, 2));
    
    // Save to file
    await wallet.saveWalletData('my-wallet.json');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    wallet.dispose();
  }
}

// Example 7: Direct access to account objects
async function example7_DirectAccountAccess() {
  console.log('\n=== Example 7: Direct Account Access ===\n');
  
  const wallet = new WalletFoundation();
  await wallet.initialize();
  await wallet.deriveAccounts(0);
  
  // Access the underlying WDK account objects directly
  const ethAccount = wallet.accounts.ethereum.account;
  const btcAccount = wallet.accounts.bitcoin.account;
  
  // These are full WDK account objects with all methods
  console.log('Ethereum account methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(ethAccount)));
  
  // You can call any WDK account method:
  const ethAddress = await ethAccount.getAddress();
  console.log('ETH Address via account object:', ethAddress);
  
  wallet.dispose();
}

// Example 8: Error handling
async function example8_ErrorHandling() {
  console.log('\n=== Example 8: Error Handling ===\n');
  
  const wallet = new WalletFoundation();
  
  // Handle initialization errors
  try {
    await wallet.initialize('invalid seed with only three words');
  } catch (error) {
    console.log('Caught initialization error:', error.message);
  }
  
  // Handle network errors gracefully
  try {
    await wallet.initialize(); // Generate valid seed
    await wallet.deriveAccounts(0);
    await wallet.fetchBalances(); // May fail if network is down
  } catch (error) {
    console.log('Caught network error:', error.message);
  }
  
  wallet.dispose();
}

// Run all examples (uncomment the ones you want to run)
async function runExamples() {
  try {
    await example1_CreateNewWallet();
    // await example2_RestoreWallet();
    // await example3_CheckBalances();
    // await example4_PrepareTransaction();
    // await example5_MultipleAccounts();
    // await example6_AsyncContext();
    // await example7_DirectAccountAccess();
    // await example8_ErrorHandling();
    
    console.log('\n✅ Examples completed!\n');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run the examples
// runExamples();

// Or export for use in your own code
export {
  example1_CreateNewWallet,
  example2_RestoreWallet,
  example3_CheckBalances,
  example4_PrepareTransaction,
  example5_MultipleAccounts,
  example6_AsyncContext,
  example7_DirectAccountAccess,
  example8_ErrorHandling
};

