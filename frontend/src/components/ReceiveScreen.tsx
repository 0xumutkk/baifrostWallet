import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Download } from 'lucide-react';
import { useWdk } from '../contexts/WdkContext';
import { QRCodeSVG } from 'qrcode.react';

interface ReceiveScreenProps {
  onBack: () => void;
}

export const ReceiveScreen: React.FC<ReceiveScreenProps> = ({ onBack }) => {
  const { address } = useWdk();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!address) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-baifrost-teal">No address available</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-baifrost-teal" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">Receive</h1>
        </motion.div>

        {/* QR Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-6"
        >
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl mb-4">
              <QRCodeSVG value={address} size={200} level="H" />
            </div>
            <p className="text-sm text-gray-400 text-center mb-4">
              Scan address to Receive payment
            </p>
          </div>
        </motion.div>

        {/* Address Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-cyber mb-6"
        >
          <div className="block text-sm font-medium text-gray-300 mb-2">Your Address</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-4 py-3 bg-gray-800/50 rounded-lg border border-baifrost-teal/20">
              <code className="text-white text-sm break-all">{address}</code>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleCopyAddress}
              className="p-3 bg-gradient-baifrost rounded-lg hover:opacity-90 transition-opacity"
            >
              {copied ? (
                <Check className="w-5 h-5 text-white" />
              ) : (
                <Copy className="w-5 h-5 text-white" />
              )}
            </motion.button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-baifrost-teal mt-2 text-center"
            >
              Address copied!
            </motion.p>
          )}
        </motion.div>

        {/* Network Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber"
        >
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Network</span>
              <span className="text-white font-medium">Ethereum Sepolia</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Chain ID</span>
              <span className="text-white font-medium">11155111</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

