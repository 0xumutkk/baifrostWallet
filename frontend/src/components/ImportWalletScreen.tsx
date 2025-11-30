import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertCircle, Check } from 'lucide-react';

interface ImportWalletScreenProps {
  onBack: () => void;
  onImport: (seedPhrase: string) => void;
}

export const ImportWalletScreen: React.FC<ImportWalletScreenProps> = ({
  onBack,
  onImport,
}) => {
  const [seedPhrase, setSeedPhrase] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const handleSeedPhraseChange = (value: string) => {
    setSeedPhrase(value);
    setError(null);

    // Validate seed phrase
    const words = value.trim().split(/\s+/).filter((w) => w.length > 0);
    
    if (words.length === 0) {
      setIsValid(false);
      return;
    }

    if (words.length !== 12) {
      setIsValid(false);
      if (words.length > 12) {
        setError('Seed phrase must be exactly 12 words');
      }
      return;
    }

    // Basic validation - check if all words are non-empty
    const allValid = words.every((word) => word.length > 0);
    setIsValid(allValid && words.length === 12);
  };

  const handleImport = () => {
    if (!isValid) {
      setError('Please enter a valid 12-word seed phrase');
      return;
    }

    const words = seedPhrase.trim().split(/\s+/);
    if (words.length !== 12) {
      setError('Seed phrase must be exactly 12 words');
      return;
    }

    onImport(seedPhrase.trim());
  };

  const wordCount = seedPhrase.trim().split(/\s+/).filter((w) => w.length > 0).length;

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
            <h1 className="text-2xl font-bold text-white">Import Existing Wallet</h1>
            <p className="text-sm text-gray-400 mt-1">Restore your wallet with your seed phrase</p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-6"
        >
          <p className="text-white font-medium mb-2">Enter your 12-word seed phrase</p>
          <p className="text-sm text-gray-400">
            Type or paste your seed phrase below. Make sure to enter all 12 words in the correct order.
          </p>
        </motion.div>

        {/* Seed Phrase Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-cyber mb-6"
        >
          <label htmlFor="seed-phrase-textarea" className="block text-sm font-medium text-gray-300 mb-2">
            Seed Phrase
            <span className="ml-2 text-xs text-gray-400">
              ({wordCount}/12 words)
            </span>
          </label>
          <textarea
            id="seed-phrase-textarea"
            value={seedPhrase}
            onChange={(e) => handleSeedPhraseChange(e.target.value)}
            placeholder="Enter your 12-word seed phrase here..."
            rows={4}
            className={`w-full px-4 py-3 bg-gradient-to-br from-gray-800/60 to-gray-900/60 border-2 rounded-xl text-white placeholder-gray-500 focus:outline-none transition-all backdrop-blur-sm ${
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                : isValid
                ? 'border-baifrost-teal/50 focus:border-baifrost-teal focus:ring-2 focus:ring-baifrost-teal/20'
                : 'border-baifrost-teal/20 focus:border-baifrost-teal/60 focus:ring-2 focus:ring-baifrost-teal/10'
            }`}
          />
          
          {/* Word Count Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              {isValid ? (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-baifrost-teal/20 border border-baifrost-teal/40 rounded-lg"
                >
                  <Check className="w-4 h-4 text-baifrost-teal" />
                  <span className="text-sm text-baifrost-teal font-medium">Valid seed phrase</span>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className={`w-4 h-4 ${wordCount === 12 ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className={`text-sm ${wordCount === 12 ? 'text-red-400' : 'text-gray-400'}`}>
                    {wordCount < 12 ? `Enter ${12 - wordCount} more word${12 - wordCount > 1 ? 's' : ''}` : 'Invalid format'}
                  </span>
                </div>
              )}
            </div>
            {wordCount > 0 && wordCount < 12 && (
              <div className="text-xs text-gray-500">
                {wordCount}/12
              </div>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber mb-6 border-baifrost-orange/30"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-baifrost-orange flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-medium mb-1">Security Reminder</p>
              <p className="text-sm text-gray-400">
                Your seed phrase is encrypted and stored locally. We never see or store your seed phrase on our servers.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Import Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: isValid ? 1.02 : 1 }}
          whileTap={{ scale: isValid ? 0.98 : 1 }}
          onClick={handleImport}
          disabled={!isValid}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import Wallet
        </motion.button>
      </div>
    </div>
  );
};

