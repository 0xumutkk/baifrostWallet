import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

/**
 * Get ERC-20 token balance
 */
export function useTokenBalance(
  tokenAddress: string | null,
  holderAddress: string | null,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['token', 'balance', tokenAddress, holderAddress],
    queryFn: () => {
      if (!tokenAddress) {
        throw new Error('Token address is required');
      }
      return walletAPI.getTokenBalance(
        tokenAddress,
        holderAddress || undefined
      );
    },
    enabled: enabled && !!tokenAddress,
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get list of supported tokens
 */
export function useTokenList(chain: string = 'ethereum') {
  return useQuery({
    queryKey: ['tokens', 'list', chain],
    queryFn: () => walletAPI.getTokenList(chain),
    staleTime: 5 * 60 * 1000, // 5 minutes - token list doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Transfer ERC-20 token mutation
 */
export function useTokenTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      tokenAddress,
      toAddress,
      amount,
      decimals = 18,
    }: {
      tokenAddress: string;
      toAddress: string;
      amount: string;
      decimals?: number;
    }) => walletAPI.tokenTransfer(tokenAddress, toAddress, amount, decimals),
    onSuccess: (data) => {
      // Invalidate balance queries to refresh after transfer
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({
        queryKey: ['token', 'balance', data.tokenAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

