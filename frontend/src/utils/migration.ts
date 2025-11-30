import { secureStorage } from './secureStorage';

/**
 * Migrate existing localStorage data to IndexedDB
 */
export async function migrateFromLocalStorage(pin: string): Promise<boolean> {
  const oldSeed = localStorage.getItem('wallet_seed');
  
  if (!oldSeed) {
    console.log('📭 No localStorage data to migrate');
    return false;
  }

  try {
    console.log('🔄 Starting migration from localStorage to IndexedDB...');
    
    // Decode the base64 encoded seed
    const decoded = atob(oldSeed);
    
    // Store in IndexedDB with encryption
    await secureStorage.storeSeedPhrase(decoded, pin);
    
    // Remove from localStorage
    localStorage.removeItem('wallet_seed');
    localStorage.removeItem('wallet_initialized');
    
    console.log('✅ Migration completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw new Error('Failed to migrate wallet data. Please try again.');
  }
}

/**
 * Check if migration is needed
 */
export function needsMigration(): boolean {
  const oldSeed = localStorage.getItem('wallet_seed');
  const wasInitialized = localStorage.getItem('wallet_initialized');
  
  return !!(oldSeed && wasInitialized === 'true');
}

/**
 * Clear legacy localStorage data
 */
export function clearLegacyStorage(): void {
  localStorage.removeItem('wallet_seed');
  localStorage.removeItem('wallet_initialized');
  console.log('🗑️  Legacy localStorage data cleared');
}

