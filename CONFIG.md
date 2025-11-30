# WDK Wallet Configuration

## Environment Variables (Optional)

Create a `.env` file in the root directory for custom configuration:

```env
# Ethereum Configuration
ETH_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETH_CHAIN_ID=11155111

# Bitcoin Configuration
BTC_NETWORK=testnet
BTC_RPC_URL=https://blockstream.info/testnet/api

# Wallet Configuration
DEFAULT_ACCOUNT_INDEX=0
```

## Network Endpoints

### Ethereum Testnets

**Sepolia** (Recommended):
- RPC: https://ethereum-sepolia-rpc.publicnode.com
- Chain ID: 11155111
- Explorer: https://sepolia.etherscan.io/
- Faucet: https://sepoliafaucet.com/

**Goerli** (Deprecated but still available):
- RPC: https://ethereum-goerli-rpc.publicnode.com
- Chain ID: 5
- Explorer: https://goerli.etherscan.io/

### Ethereum Mainnet

**Mainnet**:
- RPC: https://ethereum-rpc.publicnode.com (or use Infura/Alchemy)
- Chain ID: 1
- Explorer: https://etherscan.io/

### Bitcoin Networks

**Testnet**:
- Network: testnet
- API: https://blockstream.info/testnet/api
- Explorer: https://blockstream.info/testnet/
- Faucet: https://bitcoinfaucet.uo1.net/

**Mainnet**:
- Network: mainnet
- API: https://blockstream.info/api
- Explorer: https://blockstream.info/

## Derivation Paths

### Ethereum (BIP44)

- Standard: `m/44'/60'/0'/0`
- Ledger Legacy: `m/44'/60'/0'`
- Ledger Live: `m/44'/60'/0'/0/0`

### Bitcoin

- Legacy (P2PKH): `m/44'/0'/0'/0` (addresses start with 1)
- SegWit (P2SH): `m/49'/0'/0'/0` (addresses start with 3)
- Native SegWit (Bech32): `m/84'/0'/0'/0` (addresses start with bc1)

For testnet, replace `0'` with `1'`:
- Testnet Native SegWit: `m/84'/1'/0'/0`

## Adding Custom RPC Providers

### Infura (Ethereum)

```javascript
rpcUrl: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID'
```

### Alchemy (Ethereum)

```javascript
rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY'
```

### QuickNode (Multi-chain)

```javascript
rpcUrl: 'https://YOUR_ENDPOINT.quiknode.pro/YOUR_TOKEN/'
```

## Security Considerations

1. **Production RPC Endpoints**:
   - Use authenticated endpoints for production
   - Rate limits may apply to free public endpoints
   - Consider running your own node for maximum security

2. **API Keys**:
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys regularly

3. **Seed Phrase Storage**:
   - Never store in code
   - Never store in environment variables (for production)
   - Use secure key management systems
   - Consider hardware wallets for large amounts

