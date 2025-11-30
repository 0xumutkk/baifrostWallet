import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, Download, Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onCreateWallet: () => void;
  onImportWallet: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onCreateWallet,
  onImportWallet,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold tracking-tight mb-2" style={{ 
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
        </motion.div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-3">Welcome to Baifrost</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            Your secure, multi-chain wallet for managing cryptocurrencies with AI-powered features.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* Create New Wallet */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateWallet}
            className="w-full btn-primary py-4 flex items-center justify-center gap-3"
          >
            <Wallet className="w-5 h-5" />
            <span>Create New Wallet</span>
          </motion.button>

          {/* Import Existing Wallet */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onImportWallet}
            className="w-full btn-secondary py-4 flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            <span>Import Existing Wallet</span>
          </motion.button>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-4 bg-gray-800/30 rounded-lg border border-baifrost-teal/20"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-baifrost-teal mt-0.5 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm text-gray-300 font-medium mb-1">Self-Custodial Wallet</p>
              <p className="text-xs text-gray-400">
                You control your keys. We never have access to your funds or seed phrase.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

