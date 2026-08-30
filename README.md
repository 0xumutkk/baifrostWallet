# 🌉 Baifrost - AI-Powered Crypto Wallet

<div align="center">

![Baifrost Logo](https://img.shields.io/badge/Baifrost-Wallet-orange?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Tether WDK](https://img.shields.io/badge/Tether%20WDK-009393?style=for-the-badge&logo=tether&logoColor=white)
![Hackathon](https://img.shields.io/badge/Future%20of%20Wallet%20by%20Tether-2nd%20Place-FFD700?style=for-the-badge)

**A next-generation, self-custodial crypto wallet with AI-powered voice assistant**

🏆 **2nd place at the Future of Wallet hackathon by Tether** — selected as one of 10 finalist teams out of 100+ applications

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Security](#-security) • [Hackathon](#-hackathon)

</div>

---

## ✨ Overview

**Baifrost** is a cutting-edge Progressive Web App (PWA) that combines the power of [Tether's WDK](https://github.com/tetherto/wdk-core) with an intelligent AI voice assistant powered by ElevenLabs. Experience seamless crypto management through natural language commands, secure multi-chain transactions, and an intuitive interface.

### 🎯 What Makes Baifrost Special?

- 🤖 **AI Voice Assistant**: Interact with your wallet using natural language commands
- 🔐 **Bank-Level Security**: IndexedDB + WebCrypto encryption with PIN protection
- 🌐 **Multi-Chain Support**: Ethereum (Sepolia) and Bitcoin (Testnet) ready
- 💱 **Built-in DEX**: Swap tokens directly within the wallet
- 📱 **PWA Ready**: Install as a native app on any device
- 🎨 **Beautiful UI**: Modern design with smooth animations

---

## 🚀 Features

### Core Wallet Features

- ✅ **Self-Custodial**: Your keys, your crypto. Full control over your assets
- ✅ **HD Wallet**: Generate or import 12-word seed phrases
- ✅ **Multi-Chain**: Support for Ethereum and Bitcoin (easily extensible)
- ✅ **Transaction History**: Real-time transaction tracking with block explorer links
- ✅ **Token Balances**: View native and ERC-20 token balances
- ✅ **Contact Management**: Save and resolve addresses by name

### AI Assistant Features

- 🎤 **Voice Commands**: "Send 10 dollars to Ahmet" - it just works!
- 💬 **Natural Language**: Chat with your wallet like a friend
- 🔍 **Smart Resolution**: Automatically resolves contact names to addresses
- ✅ **Transaction Approval**: Review and approve transactions before execution
- 📊 **Balance Queries**: Ask about your portfolio anytime
- 🔄 **Swap Preparation**: Prepare token swaps through conversation

### Security Features

- 🔐 **PIN Protection**: 6-digit PIN with auto-lock after 5 minutes
- 🛡️ **WebCrypto Encryption**: AES-GCM 256-bit encryption for seed phrases
- 🔑 **PBKDF2 Key Derivation**: 100,000 iterations for maximum security
- 💾 **IndexedDB Storage**: Secure client-side database
- 🚫 **No Server Storage**: Your seed phrase never leaves your device

### UI/UX Features

- 🎨 **Baifrost Theme**: Warm orange-teal gradient with modern aesthetics
- ✨ **Smooth Animations**: Framer Motion powered transitions
- 📱 **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- 🌙 **Dark Mode**: Eye-friendly dark theme
- ⚡ **Fast Performance**: React Query for optimized data fetching
- 🔄 **Real-time Updates**: Auto-refresh balances and transaction history

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (PWA)                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  React + Vite + TypeScript Frontend                │    │
│  │  • Dashboard, Send, Swap, Receive Screens         │    │
│  │  • AI Chat Widget (ElevenLabs)                    │    │
│  │  • Contact Management                             │    │
│  │  • IndexedDB + WebCrypto Storage                  │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │ fetch('/api/*')                         │
└───────────────────┼─────────────────────────────────────────┘
                    │
                    ↓ HTTP + Session Cookies
┌───────────────────┴─────────────────────────────────────────┐
│              Node.js Backend API (Express)                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │  REST API Endpoints                                │    │
│  │  • /api/wallet/*                                   │    │
│  │  • /api/transaction/*                              │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
│  ┌────────────────▼───────────────────────────────────┐    │
│  │  WalletFoundation.js (Tether WDK Wrapper)         │    │
│  │  • Multi-chain account derivation                  │    │
│  │  • Transaction preparation & signing                │    │
│  │  • Balance fetching                                │    │
│  └────────────────┬───────────────────────────────────┘    │
│                   │                                          │
└───────────────────┼──────────────────────────────────────────┘
                    │
                    ↓ @tetherto/wdk packages
┌───────────────────┴─────────────────────────────────────────┐
│              Tether WDK (Wallet Development Kit)             │
│  • @tetherto/wdk (core)                                     │
│  • @tetherto/wdk-wallet-evm (Ethereum)                      │
│  • @tetherto/wdk-wallet-btc (Bitcoin)                      │
│  • @tetherto/wdk-protocol-swap-velora-evm (DEX)             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** or **yarn**
- Modern browser with WebCrypto API support

### Setup

1. **Clone the repository**:
```bash
git clone https://github.com/0xumutkk/baifrostWallet.git
cd baifrostWallet
```

2. **Install dependencies**:
```bash
# Install root dependencies (backend)
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

3. **Configure environment** (optional):
Create a `.env` file in the root directory:
```env
# Ethereum Configuration
ETH_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
ETH_CHAIN_ID=11155111

# Bitcoin Configuration
BTC_NETWORK=testnet
BTC_RPC_URL=https://blockstream.info/testnet/api

# ElevenLabs AI Agent (required for AI features)
ELEVENLABS_AGENT_ID=agent_3801kb9v9kkzfg5t4n7fw780qram
```

---

## 🚀 Quick Start

### Development Mode

Start both backend and frontend servers simultaneously:

```bash
npm run dev
```

This will start:
- **Backend API**: http://localhost:3001
- **Frontend PWA**: http://localhost:5173

### Individual Servers

```bash
# Backend only
npm run backend

# Frontend only (in another terminal)
npm run frontend
```

### First Time Setup

1. Open http://localhost:5173 in your browser
2. Click **"Create New Wallet"** or **"Import Existing Wallet"**
3. Set up a 6-digit PIN
4. **Save your seed phrase** (if creating new wallet)
5. Confirm your seed phrase
6. Start using your wallet!

---

## 📖 Usage

### Creating a New Wallet

1. Click **"Create New Wallet"** on the welcome screen
2. Enter and confirm a 6-digit PIN
3. **IMPORTANT**: Save your 12-word seed phrase securely
4. Confirm your seed phrase by entering it
5. You're ready to go!

### Importing an Existing Wallet

1. Click **"Import Existing Wallet"** on the welcome screen
2. Enter your 12-word seed phrase
3. Set up a 6-digit PIN
4. Your wallet will be restored

### Using the AI Assistant

Click the chat icon in the bottom-right corner to open the AI assistant. Try these commands:

- **"What's my balance?"** - Check your ETH balance
- **"Send 0.01 ETH to 0x..."** - Prepare a transaction
- **"Send 10 dollars to Ahmet"** - Send to a saved contact
- **"Show my transaction history"** - View recent transactions
- **"Swap 0.1 ETH for USDT"** - Prepare a token swap

### Sending Transactions

1. Navigate to **Send** from the dashboard
2. Enter recipient address or select from contacts
3. Enter amount
4. Select token (ETH or ERC-20)
5. Review and confirm
6. Approve the transaction

### Swapping Tokens

1. Navigate to **Swap** from the dashboard
2. Select tokens to swap
3. Enter amount
4. Review quote and slippage
5. Confirm swap

### Managing Contacts

1. In the **Send** screen, enter an address
2. Click **"Save as Contact"**
3. Enter a name for the contact
4. Use the contact name in future transactions or AI commands

---

## 🔒 Security

### Encryption

- **Seed Phrase**: Encrypted with AES-GCM 256-bit using WebCrypto API
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Storage**: IndexedDB with encrypted data only
- **PIN**: Never stored, only used for key derivation

### Best Practices

1. **Never share your seed phrase** with anyone
2. **Store your seed phrase** in a secure location (offline)
3. **Use a strong PIN** (6 digits minimum)
4. **Enable auto-lock** (default: 5 minutes)
5. **Verify addresses** before sending transactions
6. **Test with small amounts** first

### What's Stored Where

- ✅ **Encrypted seed phrase** → IndexedDB (local only)
- ✅ **Contacts** → IndexedDB (local only)
- ✅ **Settings** → IndexedDB (local only)
- ❌ **Private keys** → Never stored (derived on-demand)
- ❌ **Seed phrase (plaintext)** → Never stored
- ❌ **PIN** → Never stored

---

## 🛠️ Development

### Project Structure

```
baifrostWallet/
├── backend/
│   ├── server.js              # Express API server
│   ├── WalletFoundation.js    # WDK wrapper class
│   ├── init-wallet.js         # CLI wallet initialization
│   └── test-wallet.js         # Test suite
│
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── SendScreen.tsx
│   │   │   ├── SwapScreen.tsx
│   │   │   ├── AgentChatWidget.tsx
│   │   │   └── ...
│   │   ├── contexts/          # React contexts
│   │   │   ├── WdkContext.tsx
│   │   │   ├── PinContext.tsx
│   │   │   └── AgentContext.tsx
│   │   ├── hooks/             # Custom React hooks
│   │   │   ├── useSendTransaction.ts
│   │   │   ├── useSwap.ts
│   │   │   └── ...
│   │   ├── services/          # API and service layers
│   │   │   ├── api.ts
│   │   │   └── contactService.ts
│   │   └── utils/             # Utilities
│   │       ├── secureStorage.ts
│   │       └── validation.ts
│   ├── vite.config.ts         # Vite configuration
│   └── package.json
│
├── CONFIG.md                  # Network configuration guide
├── package.json               # Root package
└── README.md                  # This file
```

### Available Scripts

```bash
# Development
npm run dev          # Start both servers
npm run backend      # Backend only
npm run frontend     # Frontend only

# Testing
npm test             # Run test suite
npm run init         # Initialize wallet (CLI)

# Production
cd frontend && npm run build    # Build frontend
cd frontend && npm run preview  # Preview production build
```

### Adding New Chains

1. Install the WDK wallet module:
```bash
npm install @tetherto/wdk-wallet-{chain}
```

2. Register in `backend/WalletFoundation.js`:
```javascript
import WalletManagerXxx from '@tetherto/wdk-wallet-xxx';

this.wdk.registerWallet('xxx', WalletManagerXxx, {
  // Configuration
});
```

3. Add account derivation in `deriveAccounts()` method

### Adding New Protocols

1. Install the protocol module:
```bash
npm install @tetherto/wdk-protocol-{type}-{name}
```

2. Register in `WalletFoundation.js`:
```javascript
this.wdk.registerProtocol('ethereum', 'protocol-name', ProtocolClass, {
  // Configuration
});
```

---

## 🌐 Network Configuration

### Current Networks

- **Ethereum**: Sepolia Testnet (Chain ID: 11155111)
- **Bitcoin**: Testnet

See [CONFIG.md](./CONFIG.md) for detailed network configuration, RPC endpoints, and mainnet setup instructions.

### Testnet Faucets

- **Sepolia ETH**: https://sepoliafaucet.com/
- **Bitcoin Testnet**: https://bitcoinfaucet.uo1.net/

---

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Manual Testing Checklist

- [ ] Create new wallet
- [ ] Import existing wallet
- [ ] PIN setup and unlock
- [ ] Send transaction
- [ ] Swap tokens
- [ ] View transaction history
- [ ] Add and use contacts
- [ ] AI assistant commands
- [ ] Auto-lock functionality

---

## 🐛 Troubleshooting

### Common Issues

**"Wallet not ready" error:**
- Ensure backend server is running
- Check browser console for errors
- Verify IndexedDB is accessible

**"Transaction failed" error:**
- Check network connection
- Verify sufficient balance
- Ensure RPC endpoint is accessible

**"AI assistant not responding":**
- Verify ElevenLabs agent ID is configured
- Check browser console for WebSocket errors
- Ensure microphone permissions are granted

**Balance not updating:**
- Wait for auto-refresh (30 seconds)
- Manually refresh from dashboard
- Check RPC endpoint status

### Reset Wallet (Development Only)

To reset your wallet and start fresh:

1. Open browser DevTools (F12)
2. Go to **Application** → **IndexedDB**
3. Delete **WalletDB** database
4. Clear **Local Storage**
5. Refresh the page

---

## 📚 Documentation

- **[CONFIG.md](./CONFIG.md)**: Network configuration and RPC setup
- **API Documentation**: See `backend/server.js` for available endpoints
- **WDK Documentation**: https://docs.wallet.tether.io

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- Additional blockchain support
- UI/UX improvements
- Security enhancements
- Documentation improvements
- Bug fixes
- Performance optimizations

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

**This software is provided "as is" for educational and development purposes.**

- Always test thoroughly before using with real funds
- Use testnets for development
- Follow security best practices
- Keep your seed phrase secure
- Understand the risks of self-custody

**The developers are not responsible for any loss of funds.**

---

## 🏆 Hackathon

Baifrost was designed and built for the **Future of Wallet** hackathon organized by **Tether**, the program around Tether's Wallet Development Kit (WDK).

- 📥 **100+ teams applied**, 10 were selected to compete in the final stage
- 🥈 **Baifrost finished 2nd** among the finalists

What the judges saw:

- A fully self-custodial, multi-chain PWA wallet built directly on top of Tether WDK
- An AI voice assistant that turns natural language ("send 10 dollars to Ahmet") into reviewed, user-approved transactions
- In-wallet DEX swaps via the Velora protocol
- Client-side security: AES-GCM encrypted seed storage in IndexedDB, PBKDF2 key derivation, PIN lock — no keys or seed phrase ever leave the device

---

## 🙏 Acknowledgments

- [Tether WDK](https://github.com/tetherto/wdk-core) for the powerful wallet development kit
- [ElevenLabs](https://elevenlabs.io/) for AI voice assistant technology
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for the amazing developer experience
- The open-source community for inspiration and support

---

<div align="center">

**Built with React, TypeScript, and Tether WDK**

**🥈 2nd place — Future of Wallet by Tether**

[⭐ Star us on GitHub](https://github.com/0xumutkk/baifrostWallet) • [🐛 Report Bug](https://github.com/0xumutkk/baifrostWallet/issues) • [💡 Request Feature](https://github.com/0xumutkk/baifrostWallet/issues)

</div>
