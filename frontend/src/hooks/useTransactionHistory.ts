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
    queryFn: () => walletAPI.getTransactions(chain, address),
    staleTime: 60000, // 1 minute
    enabled: enabled && !!address,
  });
}

