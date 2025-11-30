# Quick Start Guide

Welcome to WDK Wallet Foundation! This guide will get you up and running in 5 minutes.

## Prerequisites

- Node.js 16+ installed
- Basic JavaScript knowledge
- Terminal/command line access

## Installation

All dependencies are already installed! The project includes:
- ✅ `@tetherto/wdk` - Core wallet manager
- ✅ `@tetherto/wdk-wallet-evm` - Ethereum support
- ✅ `@tetherto/wdk-wallet-btc` - Bitcoin support

## 🚀 3 Ways to Get Started

### Option 1: Full Demo (Recommended)

```bash
npm start
```

This will:
1. Generate a new seed phrase (⚠️ **SAVE IT!**)
2. Create Ethereum and Bitcoin wallets
3. Show your addresses
4. Demonstrate transaction preparation
5. Save wallet data to `wallet-data.json`

**Expected Output:**
```
🔐 Generated new seed phrase (SAVE THIS SECURELY):
[your 12 words here]

✅ Ethereum (Sepolia) Account:
   Address: 0x...

✅ Bitcoin (Testnet) Account:
   Address: [btc address]

📊 WALLET SUMMARY
{
  "status": "foundation_ready",
  "chains": ["ethereum", "bitcoin"],
  "accounts": { ... }
}
```

### Option 2: Initialize Wallet Only

**Create New Wallet:**
```bash
npm run init
```

**Restore Existing Wallet:**
```bash
npm run init -- your twelve word seed phrase goes here like this example
```

### Option 3: Run Tests

```bash
npm test
```

Tests include:
- ✅ Seed phrase generation
- ✅ Wallet initialization
- ✅ Account derivation
- ✅ Address validation
- ✅ Balance checking
- ✅ Transaction preparation

## 🎯 Your First Transaction

After running the wallet, you'll have testnet addresses. Here's how to test:

### Step 1: Get Testnet Funds

**Ethereum (Sepolia):**
- Visit: https://sepoliafaucet.com/
- Paste your Ethereum address
- Request testnet ETH

**Bitcoin (Testnet):**
- Visit: https://bitcoinfaucet.uo1.net/
- Paste your Bitcoin address
- Request testnet BTC

### Step 2: Check Your Balance

```bash
npm start
```

The wallet will show your updated balance!

### Step 3: Send a Transaction

See `examples.js` for code examples, or check the README for the full API.

## 📁 What Got Created?

```
walletProject2/
├── WalletFoundation.js    # Core wallet implementation
├── index.js               # Main demo (npm start)
├── init-wallet.js         # Wallet init (npm run init)
├── test-wallet.js         # Tests (npm test)
├── examples.js            # Usage examples
├── wallet-data.json       # Your addresses & balances
├── README.md              # Full documentation
├── CONFIG.md              # Network configuration
├── STRUCTURE.md           # Project architecture
└── QUICKSTART.md          # This file!
```

## 🔐 Important Security Notes

1. **Seed Phrase**:
   - ⚠️ Write it down on paper
   - ⚠️ NEVER share it
   - ⚠️ Store it securely
   - ⚠️ Without it, you lose access to your funds

2. **Testnet vs Mainnet**:
   - ✅ This wallet uses TESTNET by default
   - ✅ Testnet funds have no real value
   - ⚠️ Don't use mainnet until thoroughly tested

3. **File Security**:
   - `wallet-data.json` - Safe to backup (no private keys)
   - `seed.txt` - NEVER create this file
   - `.env` - Add to .gitignore if you create it

## 🎨 Using Programmatically

```javascript
import WalletFoundation from './WalletFoundation.js';

const wallet = new WalletFoundation();

// Initialize
await wallet.initialize(); // or pass existing seed

// Derive accounts
await wallet.deriveAccounts(0);

// Get addresses
const ethAddress = wallet.accounts.ethereum.address;
const btcAddress = wallet.accounts.bitcoin.address;

// Check balances
await wallet.fetchBalances();

// Get summary
const summary = wallet.getSummary();
console.log(summary);

// Cleanup
wallet.dispose();
```

See `examples.js` for more detailed examples!

## 🐛 Troubleshooting

**"Module not found" error:**
```bash
npm install
```

**"Cannot find module" for WDK packages:**
```bash
npm install @tetherto/wdk @tetherto/wdk-wallet-evm @tetherto/wdk-wallet-btc
```

**"Invalid seed phrase" error:**
- Ensure exactly 12 words
- Check for typos
- Words should be separated by spaces

**Balance shows "Unable to fetch":**
- Check internet connection
- RPC endpoint may be down (try again later)
- This is normal if you just created the wallet

## 📚 Next Steps

1. **Read the full docs**: Check `README.md` for complete API reference
2. **Review examples**: Open `examples.js` to see usage patterns
3. **Add more chains**: See `README.md` for adding Solana, TON, etc.
4. **Build a UI**: The foundation is ready for React/Vue/etc.
5. **Add AI features**: Integrate with LLMs for smart wallet features

## 🎯 Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm start` | Full demo with all features |
| `npm run init` | Create new wallet |
| `npm run init -- [seed]` | Restore from seed |
| `npm test` | Run test suite |

## 💡 Pro Tips

1. **Multiple Accounts**: 
   - The wallet supports HD derivation
   - Derive account 0, 1, 2, etc. from the same seed
   - See Example 5 in `examples.js`

2. **Network Configuration**:
   - Edit `WalletFoundation.js` to change networks
   - See `CONFIG.md` for all options
   - Mainnet RPC endpoints listed

3. **Adding Protocols**:
   - Install protocol packages: `npm install @tetherto/wdk-protocol-*`
   - Register them with `wdk.registerProtocol()`
   - See README for examples

## 🆘 Need Help?

- **Full Documentation**: `README.md`
- **Configuration Guide**: `CONFIG.md`
- **Architecture Details**: `STRUCTURE.md`
- **Code Examples**: `examples.js`
- **WDK Docs**: https://docs.wallet.tether.io
- **WDK GitHub**: https://github.com/tetherto/wdk-core

## ✅ You're Ready!

Your wallet foundation is set up and ready to use. Start with:

```bash
npm start
```

Then explore the code, add features, and build something amazing! 🚀

---

**Remember**: This is a FOUNDATION. You can now add:
- Web UI (React, Vue, Svelte)
- Mobile app (React Native)
- AI assistant features
- More blockchains
- DeFi protocols (swap, bridge, lending)
- Automated trading strategies

The possibilities are endless! Happy building! 🎉

