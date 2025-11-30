import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

export function useWalletBalance(chain: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['balance', chain],
    queryFn: () => walletAPI.getBalance(chain),
    refetchInterval: 30000, // Auto-refresh every 30s
    enabled,
    staleTime: 30000,
  });
}

export function useRefreshBalance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (chain: string) => walletAPI.getBalance(chain),
    onSuccess: (data, chain) => {
      queryClient.setQueryData(['balance', chain], data);
    },
  });
}

export function useInitializeWallet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (seedPhrase?: string) => walletAPI.initialize(seedPhrase),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['account'] });
    },
  });
}

export function useWalletAccount(chain: string, index: number, enabled: boolean = true) {
  return useQuery({
    queryKey: ['account', chain, index],
    queryFn: () => walletAPI.getAccount(chain, index),
    enabled,
    staleTime: Infinity, // Account addresses don't change
  });
}

