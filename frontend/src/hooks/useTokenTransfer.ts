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
    onSuccess: async (data) => {
      console.log('✅ [useTokenTransfer] Token transfer successful, hash:', data.hash);
      
      // Invalidate balance queries to refresh after transfer
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({
        queryKey: ['token', 'balance', data.tokenAddress],
      });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Wait a bit for transaction to appear on blockchain, then refetch with retries
      const retryRefetch = async (attempts = 5, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`🔄 [useTokenTransfer] Refetching transaction history (attempt ${i + 1}/${attempts})`);
          try {
            await queryClient.refetchQueries({ queryKey: ['transactions'] });
            console.log('✅ [useTokenTransfer] Transaction history refetched');
          } catch (error) {
            console.warn(`⚠️ [useTokenTransfer] Refetch attempt ${i + 1} failed:`, error);
          }
        }
      };
      
      retryRefetch().catch(err => console.error('Retry refetch error:', err));
    },
  });
}

