import express from 'express';
import cors from 'cors';
import session from 'express-session';
import WalletFoundation from './WalletFoundation.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());

app.use(session({
  secret: 'wallet-session-secret-change-in-production',
  resave: true, // Changed to true to ensure session is saved
  saveUninitialized: true, // Changed to true to save new sessions
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // Allow cross-site requests
  },
  name: 'wallet.sid' // Explicit session name
}));

// Request logging middleware (AFTER session middleware so req.sessionID is available)
app.use((req, res, next) => {
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Session ID: ${req.sessionID || 'none'}`);
  console.log(`   Headers:`, {
    'cookie': req.headers.cookie ? 'present' : 'missing',
    'origin': req.headers.origin,
    'referer': req.headers.referer
  });
  next();
});

// In-memory wallet storage per session
const wallets = new Map();

// Helper to get or create wallet for session
const getWallet = (sessionId) => {
  if (!wallets.has(sessionId)) {
    wallets.set(sessionId, new WalletFoundation());
  }
  return wallets.get(sessionId);
};

// POST /api/wallet/initialize - Create or restore wallet with seed
app.post('/api/wallet/initialize', async (req, res) => {
  try {
    const { seedPhrase } = req.body;
    const wallet = getWallet(req.sessionID);

    console.log('🔐 Initializing wallet for session:', req.sessionID);

    // Initialize wallet
    await wallet.initialize(seedPhrase);

    // Derive first account for Ethereum and Bitcoin
    await wallet.deriveAccounts(0);

    // Ensure accounts are ready
    if (!wallet.accounts.ethereum || !wallet.accounts.bitcoin) {
      throw new Error('Failed to derive accounts');
    }

    // Return success with seed phrase if generated (for first-time users)
    const response = {
      success: true,
      message: 'Wallet initialized successfully',
      seedPhrase: seedPhrase ? null : wallet.seedPhrase, // Only return if newly generated
      accounts: {
        ethereum: {
          address: wallet.accounts.ethereum.address
        },
        bitcoin: {
          address: wallet.accounts.bitcoin.address
        }
      }
    };

    // Ensure session cookie is set
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
      }
    });

    res.json(response);
  } catch (error) {
    console.error('❌ Initialize error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/wallet/account/:chain/:index - Get account address
app.get('/api/wallet/account/:chain/:index', async (req, res) => {
  try {
    const { chain, index } = req.params;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized. Call /api/wallet/initialize first.'
      });
    }

    // Derive account at specified index
    await wallet.deriveAccounts(parseInt(index));

    const account = wallet.accounts[chain];
    if (!account) {
      return res.status(404).json({
        success: false,
        error: `Chain ${chain} not supported`
      });
    }

    res.json({
      success: true,
      chain,
      index: parseInt(index),
      address: account.address
    });
  } catch (error) {
    console.error('❌ Get account error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/wallet/balance/:chain - Get balance
app.get('/api/wallet/balance/:chain', async (req, res) => {
  try {
    const { chain } = req.params;
    console.log(`💰 [Balance API] Request for chain: ${chain}, Session ID: ${req.sessionID}`);
    
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      console.log(`⚠️  [Balance API] Wallet not initialized for session: ${req.sessionID}`);
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized. Call /api/wallet/initialize first.'
      });
    }

    // Ensure accounts are derived if not already
    if (!wallet.accounts[chain]) {
      console.log(`🔄 [Balance API] Deriving accounts for chain: ${chain}`);
      await wallet.deriveAccounts(0);
    }

    const account = wallet.accounts[chain];
    if (!account) {
      console.log(`❌ [Balance API] Chain not supported: ${chain}`);
      return res.status(404).json({
        success: false,
        error: `Chain ${chain} not supported`
      });
    }

    console.log(`🔄 [Balance API] Fetching balance for address: ${account.address}`);
    console.log(`🔄 [Balance API] Account object before fetch:`, {
      address: account.address,
      balance: account.balance,
      hasAccount: !!account.account
    });
    
    // Fetch balance
    await wallet.fetchBalances();
    
    console.log(`🔄 [Balance API] Account object after fetch:`, {
      address: account.address,
      balance: account.balance,
      balanceType: typeof account.balance
    });

    const balance = String(account.balance || '0');
    console.log(`✅ [Balance API] Balance fetched: ${balance} ETH for address: ${account.address}`);

    res.json({
      success: true,
      chain,
      address: account.address,
      balance: balance
    });
  } catch (error) {
    console.error('❌ [Balance API] Get balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/wallet/transaction/prepare - Prepare transaction
app.post('/api/wallet/transaction/prepare', async (req, res) => {
  try {
    const { chain, toAddress, amount } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    let transaction;
    if (chain === 'ethereum') {
      transaction = await wallet.prepareEthereumTransaction(toAddress, amount);
    } else if (chain === 'bitcoin') {
      transaction = await wallet.prepareBitcoinTransaction(toAddress, amount);
    } else {
      return res.status(400).json({
        success: false,
        error: `Chain ${chain} not supported`
      });
    }

    res.json({
      success: true,
      chain,
      transaction
    });
  } catch (error) {
    console.error('❌ Prepare transaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/wallet/transaction/send - Send transaction
app.post('/api/wallet/transaction/send', async (req, res) => {
  try {
    console.log('📤 [Send Transaction API] ========== REQUEST RECEIVED ==========');
    console.log('📤 [Send Transaction API] Body:', JSON.stringify(req.body, null, 2));
    console.log('📤 [Send Transaction API] Session ID:', req.sessionID);
    
    const { chain, transaction, toAddress, amount } = req.body;
    
    console.log('📤 [Send Transaction API] Parsed params:', {
      chain,
      hasTransaction: !!transaction,
      toAddress,
      amount
    });
    const wallet = getWallet(req.sessionID);

    console.log('📤 [Send Transaction API] Chain:', chain);
    console.log('📤 [Send Transaction API] ToAddress:', toAddress);
    console.log('📤 [Send Transaction API] Amount:', amount);
    console.log('📤 [Send Transaction API] Wallet WDK initialized:', !!wallet.wdk);

    if (!wallet.wdk) {
      console.error('❌ [Send Transaction API] Wallet not initialized');
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    const account = wallet.accounts[chain];
    if (!account) {
      console.error(`❌ [Send Transaction API] Chain ${chain} not supported`);
      return res.status(404).json({
        success: false,
        error: `Chain ${chain} not supported`
      });
    }

    // For Ethereum, use direct RPC method to avoid provider connection issues
    if (chain === 'ethereum') {
      console.log('📤 [Send Transaction API] Ethereum chain detected');
      console.log('📤 [Send Transaction API] toAddress:', toAddress, 'type:', typeof toAddress);
      console.log('📤 [Send Transaction API] amount:', amount, 'type:', typeof amount);
      console.log('📤 [Send Transaction API] toAddress && amount check:', !!(toAddress && amount));
      
      // If toAddress and amount are provided, use the new direct RPC method
      if (toAddress && amount) {
        console.log('📤 [Send Transaction API] Using direct RPC method (toAddress + amount)');
        try {
          console.log(`📤 [Send Transaction API] Sending ETH transaction: ${amount} to ${toAddress}`);
          console.log(`📤 [Send Transaction API] Wallet seed phrase available: ${!!wallet.seedPhrase}`);
          console.log(`📤 [Send Transaction API] Wallet seed phrase length: ${wallet.seedPhrase ? wallet.seedPhrase.split(' ').length : 0} words`);
          console.log(`📤 [Send Transaction API] Wallet accounts:`, Object.keys(wallet.accounts));
          console.log(`📤 [Send Transaction API] Ethereum account address: ${wallet.accounts.ethereum?.address}`);
          
          if (!wallet.seedPhrase) {
            throw new Error('Seed phrase not available in wallet instance. Wallet may need to be re-initialized.');
          }
          
          const result = await wallet.sendEthereumTransaction(toAddress, amount);
          console.log(`✅ [Send Transaction API] Transaction sent successfully: ${result.hash}`);
          return res.json({
            success: true,
            chain,
            hash: result.hash,
            fee: result.fee || '0'
          });
        } catch (sendError) {
          console.error('❌ [Send Transaction API] sendEthereumTransaction error:', sendError);
          console.error('❌ [Send Transaction API] Error message:', sendError.message);
          console.error('❌ [Send Transaction API] Error stack:', sendError.stack);
          console.error('❌ [Send Transaction API] Error details:', {
            toAddress,
            amount,
            hasSeedPhrase: !!wallet.seedPhrase,
            hasAccount: !!wallet.accounts.ethereum,
            accountAddress: wallet.accounts.ethereum?.address
          });
          return res.status(500).json({
            success: false,
            error: sendError.message || 'Failed to send transaction'
          });
        }
      }
      // Otherwise, try using the transaction object (legacy support)
      // This will likely fail due to provider connection, but we try anyway
      try {
        const result = await account.account.sendTransaction(transaction);
        return res.json({
          success: true,
          chain,
          hash: result.hash,
          fee: String(result.fee || '0')
        });
      } catch (providerError) {
        // If provider error, suggest using toAddress/amount format
        return res.status(400).json({
          success: false,
          error: 'Provider connection required. Please use toAddress and amount parameters instead of transaction object.'
        });
      }
    }

    // For other chains (Bitcoin, etc.), use the account's sendTransaction method
    const result = await account.account.sendTransaction(transaction);

    res.json({
      success: true,
      chain,
      hash: result.hash,
      fee: String(result.fee || '0')
    });
  } catch (error) {
    console.error('❌ Send transaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/wallet/transactions/:chain/:address - Get transaction history
app.get('/api/wallet/transactions/:chain/:address', async (req, res) => {
  try {
    console.log('📜 [Transaction History API] Request received');
    console.log('📜 [Transaction History API] Chain:', req.params.chain);
    console.log('📜 [Transaction History API] Address:', req.params.address);
    console.log('📜 [Transaction History API] Session ID:', req.sessionID);
    
    const { chain, address } = req.params;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      console.error('❌ [Transaction History API] Wallet not initialized');
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    const account = wallet.accounts[chain];
    if (!account) {
      console.error(`❌ [Transaction History API] Chain ${chain} not supported`);
      return res.status(404).json({
        success: false,
        error: `Chain ${chain} not supported`
      });
    }

    console.log('📜 [Transaction History API] Fetching transaction history for address:', address);
    // Get transaction history from blockchain using Etherscan API
    const transactions = await wallet.getTransactionHistory(address, 50);
    console.log(`📜 [Transaction History API] Found ${transactions.length} transactions`);
    
    res.json({
      success: true,
      chain,
      address,
      transactions
    });
  } catch (error) {
    console.error('❌ [Transaction History API] Get transactions error:', error);
    console.error('❌ [Transaction History API] Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/swap/quote - Get swap quote from Velora
app.post('/api/swap/quote', async (req, res) => {
  try {
    const { fromToken, toToken, amount, slippage = 0.5 } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount'
      });
    }

    const quote = await wallet.getSwapQuote(fromToken, toToken, amount, slippage);

    res.json({
      success: true,
      quote,
      fromToken,
      toToken,
      amount,
      slippage
    });
  } catch (error) {
    console.error('❌ Swap quote error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/swap/execute - Execute swap using Velora
app.post('/api/swap/execute', async (req, res) => {
  try {
    const { fromToken, toToken, amount, slippage = 0.5 } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!fromToken || !toToken || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: fromToken, toToken, amount'
      });
    }

    const result = await wallet.executeSwap(fromToken, toToken, amount, slippage);

    res.json({
      success: true,
      hash: result.hash,
      fee: result.fee || '0',
      transaction: result,
      fromToken,
      toToken,
      amount
    });
  } catch (error) {
    console.error('❌ Swap execute error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/tokens/transfer - Transfer ERC-20 token
app.post('/api/tokens/transfer', async (req, res) => {
  try {
    const { tokenAddress, toAddress, amount, decimals = 18 } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!tokenAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: tokenAddress, toAddress, amount'
      });
    }

    const result = await wallet.transferToken(tokenAddress, toAddress, amount, decimals);

    res.json({
      success: true,
      hash: result.hash,
      fee: result.fee || '0',
      tokenAddress,
      toAddress,
      amount,
      decimals
    });
  } catch (error) {
    console.error('❌ Token transfer error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/tokens/balance - Get ERC-20 token balance
app.get('/api/tokens/balance', async (req, res) => {
  try {
    const { tokenAddress, holderAddress, decimals } = req.query;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!tokenAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: tokenAddress'
      });
    }

    const holderAddr = holderAddress || wallet.accounts.ethereum?.address;
    
    if (!holderAddr) {
      return res.status(400).json({
        success: false,
        error: 'No holder address provided and wallet address not available'
      });
    }

    // Get token balance using RPC call
    const tokenDecimals = decimals ? parseInt(decimals, 10) : 18;
    const balance = await wallet.getTokenBalance(tokenAddress, holderAddr, tokenDecimals);
    
    res.json({
      success: true,
      tokenAddress,
      holderAddress: holderAddr,
      balance: balance
    });
  } catch (error) {
    console.error('❌ Get token balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/tokens/list - Get list of supported tokens
app.get('/api/tokens/list', async (req, res) => {
  try {
    const { chain = 'ethereum' } = req.query;
    
    // Common ERC-20 tokens on Sepolia testnet
    const tokens = [
      {
        address: 'native',
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        chain: 'ethereum'
      },
      // Add more tokens as needed
      // Example USDT on Sepolia: {
      //   address: '0x...',
      //   symbol: 'USDT',
      //   name: 'Tether USD',
      //   decimals: 6,
      //   chain: 'ethereum'
      // }
    ];

    res.json({
      success: true,
      chain,
      tokens
    });
  } catch (error) {
    console.error('❌ Get token list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/4337/sign - Sign transaction for ERC-4337
app.post('/api/4337/sign', async (req, res) => {
  try {
    const { transaction } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!transaction || !transaction.to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: transaction {to, value, data}'
      });
    }

    const result = await wallet.signTransactionFor4337(transaction);

    res.json({
      success: true,
      signedTransaction: result.signedTransaction,
      userOp: result.userOp,
      message: result.message
    });
  } catch (error) {
    console.error('❌ ERC-4337 sign error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/4337/prepare - Prepare ERC-4337 UserOperation
app.post('/api/4337/prepare', async (req, res) => {
  try {
    const { to, value, data } = req.body;
    const wallet = getWallet(req.sessionID);

    if (!wallet.wdk) {
      return res.status(400).json({
        success: false,
        error: 'Wallet not initialized'
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: to'
      });
    }

    const transaction = {
      to,
      value: value || '0',
      data: data || '0x'
    };

    const result = await wallet.signTransactionFor4337(transaction);

    res.json({
      success: true,
      userOp: result.userOp,
      signedTransaction: result.signedTransaction
    });
  } catch (error) {
    console.error('❌ ERC-4337 prepare error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'WDK Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                  ║');
  console.log('║         🚀 WDK Backend API Server Running                        ║');
  console.log('║                                                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 Server listening on http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /api/wallet/initialize');
  console.log('  GET    /api/wallet/account/:chain/:index');
  console.log('  GET    /api/wallet/balance/:chain');
  console.log('  POST   /api/wallet/transaction/prepare');
  console.log('  POST   /api/wallet/transaction/send');
  console.log('  GET    /api/wallet/transactions/:chain/:address');
  console.log('  POST   /api/swap/quote');
  console.log('  POST   /api/swap/execute');
  console.log('  POST   /api/tokens/transfer');
  console.log('  GET    /api/tokens/balance');
  console.log('  GET    /api/tokens/list');
  console.log('  POST   /api/4337/sign');
  console.log('  POST   /api/4337/prepare');
  console.log('  GET    /api/health');
  console.log('');
  console.log('💡 Frontend should connect to this API');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  
  // Dispose all wallets
  for (const [sessionId, wallet] of wallets.entries()) {
    console.log(`Disposing wallet for session: ${sessionId}`);
    wallet.dispose();
  }
  
  process.exit(0);
});

