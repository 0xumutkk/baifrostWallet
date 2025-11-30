import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerBtc from '@tetherto/wdk-wallet-btc';
import VeloraProtocolEvm from '@tetherto/wdk-protocol-swap-velora-evm';
import { HDNodeWallet, Mnemonic } from 'ethers';
import fs from 'fs/promises';
import path from 'path';

/**
 * WDK Wallet Foundation
 * Minimal self-custodial crypto wallet using Tether WDK
 */

class WalletFoundation {
  constructor() {
    this.wdk = null;
    this.accounts = {};
    this.seedPhrase = null;
  }

  /**
   * Initialize wallet with seed phrase
   * @param {string} seedPhrase - 12 word mnemonic (optional, will generate if not provided)
   */
  async initialize(seedPhrase = null) {
    try {
      // Generate or use provided seed phrase
      if (!seedPhrase) {
        this.seedPhrase = WDK.getRandomSeedPhrase();
        console.log('🔐 Generated new seed phrase (SAVE THIS SECURELY):');
        console.log(this.seedPhrase);
        console.log('\n⚠️  WARNING: Never share your seed phrase with anyone!\n');
      } else {
        // Validate seed phrase format (12 words)
        const words = seedPhrase.trim().split(/\s+/);
        if (words.length !== 12) {
          throw new Error('Invalid seed phrase: must be exactly 12 words');
        }
        this.seedPhrase = seedPhrase;
        console.log('✅ Using provided seed phrase\n');
      }

      // Initialize WDK with seed
      this.wdk = new WDK(this.seedPhrase);

      // Register Ethereum wallet (using Sepolia testnet)
      this.wdk.registerWallet('ethereum', WalletManagerEvm, {
        rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com', // Sepolia testnet
        chainId: 11155111,
        derivationPath: "m/44'/60'/0'/0" // Standard Ethereum derivation path
      });

      // Register Bitcoin wallet (using testnet)
      this.wdk.registerWallet('bitcoin', WalletManagerBtc, {
        network: 'testnet', // Use testnet for safe testing
        rpcUrl: 'https://blockstream.info/testnet/api', // Blockstream testnet API
        derivationPath: "m/84'/1'/0'/0" // BIP84 (native segwit) for testnet
      });

      // Register Velora Swap protocol for Ethereum
      this.wdk.registerProtocol('ethereum', 'velora', VeloraProtocolEvm, {
        // Velora config - API key may be required for production
        // For now, using default config
      });

      console.log('✅ WDK initialized successfully');
      console.log('📊 Registered blockchains: Ethereum (Sepolia), Bitcoin (Testnet)');
      console.log('🔄 Registered protocols: Velora Swap (Ethereum)\n');

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize wallet:', error.message);
      throw error;
    }
  }

  /**
   * Derive accounts for all registered blockchains
   * @param {number} accountIndex - Account index (default: 0)
   */
  async deriveAccounts(accountIndex = 0) {
    try {
      console.log(`🔑 Deriving accounts at index ${accountIndex}...\n`);

      // Derive Ethereum account
      const ethAccount = await this.wdk.getAccount('ethereum', accountIndex);
      const ethAddress = await ethAccount.getAddress();
      this.accounts.ethereum = {
        account: ethAccount,
        address: ethAddress,
        balance: '0'
      };
      console.log(`✅ Ethereum (Sepolia) Account:`);
      console.log(`   Address: ${ethAddress}\n`);

      // Derive Bitcoin account
      const btcAccount = await this.wdk.getAccount('bitcoin', accountIndex);
      const btcAddress = await btcAccount.getAddress();
      this.accounts.bitcoin = {
        account: btcAccount,
        address: btcAddress,
        balance: '0'
      };
      console.log(`✅ Bitcoin (Testnet) Account:`);
      console.log(`   Address: ${btcAddress}\n`);

      return this.accounts;
    } catch (error) {
      console.error('❌ Failed to derive accounts:', error.message);
      throw error;
    }
  }

