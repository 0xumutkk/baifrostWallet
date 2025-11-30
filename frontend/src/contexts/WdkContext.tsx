import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { walletAPI } from '../services/api';

interface WdkContextType {
  isReady: boolean;
  address: string | null;
  balance: string | null;
  isLoading: boolean;
  error: string | null;
  seedPhrase: string | null;
  generateWallet: () => Promise<void>;
  restoreWallet: (seedPhrase: string) => Promise<void>;
  restoreWalletFromStorage: (pin: string) => Promise<void>;
  clearError: () => void;
  refreshBalance: () => Promise<void>;
}

const WdkContext = createContext<WdkContextType | undefined>(undefined);

export const WdkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);

  const clearError = () => setError(null);

  const refreshBalance = async () => {
    if (!isReady || !address) {
      console.log('⏸️  Skipping balance refresh - wallet not ready or no address');
      return;
    }
    
    try {
      console.log('🔄 [refreshBalance] Fetching balance for address:', address);
      const balanceResult = await walletAPI.getBalance('ethereum');
      console.log('✅ [refreshBalance] Balance fetched:', balanceResult.balance, 'ETH');
      setBalance(balanceResult.balance);
    } catch (err) {
      // Log errors for debugging
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('❌ [refreshBalance] Failed to refresh balance:', errorMsg);
      if (!errorMsg.includes('not initialized')) {
        console.warn('Failed to refresh balance:', errorMsg);
      }
    }
  };

  const generateWallet = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Generating new wallet...');
      
      // Initialize wallet with new seed
      const initResult = await walletAPI.initialize();
      
      if (!initResult.success) {
        throw new Error('Failed to initialize wallet');
      }

      // Set Ethereum address
      setAddress(initResult.accounts.ethereum.address);
      
      // Store seed phrase (will be encrypted with PIN later)
      if (initResult.seedPhrase) {
        setSeedPhrase(initResult.seedPhrase);
        // Don't store in localStorage - will be stored in IndexedDB with PIN encryption
      }
      
      // Set ready state
      setIsReady(true);
      console.log('✅ Wallet generated successfully');
      
      // Fetch balance after a short delay to ensure backend session is ready
      // This prevents race conditions with session cookie establishment
      setTimeout(async () => {
        try {
          const balanceResult = await walletAPI.getBalance('ethereum');
          setBalance(balanceResult.balance);
        } catch (balanceErr) {
          // Silently set to 0 if balance fetch fails
          console.warn('Could not fetch initial balance:', balanceErr);
          setBalance('0');
        }
      }, 200);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate wallet';
      console.error('❌ Generate wallet error:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const restoreWallet = async (seedPhraseInput: string) => {
    console.log('🔄 [restoreWallet] Starting with seed phrase...');
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate seed phrase format
      const words = seedPhraseInput.trim().split(/\s+/);
      if (words.length !== 12) {
        throw new Error('Seed phrase must be exactly 12 words');
      }
      
      console.log('🔄 [restoreWallet] Calling walletAPI.initialize...');
      // Initialize with provided seed
      const initResult = await walletAPI.initialize(seedPhraseInput);
      
      if (!initResult.success) {
        throw new Error('Failed to restore wallet');
      }

      console.log('🔄 [restoreWallet] Wallet initialized, setting address:', initResult.accounts.ethereum.address);

      // Set all state values together to ensure consistency
      const newAddress = initResult.accounts.ethereum.address;
      
      // Use React's batch update - set all states together
      setAddress(newAddress);
      setSeedPhrase(seedPhraseInput);
      setIsReady(true);
      setIsLoading(false);
      
      console.log('✅ [restoreWallet] State updated - isReady: TRUE, address:', newAddress);
      console.log('✅ [restoreWallet] Wallet restored successfully');
      
      // Verify state was set (will show in next render)
      setTimeout(() => {
        console.log('✅ [restoreWallet] State verification - should trigger re-render');
      }, 0);
      
      // Fetch balance after a short delay to ensure backend session is ready
      setTimeout(async () => {
        try {
          console.log('🔄 [restoreWallet] Fetching balance...');
          const balanceResult = await walletAPI.getBalance('ethereum');
          setBalance(balanceResult.balance);
          console.log('✅ [restoreWallet] Balance fetched:', balanceResult.balance);
        } catch (balanceErr) {
          // Silently set to 0 if balance fetch fails
          console.warn('⚠️ [restoreWallet] Could not fetch initial balance:', balanceErr);
          setBalance('0');
        }
      }, 200);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore wallet';
      console.error('❌ [restoreWallet] Error:', errorMessage, err);
      setError(errorMessage);
      setIsReady(false); // Ensure isReady is false on error
      setIsLoading(false);
      console.log('🔄 [restoreWallet] Error - Loading set to false, isReady: false');
    }
    // Note: No finally block needed - loading is handled in try/catch
    // isReady is set in try block on success, false in catch on error
  };

  // Restore wallet from IndexedDB using PIN
  const restoreWalletFromStorage = async (pin: string) => {
    console.log('🔓 [restoreWalletFromStorage] Starting...');
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔓 [restoreWalletFromStorage] Getting seed phrase from IndexedDB...');
      
      // Get seed phrase from IndexedDB
      const { secureStorage } = await import('../utils/secureStorage');
      await secureStorage.init();
      const seedPhrase = await secureStorage.getSeedPhrase(pin);
      
      if (!seedPhrase) {
        throw new Error('Failed to retrieve seed phrase - incorrect PIN?');
      }

      console.log('🔓 [restoreWalletFromStorage] Seed phrase retrieved, restoring wallet...');

      // Restore wallet with seed phrase
      // Note: restoreWallet will set isReady=true and setIsLoading(false) on success
      await restoreWallet(seedPhrase);
      
      // Wait a tick for React state to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('✅ [restoreWalletFromStorage] Wallet restored successfully');
      console.log('✅ [restoreWalletFromStorage] State should now be: isReady=true, isLoading=false');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to restore wallet from storage';
      console.error('❌ [restoreWalletFromStorage] Error:', errorMessage, err);
      setError(errorMessage);
      setIsReady(false);
      setIsLoading(false); // Set loading to false on error
      throw err; // Re-throw so caller can handle
    }
    // Don't set isLoading to false here - restoreWallet handles it
  };

  // Auto-restore on mount if seed exists in IndexedDB
  useEffect(() => {
    const autoRestore = async () => {
      // Don't auto-restore if already ready or loading
      if (isReady || isLoading) return;

      try {
        // Check IndexedDB first (new secure storage)
        const { secureStorage } = await import('../utils/secureStorage');
        await secureStorage.init();
        const hasWallet = await secureStorage.hasWallet();
        
        if (hasWallet) {
          // Wallet exists in IndexedDB, but we need PIN to decrypt
          // So we don't auto-restore here - user must unlock with PIN
          // Just mark that wallet exists
          console.log('🔐 Wallet found in IndexedDB - waiting for PIN unlock');
          return;
        }

        // Fallback: Check localStorage (legacy)
        const storedSeed = localStorage.getItem('wallet_seed');
        const wasInitialized = localStorage.getItem('wallet_initialized');
        
        if (storedSeed && wasInitialized === 'true') {
          try {
            const decodedSeed = atob(storedSeed);
            await restoreWallet(decodedSeed);
          } catch (err) {
            console.error('Auto-restore failed:', err);
            // Clear invalid data
            localStorage.removeItem('wallet_seed');
            localStorage.removeItem('wallet_initialized');
          }
        }
      } catch (err) {
        console.error('Auto-restore check failed:', err);
      }
    };

    autoRestore();
  }, []); // Empty dependency array - only run once on mount

  // Refresh balance periodically when wallet is ready
  useEffect(() => {
    // Only start balance refresh if wallet is fully ready AND not loading
    if (!isReady || !address || isLoading) {
      console.log('⏸️  [useEffect] Skipping balance refresh - isReady:', isReady, 'address:', address, 'isLoading:', isLoading);
      return;
    }

    console.log('✅ [useEffect] Wallet is ready, setting up balance refresh...');

    // Wait longer to ensure backend wallet is fully initialized
    // The balance is already fetched in generateWallet/restoreWallet with a delay
    const initialDelay = setTimeout(() => {
      console.log('🔄 [useEffect] Initial balance refresh triggered');
      refreshBalance();
    }, 3000); // Increased delay to ensure backend wallet is initialized

    // Refresh every 10 seconds (more frequent for better UX)
    const interval = setInterval(() => {
      console.log('🔄 [useEffect] Periodic balance refresh triggered');
      refreshBalance();
    }, 10000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, [isReady, address, isLoading]);

  return (
    <WdkContext.Provider
      value={{
        isReady,
        address,
        balance,
        isLoading,
        error,
        seedPhrase,
        generateWallet,
        restoreWallet,
        restoreWalletFromStorage,
        clearError,
        refreshBalance,
      }}
    >
      {children}
    </WdkContext.Provider>
  );
};

export const useWdk = () => {
  const context = useContext(WdkContext);
  if (!context) {
    throw new Error('useWdk must be used within WdkProvider');
  }
  return context;
};

