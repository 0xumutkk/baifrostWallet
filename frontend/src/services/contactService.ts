import { secureStorage, type Contact } from '../utils/secureStorage';

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy name matching
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 */
function similarityScore(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - (distance / maxLen);
}

/**
 * Search contacts by name using fuzzy matching
 * Returns contacts sorted by relevance (best match first)
 */
export async function searchContactsByName(query: string): Promise<Contact[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const allContacts = await secureStorage.getAllContacts();
  const lowerQuery = query.toLowerCase().trim();

  // Calculate similarity scores for each contact
  const contactsWithScores = allContacts.map(contact => {
    const nameLower = contact.name.toLowerCase();
    
    // Check for exact match (case-insensitive)
    if (nameLower === lowerQuery) {
      return { contact, score: 1.0, matchType: 'exact' as const };
    }
    
    // Check for starts-with match
    if (nameLower.startsWith(lowerQuery)) {
      return { contact, score: 0.9, matchType: 'starts-with' as const };
    }
    
    // Check for contains match
    if (nameLower.includes(lowerQuery)) {
      return { contact, score: 0.7, matchType: 'contains' as const };
    }
    
    // Calculate fuzzy similarity
    const similarity = similarityScore(nameLower, lowerQuery);
    if (similarity >= 0.6) { // Threshold for fuzzy matches
      return { contact, score: similarity, matchType: 'fuzzy' as const };
    }
    
    return null;
  }).filter((item): item is { contact: Contact; score: number; matchType: 'exact' | 'starts-with' | 'contains' | 'fuzzy' } => item !== null);

  // Sort by score (highest first), then by lastUsed (most recent first)
  contactsWithScores.sort((a, b) => {
    if (Math.abs(a.score - b.score) > 0.1) {
      return b.score - a.score; // Higher score first
    }
    // If scores are close, prefer recently used contacts
    const aLastUsed = a.contact.lastUsed || 0;
    const bLastUsed = b.contact.lastUsed || 0;
    return bLastUsed - aLastUsed;
  });

  return contactsWithScores.map(item => item.contact);
}

/**
 * Resolve a name to an address
 * Returns the address if a single match is found, or null if no match or multiple matches
 */
export async function resolveNameToAddress(
  name: string
): Promise<{ address: string; chain: string; contact: Contact } | null> {
  const matches = await searchContactsByName(name);
  
  if (matches.length === 0) {
    return null;
  }
  
  if (matches.length === 1) {
    const contact = matches[0];
    // Update last used timestamp
    await secureStorage.updateContactLastUsed(contact.id);
    return {
      address: contact.address,
      chain: contact.chain,
      contact,
    };
  }
  
  // Multiple matches - return null to let caller handle it
  return null;
}

/**
 * Get all matching contacts for a name (for when multiple matches exist)
 */
export async function getContactsByName(name: string): Promise<Contact[]> {
  return await searchContactsByName(name);
}

/**
 * Get contact by address
 */
export async function getContactByAddress(address: string): Promise<Contact | null> {
  const contact = await secureStorage.getContactByAddress(address);
  return contact || null;
}

/**
 * Add a new contact
 */
export async function addContact(
  name: string,
  address: string,
  chain: string = 'ethereum',
  notes?: string
): Promise<Contact> {
  // Validate address format
  if (chain === 'ethereum' && (!address.startsWith('0x') || address.length !== 42)) {
    throw new Error('Invalid Ethereum address format');
  }
  
  // Check if contact with same name and address already exists
  const existing = await secureStorage.getContactByAddress(address);
  if (existing && existing.name.toLowerCase() === name.toLowerCase()) {
    throw new Error('Contact with this name and address already exists');
  }
  
  return await secureStorage.addContact({
    name: name.trim(),
    address: address.toLowerCase(),
    chain,
    notes,
  });
}

/**
 * Update contact
 */
export async function updateContact(
  id: string,
  updates: Partial<Pick<Contact, 'name' | 'address' | 'chain' | 'notes'>>
): Promise<void> {
  await secureStorage.updateContact(id, updates);
}

/**
 * Delete contact
 */
export async function deleteContact(id: string): Promise<void> {
  await secureStorage.deleteContact(id);
}

/**
 * Get all contacts
 */
export async function getAllContacts(): Promise<Contact[]> {
  return await secureStorage.getAllContacts();
}