  /**
   * Fetch balances for all accounts
   */
  async fetchBalances() {
    try {
      console.log('💰 Fetching balances...\n');

      // Fetch Ethereum balance
      try {
        const accountAddress = this.accounts.ethereum.address;
        console.log(`🔍 [fetchBalances] Fetching balance for address: ${accountAddress}`);
        
        // WDK's getBalance() requires provider connection, which may not work
        // Use direct RPC call instead for reliability
        let ethBalanceWei;
        try {
          const directRpcResponse = await fetch('https://ethereum-sepolia-rpc.publicnode.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getBalance',
              params: [accountAddress, 'latest'],
              id: 1
            })
          });
          const directRpcData = await directRpcResponse.json();
          console.log(`🔍 [fetchBalances] Direct RPC response:`, directRpcData);
          
          if (directRpcData.result) {
            // Convert hex to BigInt
            const directWei = BigInt(directRpcData.result);
            const directEth = Number(directWei) / Number(BigInt('1000000000000000000'));
            console.log(`🔍 [fetchBalances] Direct RPC balance: ${directEth} ETH (${directWei.toString()} wei)`);
            ethBalanceWei = directWei; // Use direct RPC result
          } else {
            throw new Error('RPC returned no result');
          }
        } catch (rpcErr) {
          console.error(`⚠️  [fetchBalances] Direct RPC failed, trying WDK:`, rpcErr);
          // Fallback to WDK if RPC fails
          try {
            ethBalanceWei = await this.accounts.ethereum.account.getBalance();
          } catch (wdkErr) {
            throw new Error(`Both RPC and WDK failed: RPC: ${rpcErr.message}, WDK: ${wdkErr.message}`);
          }
        }
        console.log(`🔍 [fetchBalances] Raw balance from WDK:`, ethBalanceWei, `(type: ${typeof ethBalanceWei})`);
        
        // WDK returns balance in wei, convert to ETH
        // Handle both string and BigInt formats
        const balanceWei = typeof ethBalanceWei === 'bigint' 
          ? ethBalanceWei.toString() 
          : String(ethBalanceWei);
        
        console.log(`🔍 [fetchBalances] Balance in wei (string): ${balanceWei}`);
        
        // Convert wei to ETH (1 ETH = 10^18 wei)
        const weiPerEth = BigInt('1000000000000000000');
        const balanceWeiBigInt = BigInt(balanceWei);
        const wholeEth = balanceWeiBigInt / weiPerEth;
        const remainderWei = balanceWeiBigInt % weiPerEth;
        
        console.log(`🔍 [fetchBalances] Conversion - wholeEth: ${wholeEth}, remainderWei: ${remainderWei}`);
        
        // Format with proper decimal places
        const remainderStr = remainderWei.toString().padStart(18, '0');
        // Remove trailing zeros
        const remainderTrimmed = remainderStr.replace(/0+$/, '');
        const balanceEth = remainderTrimmed 
          ? `${wholeEth.toString()}.${remainderTrimmed}` 
          : wholeEth.toString();
        
        // Ensure we have at least 2 decimal places for display
        const balanceEthFormatted = parseFloat(balanceEth).toFixed(4);
        
        console.log(`🔍 [fetchBalances] Final formatted balance: ${balanceEthFormatted} ETH`);
        
