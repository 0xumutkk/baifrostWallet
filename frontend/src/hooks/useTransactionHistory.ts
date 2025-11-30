import { useQuery } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
}

export function useTransactionHistory(
  chain: string,
  address: string,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['transactions', chain, address],
    queryFn: async () => {
      console.log(`📜 [useTransactionHistory] Fetching transactions for ${chain}:${address}`);
      try {
        const result = await walletAPI.getTransactions(chain, address);
        console.log(`📜 [useTransactionHistory] API Response:`, {
          success: result.success,
          chain: result.chain,
          address: result.address,
          transactionsCount: result.transactions?.length || 0,
          transactions: result.transactions
        });
        
        if (!result.success) {
          console.error(`❌ [useTransactionHistory] API returned success: false`, result);
          throw new Error(result.error || 'Failed to fetch transactions');
        }
        
        if (!result.transactions || !Array.isArray(result.transactions)) {
          console.warn(`⚠️ [useTransactionHistory] Invalid transactions array:`, result);
          return { ...result, transactions: [] };
        }
        
        console.log(`✅ [useTransactionHistory] Received ${result.transactions.length} transactions`);
        return result;
      } catch (error) {
        console.error(`❌ [useTransactionHistory] Error fetching transactions:`, error);
        throw error;
      }
    },
    staleTime: 10000, // 10 seconds (reduced from 60s for faster updates)
    refetchInterval: 30000, // Auto-refresh every 30 seconds
    enabled: enabled && !!address,
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });
}

