/**
 * Validation utilities for wallet operations
 */

/**
 * Validate Ethereum address format
 */
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate amount (must be positive number)
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num > 0;
}

/**
 * Check if amount exceeds balance
 */
export function exceedsBalance(amount: string, balance: string | null): boolean {
  if (!balance) return true;
  const amountNum = parseFloat(amount);
  const balanceNum = parseFloat(balance);
  return amountNum > balanceNum;
}

