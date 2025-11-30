import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Send, 
  Download, 
  ArrowUpDown, 
  Wallet, 
  TrendingUp,
  Copy,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { useWdk } from '../contexts/WdkContext';
import { useTokenList } from '../hooks/useTokenTransfer';
import { BalanceSkeleton } from './LoadingSkeleton';
import { TransactionList } from './TransactionList';

interface DashboardProps {
  onNavigate?: (screen: 'send' | 'swap' | 'receive') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { address, balance, isReady, refreshBalance, isLoading, error, restoreWalletFromStorage } = useWdk();
  const { data: tokenList, isLoading: tokensLoading } = useTokenList('ethereum');
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Debug log - track all state changes
  useEffect(() => {
    console.log('📊 [Dashboard] Render - isReady:', isReady, 'isLoading:', isLoading, 'address:', address, 'error:', error);
    
    // If wallet becomes ready, log it
    if (isReady && address) {
      console.log('✅ [Dashboard] Wallet is ready! Address:', address);
    }
  }, [isReady, isLoading, address, error]);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00';
    const num = parseFloat(bal);
    return num.toFixed(4);
  };

  const formatUSD = (bal: string | null) => {
    if (!bal) return '$0.00';
    // Placeholder: In production, fetch real USD price
    const num = parseFloat(bal) * 2500; // Example ETH price
    return `$${num.toFixed(2)}`;
  };

  // Debug log
  useEffect(() => {
    console.log('📊 [Dashboard] Render - isReady:', isReady, 'isLoading:', isLoading, 'address:', address, 'error:', error);
  }, [isReady, isLoading, address, error]);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md px-4"
        >
          {isLoading && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-baifrost-teal/30 border-t-baifrost-teal rounded-full mx-auto mb-4"
            />
          )}
          <p className="text-baifrost-teal text-lg font-semibold mb-2">
            {isLoading ? 'Loading wallet...' : 'Wallet not ready'}
          </p>
          <p className="text-gray-400 text-sm mb-4">
            {isLoading 
              ? 'Please wait while we restore your wallet' 
              : error 
                ? 'Failed to restore wallet. Please try unlocking again.'
                : 'Please unlock your wallet first'}
          </p>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
          {process.env.NODE_ENV === 'development' && (
            <div className="text-gray-500 text-xs mt-4 space-y-1 text-left bg-gray-800/50 p-3 rounded-lg">
              <p>isReady: {String(isReady)}</p>
              <p>isLoading: {String(isLoading)}</p>
              <p>address: {address || 'null'}</p>
              {error && <p className="text-red-400">error: {error}</p>}
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="container mx-auto px-4 pt-8 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              <span className="text-baifrost-beige">b</span>
              <span className="inline-block bg-gradient-to-r from-baifrost-orange via-[#FFA500] to-baifrost-teal bg-clip-text text-transparent">a</span>
              <span className="relative inline-block bg-gradient-to-r from-baifrost-teal to-[#60E8D8] bg-clip-text text-transparent">
                i
                <span className="absolute -top-0.5 left-[3px] w-1.5 h-1.5 bg-baifrost-teal rounded-full"></span>
              </span>
              <span className="text-baifrost-beige">frost</span>
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyAddress}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-lg border border-baifrost-teal/20 hover:border-baifrost-teal/40 transition-colors"
          >
            <Wallet className="w-4 h-4 text-baifrost-teal" />
            <span className="text-sm text-gray-300">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
            </span>
            {copied ? (
              <span className="text-xs text-baifrost-teal">Copied!</span>
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </motion.button>
        </motion.div>

        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-gradient mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-baifrost-beige/80 text-sm mb-1">Total Balance</p>
              <h2 className="text-4xl font-bold text-white mb-1">
                {formatBalance(balance)} ETH
              </h2>
              <p className="text-baifrost-beige/60 text-sm">
                {formatUSD(balance)}
                <span className="text-baifrost-teal ml-2">+0.7%</span>
              </p>
            </div>
            <motion.button
              whileHover={{ rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={async () => {
                await refreshBalance();
                setLastRefresh(new Date());
              }}
              className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <RefreshCw className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.('send')}
            className="card-cyber flex flex-col items-center gap-2 py-4 hover:border-baifrost-orange/40 transition-colors"
          >
            <div className="p-3 bg-gradient-baifrost rounded-full">
              <Send className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">Send</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.('receive')}
            className="card-cyber flex flex-col items-center gap-2 py-4 hover:border-baifrost-teal/40 transition-colors"
          >
            <div className="p-3 bg-gradient-baifrost rounded-full">
              <Download className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">Receive</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate?.('swap')}
            className="card-cyber flex flex-col items-center gap-2 py-4 hover:border-baifrost-teal/40 transition-colors"
          >
            <div className="p-3 bg-gradient-baifrost rounded-full">
              <ArrowUpDown className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-300">Swap</span>
          </motion.button>
        </motion.div>

        {/* Token List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Tokens</h3>
            <button className="text-sm text-baifrost-teal hover:text-baifrost-teal-light transition-colors">
              View All
            </button>
          </div>

          {tokensLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-700/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {/* ETH Token */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-baifrost rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">ETH</span>
                  </div>
                  <div>
                    <p className="font-semibold text-white">{formatBalance(balance)} ETH</p>
                    <p className="text-sm text-gray-400">{formatUSD(balance)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-baifrost-teal">+0.7%</p>
                  <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                </div>
              </motion.div>

              {/* Other tokens from list */}
              {tokenList?.tokens
                .filter((token) => token.address !== 'native')
                .slice(0, 3)
                .map((token) => (
                  <motion.div
                    key={token.address}
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-between p-3 bg-gray-700/20 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-baifrost-teal/20 rounded-full flex items-center justify-center">
                        <span className="text-baifrost-teal font-bold text-xs">
                          {token.symbol.slice(0, 3)}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-white">0.00 {token.symbol}</p>
                        <p className="text-sm text-gray-400">$0.00</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-400">--</p>
                      <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                    </div>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-cyber"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            <button className="text-sm text-baifrost-teal hover:text-baifrost-teal-light transition-colors">
              View All
            </button>
          </div>
          <TransactionList chain="ethereum" limit={5} />
        </motion.div>
      </div>
    </div>
  );
};

