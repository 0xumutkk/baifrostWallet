import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { usePin } from '../contexts/PinContext';
import { useWdk } from '../contexts/WdkContext';

export const UnlockScreen = () => {
  const { unlock, error: pinError, clearError, isLoading: pinLoading } = usePin();
  const { restoreWalletFromStorage, isLoading: walletLoading, isReady, address } = useWdk();
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;
  const isLoading = pinLoading || walletLoading;
  
  // Debug: Log wallet state changes
  React.useEffect(() => {
    console.log('🔓 [UnlockScreen] Wallet state - isReady:', isReady, 'address:', address, 'isLoading:', walletLoading);
  }, [isReady, address, walletLoading]);

  const handleNumberClick = async (num: number) => {
    if (isLoading || attempts >= MAX_ATTEMPTS) return;

    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 6) {
      try {
        console.log('🔓 [UnlockScreen] PIN entered, validating...');
        // First unlock with PIN (validates PIN)
        const success = await unlock(newPin);
        
        if (!success) {
          console.log('❌ [UnlockScreen] PIN validation failed');
          setAttempts((prev) => prev + 1);
          setPin('');
          
          if (attempts + 1 >= MAX_ATTEMPTS) {
            console.warn('Too many failed attempts');
          }
          return;
        }

        console.log('✅ [UnlockScreen] PIN validated, restoring wallet...');
        // If PIN is correct, restore wallet from IndexedDB
        try {
          await restoreWalletFromStorage(newPin);
          console.log('✅ [UnlockScreen] Wallet restore completed successfully');
          
          // Wait a bit for React state to update
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if wallet is ready (state will be updated via React re-render)
          console.log('✅ [UnlockScreen] After restore - Wallet should be ready now');
          console.log('✅ [UnlockScreen] Navigation will happen automatically when isReady becomes true');
        } catch (restoreErr) {
          console.error('❌ [UnlockScreen] Wallet restore failed:', restoreErr);
          // Show error to user but don't clear PIN immediately
          // Let them see what went wrong
          throw restoreErr; // Re-throw to be caught by outer catch
        }
        
      } catch (err) {
        console.error('❌ [UnlockScreen] Unlock error:', err);
        setAttempts((prev) => prev + 1);
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    if (isLoading) return;
    setPin((prev) => prev.slice(0, -1));
    if (pinError) clearError();
  };

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
            <Lock className="w-12 h-12 text-baifrost-teal" />
          </motion.div>
          <h2 className="text-3xl font-bold text-white mb-2">Unlock Wallet</h2>
          <p className="text-gray-400">Enter your PIN to continue</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3, 4, 5].map((index) => (
            <motion.div
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`w-4 h-4 rounded-full transition-all ${
                index < pin.length
                  ? 'bg-baifrost-teal shadow-lg shadow-baifrost-teal/50'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Attempts Warning */}
        {attempts > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-4 text-center"
          >
            <p className="text-yellow-500 text-sm">
              {attempts === 1 ? '1 failed attempt' : `${attempts} failed attempts`}
              {attempts >= 3 && ` - ${MAX_ATTEMPTS - attempts} remaining`}
            </p>
          </motion.div>
        )}

        {/* Error Message */}
        <AnimatePresence>
          {pinError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{pinError}</p>
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
                disabled={isLoading || attempts >= MAX_ATTEMPTS}
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
              disabled={isLoading || attempts >= MAX_ATTEMPTS}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 bg-gradient-to-br from-gray-700/60 to-gray-800/60 hover:from-baifrost-teal/20 hover:to-baifrost-teal/10 border-2 border-gray-600/30 hover:border-baifrost-teal/40 rounded-xl font-semibold text-white text-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm shadow-lg hover:shadow-baifrost-teal/20"
            >
              0
            </motion.button>

            {/* Backspace */}
            <motion.button
              onClick={handleBackspace}
              disabled={isLoading || attempts >= MAX_ATTEMPTS}
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
            <span className="text-sm">Unlocking...</span>
          </motion.div>
        )}

        {/* Locked Out State */}
        {attempts >= MAX_ATTEMPTS && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center"
          >
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-400 text-sm font-semibold mb-2">
              Too many failed attempts
            </p>
            <p className="text-red-300 text-xs">
              Please restart the app to try again
            </p>
          </motion.div>
        )}

        {/* Forgot PIN & Reset Wallet */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 space-y-3"
        >
          <button
            onClick={() => {
              // TODO: Implement forgot PIN flow (requires seed phrase recovery)
              alert('To recover your wallet, you will need your seed phrase. This feature is coming soon.');
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-400 transition-colors"
          >
            Forgot PIN?
          </button>
          
          {/* Reset Wallet Button - Always Visible */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={async () => {
              const confirmed = confirm(
                '⚠️ WARNING: This will permanently delete your wallet!\n\n' +
                'All your data will be lost:\n' +
                '• Seed phrase\n' +
                '• PIN\n' +
                '• Wallet data\n\n' +
                'This action CANNOT be undone!\n\n' +
                'Are you absolutely sure?'
              );
              
              if (!confirmed) return;
              
              try {
                // Clear IndexedDB
                const { secureStorage } = await import('../utils/secureStorage');
                await secureStorage.init();
                await secureStorage.clearWallet();
                
                // Clear localStorage
                localStorage.clear();
                
                // Clear sessionStorage
                sessionStorage.clear();
                
                // Delete IndexedDB database completely
                const deleteReq = indexedDB.deleteDatabase('WalletDB');
                deleteReq.onsuccess = () => {
                  console.log('✅ WalletDB deleted');
                  // Reload page to show WelcomeScreen
                  window.location.reload();
                };
                deleteReq.onerror = () => {
                  console.error('❌ Failed to delete WalletDB');
                  // Still reload even if delete fails
                  window.location.reload();
                };
                deleteReq.onblocked = () => {
                  console.warn('⚠️ Delete blocked, reloading anyway');
                  window.location.reload();
                };
              } catch (error) {
                console.error('Reset error:', error);
                // Force reload even if there's an error
                alert('Reset completed. Reloading...');
                window.location.reload();
              }
            }}
            className="w-full py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border-2 border-red-500/30 hover:border-red-500/50 rounded-xl text-red-400 hover:text-red-300 font-medium text-sm transition-all"
          >
            🗑️ Reset Wallet (Start Over)
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

