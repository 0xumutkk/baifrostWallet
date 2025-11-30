import { openDB } from 'idb';

interface WalletData {
  id: string;
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  salt: Uint8Array;
  timestamp: number;
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  chain: string;
  timestamp: number;
  notes?: string;
  lastUsed?: number;
}

type Database = Awaited<ReturnType<typeof openDB>>;

class SecureStorage {
  private db: Database | null = null;
  private cryptoKey: CryptoKey | null = null;
  private readonly DB_NAME = 'WalletDB';
  private readonly DB_VERSION = 2; // Increment version to add contacts store

  /**
   * Initialize IndexedDB
   */
  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.DB_NAME, this.DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Create wallet object store
        if (!db.objectStoreNames.contains('wallet')) {
          db.createObjectStore('wallet', { keyPath: 'id' });
        }

        // Create settings object store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }

        // Create contacts object store (new in version 2)
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          // Create index for name search
          contactStore.createIndex('name', 'name', { unique: false });
          // Create index for address lookup
          contactStore.createIndex('address', 'address', { unique: false });
        }
      },
    });
  }

  /**
   * Generate encryption key from PIN using PBKDF2
   */
  async deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const pinData = encoder.encode(pin);

    // Import PIN as base key
    const baseKey = await crypto.subtle.importKey(
      'raw',
      pinData,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive AES key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // High iteration count for security
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data with WebCrypto
   */
  async encrypt(
    data: string,
    key: CryptoKey
  ): Promise<{ encrypted: ArrayBuffer; iv: Uint8Array }> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generate random IV (Initialization Vector)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    return { encrypted, iv };
  }

  /**
   * Decrypt data with WebCrypto
   */
  async decrypt(
    encrypted: ArrayBuffer,
    key: CryptoKey,
    iv: Uint8Array
  ): Promise<string> {
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      throw new Error('Decryption failed - incorrect PIN or corrupted data');
    }
  }

  /**
   * Store seed phrase securely
   */
  async storeSeedPhrase(seedPhrase: string, pin: string): Promise<void> {
    await this.init();

    // Generate random salt
    const salt = crypto.getRandomValues(new Uint8Array(16));

    // Derive key from PIN
    const key = await this.deriveKey(pin, salt);

    // Encrypt seed phrase
    const { encrypted, iv } = await this.encrypt(seedPhrase, key);

    // Store encrypted data
    const walletData: WalletData = {
      id: 'seed',
      encryptedData: encrypted,
      iv: iv,
      salt: salt,
      timestamp: Date.now(),
    };
    await this.db!.put('wallet', walletData);

    console.log('🔐 Seed phrase encrypted and stored in IndexedDB');
  }

  /**
   * Retrieve seed phrase
   */
  async getSeedPhrase(pin: string): Promise<string | null> {
    await this.init();

    const walletData = await this.db!.get('wallet', 'seed') as WalletData | undefined;
    if (!walletData) {
      return null;
    }

    try {
      // Derive key from PIN
      const key = await this.deriveKey(pin, walletData.salt);

      // Decrypt seed phrase
      const decrypted = await this.decrypt(
        walletData.encryptedData,
        key,
        walletData.iv
      );

      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt seed phrase:', error);
      throw error;
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    await this.init();
    const walletData = await this.db!.get('wallet', 'seed') as WalletData | undefined;
    return !!walletData;
  }

  /**
   * Get setting value
   */
  async getSetting(key: string): Promise<any> {
    await this.init();
    return await this.db!.get('settings', key);
  }

  /**
   * Set setting value
   */
  async setSetting(key: string, value: any): Promise<void> {
    await this.init();
    await this.db!.put('settings', value, key);
  }

  /**
   * Clear all wallet data
   */
  async clearWallet(): Promise<void> {
    await this.init();
    
    // Clear wallet store
    const walletTx = this.db!.transaction('wallet', 'readwrite');
    await walletTx.store.clear();
    await walletTx.done;

    // Clear settings store
    const settingsTx = this.db!.transaction('settings', 'readwrite');
    await settingsTx.store.clear();
    await settingsTx.done;

    this.cryptoKey = null;

    console.log('🗑️  Wallet data cleared from IndexedDB');
  }

  /**
   * Verify PIN is correct
   */
  async verifyPin(pin: string): Promise<boolean> {
    try {
      const seed = await this.getSeedPhrase(pin);
      return !!seed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change PIN
   */
  async changePin(oldPin: string, newPin: string): Promise<void> {
    // Get seed phrase with old PIN
    const seedPhrase = await this.getSeedPhrase(oldPin);
    
    if (!seedPhrase) {
      throw new Error('Invalid old PIN');
    }

    // Re-encrypt with new PIN
    await this.storeSeedPhrase(seedPhrase, newPin);
    
    console.log('🔑 PIN changed successfully');
  }

  /**
   * Add a new contact
   */
  async addContact(contact: Omit<Contact, 'id' | 'timestamp'>): Promise<Contact> {
    await this.init();

    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    await this.db!.put('contacts', newContact);
    console.log('📇 Contact added:', newContact.name);
    return newContact;
  }

  /**
   * Get contact by ID
   */
  async getContact(id: string): Promise<Contact | undefined> {
    await this.init();
    return await this.db!.get('contacts', id);
  }

  /**
   * Get contact by address
   */
  async getContactByAddress(address: string): Promise<Contact | undefined> {
    await this.init();
    const index = this.db!.transaction('contacts').store.index('address');
    const contacts = await index.getAll(address);
    return contacts[0]; // Return first match
  }

  /**
   * Get all contacts
   */
  async getAllContacts(): Promise<Contact[]> {
    await this.init();
    return await this.db!.getAll('contacts');
  }

  /**
   * Search contacts by name (case-insensitive)
   */
  async searchContactsByName(query: string): Promise<Contact[]> {
    await this.init();
    const allContacts = await this.getAllContacts();
    const lowerQuery = query.toLowerCase().trim();
    
    return allContacts.filter(contact => 
      contact.name.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Update contact
   */
  async updateContact(id: string, updates: Partial<Omit<Contact, 'id' | 'timestamp'>>): Promise<void> {
    await this.init();
    const contact = await this.getContact(id);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const updated: Contact = {
      ...contact,
      ...updates,
    };

    await this.db!.put('contacts', updated);
    console.log('📇 Contact updated:', updated.name);
  }

  /**
   * Delete contact
   */
  async deleteContact(id: string): Promise<void> {
    await this.init();
    await this.db!.delete('contacts', id);
    console.log('🗑️  Contact deleted');
  }

  /**
   * Update last used timestamp for a contact
   */
  async updateContactLastUsed(id: string): Promise<void> {
    await this.init();
    const contact = await this.getContact(id);
    if (contact) {
      await this.updateContact(id, { lastUsed: Date.now() });
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

