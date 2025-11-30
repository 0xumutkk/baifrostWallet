# WDK Wallet Foundation

A minimal, production-ready self-custodial crypto wallet built with [Tether WDK](https://github.com/tetherto/wdk-core). This foundation provides core wallet functionality for Ethereum and Bitcoin, ready to be extended with UI, AI agents, or additional blockchain support.

## 🎯 Project Goals

This is the **foundation layer** for building a fully-featured crypto wallet with:
- ✅ Self-custodial seed phrase management
- ✅ Multi-chain support (Ethereum + Bitcoin, easily extensible)
- ✅ Account derivation (HD wallets)
- ✅ Balance checking
- ✅ Transaction preparation and sending
- 🔜 UI integration (next phase)
- 🔜 AI assistant features (next phase)
- 🔜 Automated operations (next phase)

## 📋 Features

### Current Features

- **Seed Phrase Management**: Generate or restore wallets from 12-word mnemonic phrases
- **Multi-Chain Support**: 
  - Ethereum (Sepolia testnet)
  - Bitcoin (Testnet)
- **HD Wallet Derivation**: Derive multiple accounts from a single seed
- **Balance Checking**: Fetch real-time balances for all accounts
- **Transaction Support**: Prepare and send transactions (with safety checks)
- **Data Persistence**: Save wallet metadata (addresses, balances)
- **Comprehensive Testing**: Full test suite included

### Architecture

```
wdk-wallet-foundation/
├── WalletFoundation.js    # Core wallet class
├── index.js               # Main demo/entry point
├── init-wallet.js         # Wallet initialization script
├── test-wallet.js         # Test suite
├── package.json           # Dependencies and scripts
└── README.md              # This file
```

## 🚀 Quick Start

### Installation

1. **Clone or initialize the project**:
```bash
cd walletProject2
```

2. **Install dependencies** (already done):
```bash
npm install
```

The following packages are installed:
- `@tetherto/wdk` - Core WDK module manager
- `@tetherto/wdk-wallet-evm` - Ethereum/EVM wallet support
- `@tetherto/wdk-wallet-btc` - Bitcoin wallet support

### Usage

#### Option 1: Run Full Demo

```bash
npm start
```

This will:
1. Generate a new seed phrase (⚠️ **SAVE IT SECURELY!**)
2. Initialize wallets for Ethereum and Bitcoin
3. Derive accounts at index 0
4. Fetch balances
5. Show transaction examples
6. Save wallet data to `wallet-data.json`
7. Display summary JSON

#### Option 2: Initialize Wallet Only

```bash
npm run init
```

**To restore from existing seed:**
```bash
npm run init -- your twelve word seed phrase goes here like this example
```

#### Option 3: Run Test Suite

```bash
npm test
```

This runs comprehensive tests including:
- Seed phrase generation and validation
- Wallet initialization
- Account derivation
- Address format validation
- Balance fetching
- Transaction preparation
- Multiple account support

## 📖 API Reference

### WalletFoundation Class

#### Constructor

```javascript
import WalletFoundation from './WalletFoundation.js';

const wallet = new WalletFoundation();
```

#### Methods

##### `initialize(seedPhrase?)`

Initialize the wallet with a seed phrase.

```javascript
// Generate new seed
await wallet.initialize();

// Or restore from existing
await wallet.initialize('your twelve word seed phrase here');
```

##### `deriveAccounts(accountIndex)`

Derive accounts for all registered blockchains at the specified index.

```javascript
// Derive first account (index 0)
await wallet.deriveAccounts(0);

// Derive second account (index 1)
await wallet.deriveAccounts(1);
```

##### `fetchBalances()`

Fetch current balances for all accounts.

```javascript
await wallet.fetchBalances();
```

##### `prepareEthereumTransaction(toAddress, amount)`

Prepare an Ethereum transaction (does not broadcast).

```javascript
const tx = await wallet.prepareEthereumTransaction(
  '0xRecipientAddress',
  '0.001' // ETH amount
);

// To broadcast:
// const result = await wallet.accounts.ethereum.account.sendTransaction(tx);
```

##### `prepareBitcoinTransaction(toAddress, amount)`

Prepare a Bitcoin transaction (does not broadcast).

```javascript
const tx = await wallet.prepareBitcoinTransaction(
  'tb1qRecipientAddress',
  '0.0001' // BTC amount
);

// To broadcast:
// const result = await wallet.accounts.bitcoin.account.sendTransaction(tx);
```

##### `getSummary()`

Get wallet summary in JSON format.

```javascript
const summary = wallet.getSummary();
console.log(JSON.stringify(summary, null, 2));
```

Returns:
```json
{
  "status": "foundation_ready",
  "chains": ["ethereum", "bitcoin"],
  "accounts": {
    "ethereum": {
      "address": "0x...",
      "balance": "0"
    },
    "bitcoin": {
      "address": "tb1...",
      "balance": "0"
    }
  }
}
```

##### `dispose()`

Cleanup and dispose of WDK resources.

```javascript
wallet.dispose();
```

## 🔒 Security Best Practices

### Critical Security Notes

1. **Seed Phrase Storage**:
   - ⚠️ **NEVER** commit your seed phrase to git
   - ⚠️ **NEVER** share your seed phrase
   - ⚠️ **NEVER** store it in plain text on your computer
   - ✅ Write it down on paper and store securely
   - ✅ Use a hardware wallet for production funds
   - ✅ Use password managers with encryption

2. **Testnet First**:
   - Always test with testnets before mainnet
   - This foundation uses Sepolia (ETH) and Bitcoin Testnet
   - Get free testnet tokens from faucets

3. **Code Review**:
   - Review all transaction code before broadcasting
   - Verify recipient addresses carefully
   - Check amounts and fees

4. **Network Configuration**:
   - Verify RPC endpoints before use
   - Use trusted node providers for mainnet
   - Consider running your own nodes for production

## 🌐 Network Configuration

### Current Configuration

**Ethereum (Sepolia Testnet)**:
- RPC: `https://ethereum-sepolia-rpc.publicnode.com`
- Chain ID: `11155111`
- Derivation Path: `m/44'/60'/0'/0`

**Bitcoin (Testnet)**:
- Network: `testnet`
- API: `https://blockstream.info/testnet/api`
- Derivation Path: `m/84'/1'/0'/0` (BIP84 native segwit)

### Switching to Mainnet

⚠️ **Only do this after thorough testing!**

**For Ethereum Mainnet**, modify `WalletFoundation.js`:

```javascript
this.wdk.registerWallet('ethereum', WalletManagerEvm, {
  rpcUrl: 'https://ethereum-rpc.publicnode.com', // or your node
  chainId: 1,
  derivationPath: "m/44'/60'/0'/0"
});
```

**For Bitcoin Mainnet**, modify `WalletFoundation.js`:

```javascript
this.wdk.registerWallet('bitcoin', WalletManagerBtc, {
  network: 'mainnet',
  rpcUrl: 'https://blockstream.info/api', // or your node
  derivationPath: "m/84'/0'/0'/0"
});
```

## 🔧 Testing

### Get Testnet Tokens

**Sepolia ETH Faucets**:
- https://sepoliafaucet.com/
- https://www.alchemy.com/faucets/ethereum-sepolia
- https://faucet.quicknode.com/ethereum/sepolia

**Bitcoin Testnet Faucets**:
- https://bitcoinfaucet.uo1.net/
- https://testnet-faucet.mempool.co/
- https://coinfaucet.eu/en/btc-testnet/

### Running Tests

```bash
# Run full test suite
npm test

# Run main demo
npm start

# Initialize wallet only
npm run init
```

## 📦 Adding More Chains

The foundation is easily extensible. To add more chains:

### Example: Adding TON

1. **Install TON wallet module**:
```bash
npm install @tetherto/wdk-wallet-ton
```

2. **Register in WalletFoundation.js**:
```javascript
import WalletManagerTon from '@tetherto/wdk-wallet-ton';

// In initialize() method:
this.wdk.registerWallet('ton', WalletManagerTon, {
  network: 'testnet',
  endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC'
});

// In deriveAccounts() method:
const tonAccount = await this.wdk.getAccount('ton', accountIndex);
const tonAddress = await tonAccount.getAddress();
this.accounts.ton = {
  account: tonAccount,
  address: tonAddress,
  balance: '0'
};
```

### Example: Adding Solana

1. **Install Solana wallet module**:
```bash
npm install @tetherto/wdk-wallet-solana
```

2. **Register similarly** to TON example above

## 🔌 Adding Protocols (Swap, Bridge, Lending)

The WDK supports protocol modules for DeFi operations:

### Example: Adding Paraswap (Token Swaps)

```bash
npm install @tetherto/wdk-protocol-swap-paraswap-evm
```

```javascript
import ParaswapProtocolEvm from '@tetherto/wdk-protocol-swap-paraswap-evm';

// Register protocol
this.wdk.registerProtocol('ethereum', 'paraswap', ParaswapProtocolEvm, {
  apiKey: 'your-api-key' // if required
});

// Use it
const ethAccount = await this.wdk.getAccount('ethereum', 0);
const paraswap = ethAccount.getSwapProtocol('paraswap');
await paraswap.swap({
  fromToken: '0x...',
  toToken: '0x...',
  amount: '1000000',
  slippage: 0.5
});
```

## 🎯 Next Steps / Roadmap

### Phase 1: Foundation ✅ (Current)
- [x] Multi-chain wallet initialization
- [x] Account derivation
- [x] Balance checking
- [x] Transaction preparation
- [x] Test suite

### Phase 2: Enhanced Functionality (Next)
- [ ] Add Solana support
- [ ] Add TON support
- [ ] Integrate swap protocols (Paraswap, etc.)
- [ ] Integrate bridge protocols (USDT0)
- [ ] Transaction history tracking
- [ ] Gas estimation and optimization

### Phase 3: UI Layer
- [ ] Web interface (React/Vue/Svelte)
- [ ] Mobile app (React Native)
- [ ] QR code scanning
- [ ] Address book
- [ ] Transaction confirmation dialogs

### Phase 4: AI & Automation
- [ ] Natural language transaction commands
- [ ] Automated portfolio rebalancing
- [ ] Price alerts and notifications
- [ ] Smart transaction scheduling
- [ ] Multi-chain transaction batching

### Phase 5: Advanced Features
- [ ] Multi-signature wallets
- [ ] Hardware wallet integration
- [ ] NFT support
- [ ] DeFi protocol integration (lending, staking)
- [ ] Cross-chain swaps

## 🐛 Troubleshooting

### Common Issues

**"Invalid seed phrase" error**:
- Ensure seed phrase is exactly 12 words
- Check for typos or extra spaces
- Use WDK.isValidSeedPhrase() to validate

**"Unable to fetch balance" warning**:
- Check internet connection
- Verify RPC endpoint is accessible
- Try alternative RPC providers

**"Failed to derive accounts" error**:
- Ensure WDK packages are installed correctly
- Check wallet configuration (RPC, chain ID)
- Verify network connectivity

**Import errors (ESM)**:
- Ensure `"type": "module"` in package.json
- Use `.js` extensions in imports
- Use `import` not `require`

## 📚 Resources

- **WDK Documentation**: https://docs.wallet.tether.io
- **WDK Core GitHub**: https://github.com/tetherto/wdk-core
- **Ethereum Documentation**: https://ethereum.org/developers
- **Bitcoin Documentation**: https://bitcoin.org/en/developer-documentation

## 📄 License

MIT

## 🤝 Contributing

This is a foundation project. Contributions welcome! Areas for improvement:
- Additional blockchain support
- Protocol integrations
- Security enhancements
- Documentation improvements
- Test coverage

## ⚠️ Disclaimer

This software is provided "as is" for educational and development purposes. Always:
- Test thoroughly before using with real funds
- Use testnets for development
- Follow security best practices
- Keep your seed phrase secure
- Understand the risks of self-custody

---

**Status**: Foundation Ready ✅

**Supported Chains**: Ethereum (Sepolia), Bitcoin (Testnet)

**Last Updated**: November 2025

