import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X } from 'lucide-react';

interface SeedPhraseConfirmationProps {
  seedPhrase: string;
  onBack: () => void;
  onConfirm: () => void;
}

export const SeedPhraseConfirmation: React.FC<SeedPhraseConfirmationProps> = ({
  seedPhrase,
  onBack,
  onConfirm,
}) => {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [correctOrder, setCorrectOrder] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [hasError, setHasError] = useState(false);

  const words = seedPhrase.split(' ');

  useEffect(() => {
    // Shuffle words for selection
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setAvailableWords(shuffled);
    
    // Create correct order array
    const order = words.map((word, index) => index);
    setCorrectOrder(order);
  }, [seedPhrase]);

  useEffect(() => {
    // Check if all words are selected
    if (selectedWords.length === words.length) {
      // Verify order
      const isCorrect = selectedWords.every((word, index) => word === words[index]);
      setIsComplete(isCorrect);
      setHasError(!isCorrect);
    } else {
      setIsComplete(false);
      setHasError(false);
    }
  }, [selectedWords, words]);

  const handleWordClick = (word: string) => {
    if (selectedWords.includes(word)) {
      // Remove word
      setSelectedWords(selectedWords.filter((w) => w !== word));
    } else {
      // Add word
      setSelectedWords([...selectedWords, word]);
    }
    setHasError(false);
  };

  const handleRemoveWord = (index: number) => {
    setSelectedWords(selectedWords.filter((_, i) => i !== index));
    setHasError(false);
  };

  const handleReset = () => {
    setSelectedWords([]);
    setHasError(false);
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
            <h1 className="text-2xl font-bold text-white">Confirm Your Seed Phrase</h1>
            <p className="text-sm text-gray-400 mt-1">Select words in the correct order</p>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-6"
        >
          <p className="text-white font-medium mb-2">Select the words in the correct order</p>
          <p className="text-sm text-gray-400">
            Tap the words below to select them in the same order as your seed phrase.
          </p>
        </motion.div>

        {/* Selected Words Display */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-cyber mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Selected ({selectedWords.length}/{words.length})
            </h2>
            {selectedWords.length > 0 && (
              <button
                onClick={handleReset}
                className="text-sm text-baifrost-teal hover:text-baifrost-teal-light transition-colors"
              >
                Reset
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 min-h-[120px]">
            {Array.from({ length: words.length }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`bg-gradient-to-br rounded-xl p-3 border-2 ${
                  selectedWords[index]
                    ? 'border-baifrost-teal bg-baifrost-teal/20 from-baifrost-teal/20 to-baifrost-teal/10'
                    : 'border-gray-600/50 bg-gray-700/30 from-gray-700/30 to-gray-800/30'
                } flex items-center justify-between transition-all backdrop-blur-sm`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${selectedWords[index] ? 'text-baifrost-teal' : 'text-gray-400'}`}>
                    {index + 1}.
                  </span>
                  <span className="text-white font-semibold text-sm tracking-wide">
                    {selectedWords[index] || '___'}
                  </span>
                </div>
                {selectedWords[index] && (
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemoveWord(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {hasError && selectedWords.length === words.length && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
              >
                <p className="text-red-400 text-sm">
                  The order is incorrect. Please try again.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {isComplete && !hasError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-3 bg-baifrost-teal/20 border border-baifrost-teal/50 rounded-lg flex items-center gap-2"
              >
                <Check className="w-5 h-5 text-baifrost-teal" />
                <p className="text-baifrost-teal text-sm font-medium">
                  Perfect! Your seed phrase is confirmed.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Available Words */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber mb-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Available Words</h2>
          <div className="grid grid-cols-3 gap-3">
            {availableWords.map((word, index) => {
              const isSelected = selectedWords.includes(word);
              return (
                <motion.button
                  key={`${word}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  whileHover={{ scale: isSelected ? 1 : 1.05, y: isSelected ? 0 : -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWordClick(word)}
                  disabled={isSelected}
                  className={`p-3 rounded-xl border-2 transition-all backdrop-blur-sm ${
                    isSelected
                      ? 'bg-gray-700/50 border-gray-600 opacity-50 cursor-not-allowed'
                      : 'bg-gradient-to-br from-gray-700/40 to-gray-800/40 border-baifrost-teal/30 hover:border-baifrost-teal/60 hover:from-baifrost-teal/20 hover:to-baifrost-teal/10 shadow-lg hover:shadow-baifrost-teal/20'
                  }`}
                >
                  <span className="text-white font-semibold text-sm tracking-wide">{word}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Continue Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: isComplete ? 1.02 : 1 }}
          whileTap={{ scale: isComplete ? 0.98 : 1 }}
          onClick={onConfirm}
          disabled={!isComplete || hasError}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Confirm & Continue
        </motion.button>
      </div>
    </div>
  );
};

