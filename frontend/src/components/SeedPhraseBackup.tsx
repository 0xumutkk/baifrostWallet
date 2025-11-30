import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, AlertTriangle, Eye, EyeOff } from 'lucide-react';

interface SeedPhraseBackupProps {
  seedPhrase: string;
  onBack: () => void;
  onContinue: () => void;
}

export const SeedPhraseBackup: React.FC<SeedPhraseBackupProps> = ({
  seedPhrase,
  onBack,
  onContinue,
}) => {
  const [copied, setCopied] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const words = seedPhrase.split(' ');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(seedPhrase);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-2xl">
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
          <div>
            <h1 className="text-2xl font-bold text-white">Backup Your Seed Phrase</h1>
            <p className="text-sm text-gray-400 mt-1">Write down these 12 words in order</p>
          </div>
        </motion.div>

        {/* Security Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-6 border-baifrost-orange/30"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-baifrost-orange flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-white font-semibold mb-2">⚠️ Critical Security Information</h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>Never share your seed phrase with anyone</li>
                <li>Store it in a secure, offline location</li>
                <li>Anyone with your seed phrase can access your funds</li>
                <li>We cannot recover your wallet if you lose your seed phrase</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Seed Phrase Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-cyber mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Your Seed Phrase</h2>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsVisible(!isVisible)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                {isVisible ? (
                  <EyeOff className="w-5 h-5 text-baifrost-teal" />
                ) : (
                  <Eye className="w-5 h-5 text-baifrost-teal" />
                )}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleCopy}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-baifrost-teal" />
                ) : (
                  <Copy className="w-5 h-5 text-baifrost-teal" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Words Grid */}
          <div className="grid grid-cols-3 gap-3">
            {words.map((word, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.02 }}
                className="bg-gradient-to-br from-gray-700/60 to-gray-800/60 rounded-xl p-3 border-2 border-baifrost-teal/30 hover:border-baifrost-teal/60 transition-all backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-baifrost-teal font-bold w-6">{index + 1}.</span>
                  <span className="text-white font-semibold text-sm tracking-wide">
                    {isVisible ? word : '••••••••'}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {copied && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-baifrost-teal mt-4 text-center"
            >
              Seed phrase copied to clipboard!
            </motion.p>
          )}
        </motion.div>

        {/* Confirmation Checkbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber mb-6 border-2 border-baifrost-orange/20 hover:border-baifrost-orange/40 transition-colors"
        >
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="mt-1 w-6 h-6 rounded-lg border-2 border-baifrost-teal/30 bg-gray-800 text-baifrost-teal focus:ring-baifrost-teal focus:ring-2 cursor-pointer transition-all checked:bg-baifrost-teal/20 checked:border-baifrost-teal"
            />
            <div className="flex-1">
              <p className="text-white font-semibold mb-1 group-hover:text-baifrost-teal transition-colors">
                I've written down my seed phrase
              </p>
              <p className="text-sm text-gray-400 leading-relaxed">
                I understand that if I lose my seed phrase, I will permanently lose access to my wallet and funds.
              </p>
            </div>
          </label>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onContinue}
          disabled={!isConfirmed}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue to Confirmation
        </motion.button>
      </div>
    </div>
  );
};