        this.accounts.ethereum.balance = balanceEthFormatted;
        console.log(`✅ Ethereum Balance: ${balanceEthFormatted} ETH (from ${balanceWei} wei)`);
      } catch (error) {
        console.error(`❌ Ethereum Balance: Error fetching balance:`, error);
        console.error(`❌ Error stack:`, error.stack);
        console.log(`⚠️  Ethereum Balance: Unable to fetch (${error.message})`);
        this.accounts.ethereum.balance = '0';
      }

      // Fetch Bitcoin balance
      try {
        const btcBalance = await this.accounts.bitcoin.account.getBalance();
        this.accounts.bitcoin.balance = btcBalance;
        console.log(`✅ Bitcoin Balance: ${btcBalance} BTC`);
      } catch (error) {
        console.log(`⚠️  Bitcoin Balance: Unable to fetch (${error.message})`);
      }

      console.log('');
      return this.accounts;
    } catch (error) {
      console.error('❌ Failed to fetch balances:', error.message);
      throw error;
    }
  }

  /**
   * Prepare and send Ethereum transaction using direct RPC
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount in ETH
   */
  async sendEthereumTransaction(toAddress, amount) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      console.log('\n📝 Sending Ethereum transaction (testnet)...');
      console.log(`   To: ${toAddress}`);
      console.log(`   Amount: ${amount} ETH\n`);

      const account = this.accounts.ethereum.account;
      const fromAddress = this.accounts.ethereum.address;
      const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';

      // Convert ETH to wei
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 1e18)).toString();

      // Get nonce
      const nonceResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getTransactionCount',
          params: [fromAddress, 'latest'],
          id: 1
        })
      });
      const nonceData = await nonceResponse.json();
      if (nonceData.error) {
        throw new Error(`Failed to get nonce: ${nonceData.error.message}`);
      }
      const nonce = nonceData.result;

      // Get gas price
      const gasPriceResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1
        })
      });
      const gasPriceData = await gasPriceResponse.json();
      if (gasPriceData.error) {
        throw new Error(`Failed to get gas price: ${gasPriceData.error.message}`);
      }
      const gasPrice = gasPriceData.result;

      // Estimate gas limit
      const gasLimitResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_estimateGas',
          params: [{
            from: fromAddress,
            to: toAddress,
            value: `0x${BigInt(amountWei).toString(16)}`
          }],
          id: 1
        })
      });
      const gasLimitData = await gasLimitResponse.json();
      const gasLimit = gasLimitData.error ? '0x5208' : gasLimitData.result; // Default 21000 if estimation fails

      // Get chain ID
      const chainId = 11155111; // Sepolia

      // Build transaction object
      const transaction = {
        to: toAddress,
        value: `0x${BigInt(amountWei).toString(16)}`,
        gas: gasLimit,
        gasPrice: gasPrice,
        nonce: nonce,
        chainId: `0x${chainId.toString(16)}`
      };

      console.log('🔍 [sendEthereumTransaction] Transaction object:', transaction);

      // Note: WDK's sendTransaction requires provider connection which is not available
      // We use the same seed phrase that WDK uses to derive the private key
      // This ensures compatibility with WDK's address derivation
      // Use ethers.js for signing (using WDK's seed phrase)
      if (!this.seedPhrase) {
        throw new Error('Seed phrase not available for transaction signing');
      }

      // First, try to get private key directly from WDK account object
      console.log('🔍 [sendEthereumTransaction] Attempting to get private key from WDK account object...');
      console.log('🔍 [sendEthereumTransaction] Account object keys:', Object.keys(account));
      console.log('🔍 [sendEthereumTransaction] Account object prototype:', Object.getOwnPropertyNames(Object.getPrototypeOf(account)));
      
      let ethWallet = null;
      let privateKey = null;
      
      // Try to access private key from account object
      if (account.privateKey) {
        privateKey = account.privateKey;
        console.log('✅ [sendEthereumTransaction] Found privateKey property on account object');
      } else if (account._privateKey) {
        privateKey = account._privateKey;
        console.log('✅ [sendEthereumTransaction] Found _privateKey property on account object');
      } else if (account.wallet && account.wallet.privateKey) {
        privateKey = account.wallet.privateKey;
        console.log('✅ [sendEthereumTransaction] Found privateKey on account.wallet');
      } else if (account.signer && account.signer.privateKey) {
        privateKey = account.signer.privateKey;
        console.log('✅ [sendEthereumTransaction] Found privateKey on account.signer');
      }
      
      // If we found private key, use it directly
      if (privateKey) {
        try {
          // Import private key into ethers.js wallet
          const { Wallet } = await import('ethers');
          ethWallet = new Wallet(privateKey);
          console.log(`✅ [sendEthereumTransaction] Created wallet from private key, address: ${ethWallet.address}`);
          if (ethWallet.address.toLowerCase() !== fromAddress.toLowerCase()) {
            console.warn(`⚠️  [sendEthereumTransaction] Private key address (${ethWallet.address}) does not match account address (${fromAddress})`);
            ethWallet = null; // Reset to try derivation method
          }
        } catch (pkError) {
          console.error('❌ [sendEthereumTransaction] Failed to create wallet from private key:', pkError);
          ethWallet = null; // Reset to try derivation method
        }
      }
      
      // If private key method didn't work, try derivation from seed phrase
      if (!ethWallet) {
        console.log('🔍 [sendEthereumTransaction] Private key method failed, trying derivation from seed phrase...');
        console.log('🔍 [sendEthereumTransaction] Seed phrase length:', this.seedPhrase ? this.seedPhrase.split(' ').length : 0);
        
        if (!this.seedPhrase) {
          throw new Error('Seed phrase not available and private key not accessible from account object');
        }
        
        // Create mnemonic from seed phrase
        let mnemonic;
        try {
          mnemonic = Mnemonic.fromPhrase(this.seedPhrase);
          console.log('✅ [sendEthereumTransaction] Mnemonic created successfully');
        } catch (mnemonicError) {
          console.error('❌ [sendEthereumTransaction] Failed to create mnemonic:', mnemonicError);
          throw new Error(`Failed to create mnemonic from seed phrase: ${mnemonicError.message}`);
        }
        
        // Create HD wallet from mnemonic
        let hdNode;
        try {
          hdNode = HDNodeWallet.fromPhrase(mnemonic.phrase);
          console.log('✅ [sendEthereumTransaction] HDNodeWallet created successfully');
          console.log(`🔍 [sendEthereumTransaction] Base HDNodeWallet address: ${hdNode.address}`);
        } catch (hdError) {
          console.error('❌ [sendEthereumTransaction] Failed to create HDNodeWallet:', hdError);
          throw new Error(`Failed to create HDNodeWallet: ${hdError.message}`);
        }
        
        // Get accountIndex from the stored account (default to 0)
        const accountIndex = 0; // We always use accountIndex 0 in deriveAccounts
        
        // First, try the base HDNodeWallet address (no derivation)
        if (hdNode.address.toLowerCase() === fromAddress.toLowerCase()) {
          ethWallet = hdNode;
          console.log(`✅ [sendEthereumTransaction] Found matching address using base HDNodeWallet (no derivation)`);
        } else {
          // Try different derivation paths, including accountIndex variations
          const pathsToTry = [
            `m/44'/60'/${accountIndex}'/0/0`,  // WDK might use accountIndex in the path: m/44'/60'/0'/0/0
            `m/44'/60'/${accountIndex}'/0`,     // Without change index: m/44'/60'/0'/0
            `m/44'/60'/${accountIndex}'`,       // Without account/change: m/44'/60'/0'
            "m/44'/60'/0'/0/0",  // Standard BIP44 with change index
            "m/44'/60'/0'/0",     // WDK's derivation path (without change index)
            "m/44'/60'/0'",       // Without account index
            "m/44'/60'/0'/0/1",  // With change index 1
            "m/44'/60'/0'/1/0",  // With account index 1
            "m/44'/60'/1'/0/0",  // With coin type index 1
          ];
          
          for (const path of pathsToTry) {
            try {
              const wallet = hdNode.derivePath(path);
              console.log(`🔍 [sendEthereumTransaction] Trying path ${path}, address: ${wallet.address}`);
              if (wallet.address.toLowerCase() === fromAddress.toLowerCase()) {
                ethWallet = wallet;
                console.log(`✅ [sendEthereumTransaction] Found matching address using path: ${path}`);
                break;
              }
            } catch (e) {
              console.log(`⚠️  [sendEthereumTransaction] Path ${path} failed: ${e.message}`);
              // Continue to next path
            }
          }
        }
        
        if (!ethWallet) {
          console.error(`❌ [sendEthereumTransaction] Cannot derive matching address.`);
          console.error(`❌ [sendEthereumTransaction] Target address: ${fromAddress}`);
          console.error(`❌ [sendEthereumTransaction] Base HDNodeWallet address: ${hdNode.address}`);
          console.error(`❌ [sendEthereumTransaction] Account index used: ${accountIndex}`);
          throw new Error(`Cannot derive matching address for ${fromAddress}. Base HDNodeWallet address: ${hdNode.address}. Please check WDK's derivation path implementation.`);
        }
      }
      
      const txRequest = {
        to: toAddress,
        value: BigInt(amountWei),
        gasLimit: BigInt(gasLimit),
        gasPrice: BigInt(gasPrice),
        nonce: parseInt(nonce, 16),
        chainId: chainId
      };
      
      console.log('🔍 [sendEthereumTransaction] Signing transaction with ethers.js...');
      const signedTx = await ethWallet.signTransaction(txRequest);
      
      // Send raw transaction using direct RPC
      console.log('🔍 [sendEthereumTransaction] Broadcasting transaction via RPC...');
      const sendResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_sendRawTransaction',
          params: [signedTx],
          id: 1
        })
      });

      const sendData = await sendResponse.json();
      console.log('🔍 [sendEthereumTransaction] RPC response:', sendData);
      
      if (sendData.error) {
        throw new Error(`Failed to send transaction: ${sendData.error.message}`);
      }

      const txHash = sendData.result;
      console.log(`✅ [sendEthereumTransaction] Transaction sent! Hash: ${txHash}\n`);

      return {
        hash: txHash,
        fee: String(parseInt(gasLimit, 16) * parseInt(gasPrice, 16))
      };
    } catch (error) {
      console.error('❌ Failed to send Ethereum transaction:', error.message);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  }

  /**
   * Example: Prepare Ethereum transaction (DOES NOT BROADCAST)
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount in ETH
   */
  async prepareEthereumTransaction(toAddress, amount) {
    try {
      console.log('\n📝 Preparing Ethereum transaction (testnet)...');
      console.log(`   To: ${toAddress}`);
      console.log(`   Amount: ${amount} ETH\n`);

      const transaction = {
        to: toAddress,
        value: amount,
        // Gas limit and price will be estimated by the wallet
      };

      console.log('✅ Transaction prepared (ready to send)');
      console.log('ℹ️  To broadcast: await account.sendTransaction(transaction)\n');

      return transaction;
    } catch (error) {
      console.error('❌ Failed to prepare Ethereum transaction:', error.message);
      throw error;
    }
  }

  /**
   * Example: Prepare Bitcoin transaction (DOES NOT BROADCAST)
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount in BTC
   */
  async prepareBitcoinTransaction(toAddress, amount) {
    try {
      console.log('\n📝 Preparing Bitcoin transaction (testnet)...');
      console.log(`   To: ${toAddress}`);
      console.log(`   Amount: ${amount} BTC\n`);

      const transaction = {
        to: toAddress,
        amount: amount,
        // Fee rate will be estimated by the wallet
      };

      console.log('✅ Transaction prepared (ready to send)');
      console.log('ℹ️  To broadcast: await account.sendTransaction(transaction)\n');

      return transaction;
    } catch (error) {
      console.error('❌ Failed to prepare Bitcoin transaction:', error.message);
      throw error;
    }
  }

  /**
   * Get swap quote from Velora
   * @param {string} fromToken - Source token address (use 'native' for ETH)
   * @param {string} toToken - Destination token address
   * @param {string} amount - Amount to swap (in wei or token units)
   * @param {number} slippage - Slippage tolerance (default: 0.5%)
   */
  async getSwapQuote(fromToken, toToken, amount, slippage = 0.5) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      const account = this.accounts.ethereum.account;
      const velora = account.getSwapProtocol('velora');

      if (!velora) {
        throw new Error('Velora protocol not available. Ensure protocol is registered.');
      }

      const quote = await velora.quoteSwap({
        tokenIn: fromToken,
        tokenOut: toToken,
        tokenInAmount: amount,
        slippage: slippage
      });

      return quote;
    } catch (error) {
      console.error('❌ Failed to get swap quote:', error.message);
      throw error;
    }
  }

  /**
   * Execute swap using Velora
   * @param {string} fromToken - Source token address (use 'native' for ETH)
   * @param {string} toToken - Destination token address
   * @param {string} amount - Amount to swap (in wei or token units)
   * @param {number} slippage - Slippage tolerance (default: 0.5%)
   */
  async executeSwap(fromToken, toToken, amount, slippage = 0.5) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      const account = this.accounts.ethereum.account;
      const velora = account.getSwapProtocol('velora');

      if (!velora) {
        throw new Error('Velora protocol not available. Ensure protocol is registered.');
      }

      const result = await velora.swap({
        tokenIn: fromToken,
        tokenOut: toToken,
        tokenInAmount: amount,
        slippage: slippage
      });

      return result;
    } catch (error) {
      console.error('❌ Failed to execute swap:', error.message);
      throw error;
    }
  }

  /**
   * Transfer ERC-20 token
   * @param {string} tokenAddress - ERC-20 token contract address
   * @param {string} toAddress - Recipient address
   * @param {string} amount - Amount to transfer (in token units, not wei)
   * @param {number} decimals - Token decimals (default: 18)
   */
  async transferToken(tokenAddress, toAddress, amount, decimals = 18) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      const account = this.accounts.ethereum.account;

      // ERC-20 transfer function signature: transfer(address,uint256)
      const transferFunctionSignature = '0xa9059cbb';
      const toAddressPadded = toAddress.slice(2).padStart(64, '0');
      
      // Convert amount to token's smallest unit (wei equivalent)
      // Handle decimal amounts by converting to string first
      const amountFloat = parseFloat(amount);
      const amountScaled = BigInt(Math.floor(amountFloat * Math.pow(10, decimals)));
      const amountHex = amountScaled.toString(16).padStart(64, '0');

      const data = transferFunctionSignature + toAddressPadded + amountHex;

      const transaction = {
        to: tokenAddress,
        value: '0', // No ETH value for token transfers
        data: '0x' + data
      };

      const result = await account.sendTransaction(transaction);

      return result;
    } catch (error) {
      console.error('❌ Failed to transfer token:', error.message);
      throw error;
    }
  }

  /**
   * Get ERC-20 token balance
   * @param {string} tokenAddress - ERC-20 token contract address
   * @param {string} holderAddress - Address to check balance for (default: wallet address)
   * @param {number} decimals - Token decimals (default: 18)
   */
  async getTokenBalance(tokenAddress, holderAddress = null, decimals = 18) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      const address = holderAddress || this.accounts.ethereum.address;

      // ERC-20 balanceOf function signature: balanceOf(address)
      // Function selector: keccak256("balanceOf(address)") = 0x70a08231
      const balanceOfSignature = '0x70a08231';
      // Pad address to 32 bytes (64 hex chars), remove '0x' prefix first
      const addressPadded = address.slice(2).padStart(64, '0');
      const data = balanceOfSignature + addressPadded;

      console.log(`🔍 [getTokenBalance] Calling balanceOf for token: ${tokenAddress}, holder: ${address}`);
      console.log(`🔍 [getTokenBalance] Call data: ${data}`);

      // Use eth_call RPC method to call the contract
      const rpcUrl = 'https://ethereum-sepolia-rpc.publicnode.com';
      const rpcResponse = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: data
            },
            'latest'
          ],
          id: 1
        })
      });

      const rpcData = await rpcResponse.json();
      console.log(`🔍 [getTokenBalance] RPC response:`, rpcData);

      if (rpcData.error) {
        throw new Error(`RPC error: ${rpcData.error.message || JSON.stringify(rpcData.error)}`);
      }

      if (!rpcData.result || rpcData.result === '0x') {
        console.log(`⚠️  [getTokenBalance] No balance found or contract call failed`);
        return '0';
      }

      // Convert hex result to BigInt
      const balanceWei = BigInt(rpcData.result);
      console.log(`🔍 [getTokenBalance] Raw balance (wei): ${balanceWei.toString()}`);

      // Convert to token units using decimals
      const divisor = BigInt(10 ** decimals);
      const wholeTokens = balanceWei / divisor;
      const remainder = balanceWei % divisor;

      // Format with proper decimal places
      const remainderStr = remainder.toString().padStart(decimals, '0');
      const remainderTrimmed = remainderStr.replace(/0+$/, '');
      const balanceFormatted = remainderTrimmed 
        ? `${wholeTokens.toString()}.${remainderTrimmed}` 
        : wholeTokens.toString();

      // Ensure at least 4 decimal places for display
      const balanceFinal = parseFloat(balanceFormatted).toFixed(4);
      
      console.log(`✅ [getTokenBalance] Token balance: ${balanceFinal} (decimals: ${decimals})`);

      return balanceFinal;
    } catch (error) {
      console.error('❌ Failed to get token balance:', error.message);
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   * @param {string} address - Ethereum address to get transactions for
   * @param {number} limit - Maximum number of transactions to return (default: 50)
   */
  async getTransactionHistory(address, limit = 50) {
    try {
      console.log(`🔍 [getTransactionHistory] Fetching transactions for address: ${address}`);

      // Use Etherscan API for Sepolia testnet
      // Note: For production, you might want to use your own Etherscan API key
      // Free tier allows 5 calls/second
      const apiUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=${limit}&sort=desc`;
      
      // For now, use public API (rate limited)
      // In production, get a free API key from https://etherscan.io/apis
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      console.log(`🔍 [getTransactionHistory] Etherscan API response status: ${data.status}`);
      console.log(`🔍 [getTransactionHistory] Etherscan API message: ${data.message || 'N/A'}`);
      console.log(`🔍 [getTransactionHistory] Etherscan API result type: ${typeof data.result}`);
      console.log(`🔍 [getTransactionHistory] Etherscan API result is array: ${Array.isArray(data.result)}`);
      if (Array.isArray(data.result)) {
        console.log(`🔍 [getTransactionHistory] Etherscan API result length: ${data.result.length}`);
        if (data.result.length > 0) {
          console.log(`🔍 [getTransactionHistory] First transaction sample:`, {
            hash: data.result[0].hash,
            from: data.result[0].from,
            to: data.result[0].to,
            value: data.result[0].value,
            timeStamp: data.result[0].timeStamp
          });
        }
      }

      if (data.status === '0') {
        // Check if it's a "No transactions found" message (this is normal)
        if (data.message === 'No transactions found' || data.message === 'OK') {
          console.log(`ℹ️  [getTransactionHistory] No transactions found for address: ${address}`);
          return [];
        }
        // Otherwise it's an error
        console.error(`❌ [getTransactionHistory] Etherscan API error: ${data.message || 'Unknown error'}`);
        throw new Error(`Etherscan API error: ${data.message || 'Unknown error'}`);
      }

      if (data.status === '1' && data.result && Array.isArray(data.result)) {
        const formatted = this.formatTransactions(data.result);
        console.log(`✅ [getTransactionHistory] Formatted ${formatted.length} transactions`);
        return formatted;
      }

      // No transactions found
      console.log(`ℹ️  [getTransactionHistory] No transactions found for address: ${address}`);
      return [];
    } catch (error) {
      console.error('❌ Failed to get transaction history:', error.message);
      // Return empty array instead of throwing to allow UI to still render
      console.warn('⚠️  [getTransactionHistory] Returning empty array due to error');
      return [];
    }
  }

  /**
   * Format Etherscan API transaction data to our Transaction format
   * @param {Array} transactions - Raw transaction array from Etherscan API
   */
  formatTransactions(transactions) {
    if (!Array.isArray(transactions)) {
      return [];
    }

    return transactions.map((tx) => {
      // Convert wei to ETH
      const valueWei = BigInt(tx.value || '0');
      const weiPerEth = BigInt('1000000000000000000');
      const wholeEth = valueWei / weiPerEth;
      const remainderWei = valueWei % weiPerEth;
      const remainderStr = remainderWei.toString().padStart(18, '0');
      const remainderTrimmed = remainderStr.replace(/0+$/, '');
      const valueEth = remainderTrimmed 
        ? `${wholeEth.toString()}.${remainderTrimmed}` 
        : wholeEth.toString();

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '', // Contract creation transactions may not have 'to'
        value: parseFloat(valueEth).toFixed(4),
        timestamp: parseInt(tx.timeStamp, 10),
        status: tx.txreceipt_status === '1' ? 'confirmed' : tx.txreceipt_status === '0' ? 'failed' : 'pending',
        blockNumber: parseInt(tx.blockNumber, 10),
        gasUsed: tx.gasUsed,
        gasPrice: tx.gasPrice,
        nonce: tx.nonce,
        transactionIndex: tx.transactionIndex
      };
    });
  }

  /**
   * Sign transaction for ERC-4337 (autonomous signing)
   * Creates a UserOperation-like structure for autonomous execution
   * @param {object} transaction - Transaction object {to, value, data}
   */
  async signTransactionFor4337(transaction) {
    try {
      if (!this.accounts.ethereum || !this.accounts.ethereum.account) {
        throw new Error('Ethereum account not derived. Call deriveAccounts() first.');
      }

      const account = this.accounts.ethereum.account;
      const address = this.accounts.ethereum.address;

      // Prepare transaction
      const tx = {
        to: transaction.to,
        value: transaction.value || '0',
        data: transaction.data || '0x',
        // Gas will be estimated
      };

      // Sign the transaction (this creates the signature)
      // Note: WDK account should handle signing internally
      // For ERC-4337, we need to create a UserOperation structure
      const userOp = {
        sender: address,
        nonce: 0, // Should be fetched from contract
        initCode: '0x', // Empty for existing accounts
        callData: this.encodeCallData(transaction.to, transaction.value, transaction.data),
        callGasLimit: '0', // Should be estimated
        verificationGasLimit: '0', // Should be estimated
        preVerificationGas: '0', // Should be estimated
        maxFeePerGas: '0', // Should be fetched
        maxPriorityFeePerGas: '0', // Should be fetched
        paymasterAndData: '0x', // Empty (no paymaster)
        signature: '0x' // Will be filled after signing
      };

      // For now, return the prepared UserOp structure
      // Actual signing would require ERC-4337 wallet implementation
      return {
        userOp,
        signedTransaction: tx,
        message: 'UserOperation prepared. Actual signing requires ERC-4337 wallet implementation.'
      };
    } catch (error) {
      console.error('❌ Failed to sign transaction for ERC-4337:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Encode call data for ERC-4337
   */
  encodeCallData(to, value, data) {
    // Simple encoding - in production, use proper ABI encoding
    return data || '0x';
  }

  /**
   * Save wallet data to file (addresses and metadata, NOT seed phrase)
   */
  async saveWalletData(filename = 'wallet-data.json') {
    try {
      const data = {
        timestamp: new Date().toISOString(),
        chains: Object.keys(this.accounts),
        accounts: {
          ethereum: {
            address: this.accounts.ethereum.address,
            balance: String(this.accounts.ethereum.balance || '0')
          },
          bitcoin: {
            address: this.accounts.bitcoin.address,
            balance: String(this.accounts.bitcoin.balance || '0')
          }
        }
      };

      await fs.writeFile(
        path.join(process.cwd(), filename),
        JSON.stringify(data, null, 2)
      );

      console.log(`💾 Wallet data saved to ${filename}\n`);
      return data;
    } catch (error) {
      console.error('❌ Failed to save wallet data:', error.message);
      throw error;
    }
  }

  /**
   * Generate summary JSON
   */
  getSummary() {
    return {
      status: 'foundation_ready',
      chains: ['ethereum', 'bitcoin'],
      accounts: {
        ethereum: {
          address: this.accounts.ethereum?.address || 'N/A',
          balance: String(this.accounts.ethereum?.balance || '0')
        },
        bitcoin: {
          address: this.accounts.bitcoin?.address || 'N/A',
          balance: String(this.accounts.bitcoin?.balance || '0')
        }
      }
    };
  }

  /**
   * Cleanup and dispose resources
   */
  dispose() {
    if (this.wdk) {
      this.wdk.dispose();
      console.log('✅ WDK disposed\n');
    }
  }
}

export default WalletFoundation;

