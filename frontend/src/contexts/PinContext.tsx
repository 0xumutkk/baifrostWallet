import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { secureStorage } from '../utils/secureStorage';
import { migrateFromLocalStorage, needsMigration } from '../utils/migration';

interface PinContextType {
  isPinSet: boolean;
  isUnlocked: boolean;
  isLoading: boolean;
  error: string | null;
  setPin: (pin: string) => Promise<boolean>;
  unlock: (pin: string) => Promise<boolean>;
  lock: () => void;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  clearError: () => void;
  needsMigration: boolean;
  migrateLegacyWallet: (pin: string) => Promise<boolean>;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export const PinProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPinSet, setIsPinSet] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsMigrationState, setNeedsMigrationState] = useState(false);
  const [lockTimer, setLockTimer] = useState<NodeJS.Timeout | null>(null);

  const AUTO_LOCK_TIMEOUT = 5 * 60 * 1000; // 5 minutes

  const clearError = () => setError(null);

  /**
   * Set new PIN and create wallet
   */
  const setPin = async (pin: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate PIN format
      if (!/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // PIN will be set when seed phrase is stored
      setIsPinSet(true);
      setIsUnlocked(true);
      
      // Start auto-lock timer
      startAutoLockTimer();
      
      console.log('✅ PIN set successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to set PIN';
      setError(errorMessage);
      console.error('❌ Set PIN error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Unlock wallet with PIN
   */
  const unlock = async (pin: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate PIN format
      if (!/^\d{6}$/.test(pin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // Verify PIN by attempting to decrypt
      const isValid = await secureStorage.verifyPin(pin);
      
      if (!isValid) {
        throw new Error('Incorrect PIN');
      }

      setIsUnlocked(true);
      
      // Start auto-lock timer
      startAutoLockTimer();
      
      console.log('🔓 Wallet unlocked');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unlock wallet';
      setError(errorMessage);
      console.error('❌ Unlock error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Lock wallet
   */
  const lock = () => {
    setIsUnlocked(false);
    
    // Clear auto-lock timer
    if (lockTimer) {
      clearTimeout(lockTimer);
      setLockTimer(null);
    }
    
    console.log('🔒 Wallet locked');
  };

  /**
   * Change PIN
   */
  const changePin = async (oldPin: string, newPin: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      // Validate new PIN format
      if (!/^\d{6}$/.test(newPin)) {
        throw new Error('New PIN must be exactly 6 digits');
      }

      if (oldPin === newPin) {
        throw new Error('New PIN must be different from old PIN');
      }

      await secureStorage.changePin(oldPin, newPin);
      
      console.log('✅ PIN changed successfully');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change PIN';
      setError(errorMessage);
      console.error('❌ Change PIN error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Migrate legacy wallet from localStorage
   */
  const migrateLegacyWallet = async (pin: string): Promise<boolean> => {
    try {
      setError(null);
      setIsLoading(true);

      const success = await migrateFromLocalStorage(pin);
      
      if (success) {
        setIsPinSet(true);
        setIsUnlocked(true);
        setNeedsMigrationState(false);
        startAutoLockTimer();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to migrate wallet';
      setError(errorMessage);
      console.error('❌ Migration error:', errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Start auto-lock timer
   */
  const startAutoLockTimer = () => {
    // Clear existing timer
    if (lockTimer) {
      clearTimeout(lockTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      console.log('⏰ Auto-lock timeout reached');
      lock();
    }, AUTO_LOCK_TIMEOUT);

    setLockTimer(timer);
  };

  /**
   * Reset auto-lock timer on user activity
   */
  const resetAutoLockTimer = () => {
    if (isUnlocked) {
      startAutoLockTimer();
    }
  };

  /**
   * Check if PIN is set and migration is needed on mount
   */
  useEffect(() => {
    const checkPinStatus = async () => {
      try {
        setIsLoading(true);

        // Check if migration is needed
        if (needsMigration()) {
          setNeedsMigrationState(true);
          setIsPinSet(false);
          setIsUnlocked(false);
        } else {
          // Check if wallet exists in IndexedDB
          const hasWallet = await secureStorage.hasWallet();
          setIsPinSet(hasWallet);
          setIsUnlocked(false);
        }
      } catch (err) {
        console.error('Error checking PIN status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkPinStatus();

    // Add event listeners for user activity to reset auto-lock timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      window.addEventListener(event, resetAutoLockTimer);
    });

    // Cleanup
    return () => {
      if (lockTimer) {
        clearTimeout(lockTimer);
      }
      events.forEach((event) => {
        window.removeEventListener(event, resetAutoLockTimer);
      });
    };
  }, []);

  return (
    <PinContext.Provider
      value={{
        isPinSet,
        isUnlocked,
        isLoading,
        error,
        setPin,
        unlock,
        lock,
        changePin,
        clearError,
        needsMigration: needsMigrationState,
        migrateLegacyWallet,
      }}
    >
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within PinProvider');
  }
  return context;
};

