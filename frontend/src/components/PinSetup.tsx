import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Check, X } from 'lucide-react';
import { useState } from 'react';

interface PinSetupProps {
  onComplete: (pin: string) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export const PinSetup = ({ onComplete, isLoading = false, error = null }: PinSetupProps) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleNumberClick = (num: number) => {
    if (isLoading) return;

    if (step === 'enter') {
      if (pin.length < 6) {
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length === 6) {
          // Move to confirm step
          setTimeout(() => {
            setStep('confirm');
          }, 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const newConfirmPin = confirmPin + num;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 6) {
          // Check if PINs match
          setTimeout(() => {
            if (newConfirmPin === pin) {
              onComplete(pin);
            } else {
              setLocalError('PINs do not match');
              setTimeout(() => {
                setPin('');
                setConfirmPin('');
                setStep('enter');
                setLocalError(null);
              }, 2000);
            }
          }, 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;

    if (step === 'enter') {
      setPin((prev) => prev.slice(0, -1));
    } else {
      if (confirmPin.length > 0) {
        setConfirmPin((prev) => prev.slice(0, -1));
      } else {
        // Go back to enter step
        setStep('enter');
        setPin('');
      }
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;
  const displayError = error || localError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(64, 224, 208, 0.3)',
                '0 0 40px rgba(64, 224, 208, 0.6)',
                '0 0 20px rgba(64, 224, 208, 0.3)',
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex p-4 bg-baifrost-teal/10 rounded-full mb-4 border border-baifrost-teal/20"
          >
            {step === 'enter' ? '🔐' : '✅'}
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">
            {step === 'enter' ? 'Create PIN' : 'Confirm PIN'}
          </h2>
          <p className="text-gray-400">
            {step === 'enter'
              ? 'Enter a 6-digit PIN to secure your wallet'
              : 'Re-enter your PIN to confirm'}
          </p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`w-4 h-4 rounded-full transition-all ${
                index < currentPin.length
                  ? 'bg-baifrost-teal shadow-lg shadow-baifrost-teal/50'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
            >
              <X className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{displayError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Number Pad */}
        <div className="card-cyber">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <motion.button
                key={num}
                onClick={() => handleNumberClick(num)}
                disabled={isLoading}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="p-4 bg-gradient-to-br from-gray-700/60 to-gray-800/60 hover:from-baifrost-teal/20 hover:to-baifrost-teal/10 border-2 border-gray-600/30 hover:border-baifrost-teal/40 rounded-xl font-semibold text-white text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-baifrost-teal/20"
              >
                {num}
              </motion.button>
            ))}

            {/* Empty cell */}
            <div />

            {/* Zero */}
            <motion.button
              onClick={() => handleNumberClick(0)}
              disabled={isLoading}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-gradient-to-br from-gray-700/60 to-gray-800/60 hover:from-baifrost-teal/20 hover:to-baifrost-teal/10 border-2 border-gray-600/30 hover:border-baifrost-teal/40 rounded-xl font-semibold text-white text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-baifrost-teal/20"
            >
              0
            </motion.button>

            {/* Backspace */}
            <motion.button
              onClick={handleBackspace}
              disabled={isLoading}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-gradient-to-br from-gray-700/60 to-gray-800/60 hover:from-baifrost-orange/20 hover:to-baifrost-orange/10 border-2 border-gray-600/30 hover:border-baifrost-orange/40 rounded-xl font-semibold text-white text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-baifrost-orange/20"
            >
              ←
            </motion.button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center justify-center gap-2 text-baifrost-teal"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Setting up your wallet...</span>
          </motion.div>
        )}

        {/* Security Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-xs text-gray-500"
        >
          🔐 Your PIN is used to encrypt your wallet locally
        </motion.div>
      </motion.div>
    </div>
  );
};

