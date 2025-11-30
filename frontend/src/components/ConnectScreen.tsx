import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Sparkles, Loader2, Copy, RefreshCw, AlertCircle } from 'lucide-react';
import { useWdk } from '../contexts/WdkContext';
import { useState } from 'react';
import { PinSetup } from './PinSetup';

interface ConnectScreenProps {
  onPinRequired?: (pin: string) => Promise<boolean>;
}

export const ConnectScreen = ({ onPinRequired }: ConnectScreenProps) => {
  const { isReady, address, balance, isLoading, error, generateWallet, clearError, refreshBalance } = useWdk();
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [pendingGenerate, setPendingGenerate] = useState(false);

  const handleInitialize = () => {
    if (onPinRequired) {
      setShowPinSetup(true);
      setPendingGenerate(true);
    } else {
      generateWallet();
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (onPinRequired) {
      const success = await onPinRequired(pin);
      if (success && pendingGenerate) {
        await generateWallet();
        setShowPinSetup(false);
        setPendingGenerate(false);
      }
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefreshBalance = async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (showPinSetup) {
    return <PinSetup onComplete={handlePinComplete} isLoading={isLoading} error={error} />;
  }

  // Wallet initialized view
  if (isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="max-w-md w-full"
        >
          {/* Header with animated icon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0, 245, 255, 0.3)',
                  '0 0 40px rgba(0, 245, 255, 0.6)',
                  '0 0 20px rgba(0, 245, 255, 0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-flex p-4 bg-neon-cyan/10 rounded-full mb-4"
            >
              <Wallet className="w-12 h-12 text-neon-cyan" />
            </motion.div>
            <h2 className="text-3xl font-bold text-white mb-2">Agent Initialized</h2>
            <p className="text-gray-400 text-sm">Your autonomous wallet is active</p>
          </motion.div>

          {/* Wallet info card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card-cyber space-y-4"
          >
            {/* Address section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Ethereum Address</span>
                <motion.button
                  onClick={handleCopyAddress}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                <code className="text-white font-mono text-xs block truncate">
                  {address}
                </code>
              </div>
              <AnimatePresence>
                {copied && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-neon-green text-xs text-center"
                  >
                    ✓ Copied to clipboard
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-700/50" />

            {/* Balance section */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm font-medium">Balance</span>
                <motion.button
                  onClick={handleRefreshBalance}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95, rotate: 180 }}
                  disabled={isRefreshing}
                  className="text-neon-cyan hover:text-neon-cyan/80 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>
              </div>
              <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-lg p-4 border border-neon-cyan/20">
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={balance}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-3xl font-bold text-neon-green"
                  >
                    {balance || '0.00'}
                  </motion.span>
                  <span className="text-gray-400 text-sm">ETH</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">Sepolia Testnet</p>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 pt-2">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.8, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-neon-green rounded-full"
              />
              <span className="text-gray-400 text-xs">Connected to backend</span>
            </div>
          </motion.div>

          {/* Info card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center"
          >
            <p className="text-xs text-gray-500">
              🔐 Your keys, your crypto • Non-custodial & secure
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Initial connect view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-md w-full space-y-8 text-center relative z-10">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.h1
            className="text-5xl font-bold text-white mb-2"
            animate={{
              textShadow: [
                '0 0 20px rgba(0, 245, 255, 0.5)',
                '0 0 40px rgba(0, 245, 255, 0.8)',
                '0 0 20px rgba(0, 245, 255, 0.5)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Predictive Financial Agent
          </motion.h1>
          <p className="text-gray-400 text-lg">Powered by Tether WDK</p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: 'spring' }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-neon-cyan/20"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-neon-cyan" />
            </motion.div>
            <span className="text-sm text-gray-300">Autonomous • Predictive • Secure</span>
          </motion.div>
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="text-red-400 text-sm font-medium">Error</p>
                  <p className="text-red-300 text-xs mt-1">{error}</p>
                </div>
                <button
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  ×
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Initialize button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
        <motion.button
          onClick={handleInitialize}
          disabled={isLoading}
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(0, 245, 255, 0.6)' }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 px-8 bg-gradient-to-r from-neon-cyan to-neon-pink rounded-xl font-semibold text-white shadow-lg shadow-neon-cyan/50 hover:shadow-neon-cyan/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
        >
            {/* Animated background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-neon-pink to-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity"
              animate={{
                x: ['0%', '100%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            />

            <span className="relative z-10 flex items-center gap-3">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Initializing Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Initialize Agent
                </>
              )}
            </span>
          </motion.button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="grid grid-cols-3 gap-4 pt-4"
        >
          {[
            { icon: '🔐', label: 'Self-Custodial' },
            { icon: '⚡', label: 'Instant' },
            { icon: '🌐', label: 'Multi-Chain' },
          ].map((feature, index) => (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              className="bg-gray-800/30 backdrop-blur-sm rounded-lg p-3 border border-gray-700/50"
            >
              <div className="text-2xl mb-1">{feature.icon}</div>
              <div className="text-xs text-gray-400">{feature.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-xs text-gray-500"
        >
          Your keys, your crypto. Non-custodial & secure.
        </motion.div>
      </div>
    </div>
  );
};

