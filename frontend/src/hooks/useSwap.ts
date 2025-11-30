import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

/**
 * Get swap quote
 */
export function useSwapQuote(
  fromToken: string | null,
  toToken: string | null,
  amount: string | null,
  slippage: number = 0.5,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['swap', 'quote', fromToken, toToken, amount, slippage],
    queryFn: () => {
      if (!fromToken || !toToken || !amount) {
        throw new Error('Missing required parameters');
      }
      return walletAPI.swapQuote(fromToken, toToken, amount, slippage);
    },
    enabled: enabled && !!fromToken && !!toToken && !!amount && amount !== '0',
    staleTime: 10000, // 10 seconds - quotes change frequently
    gcTime: 30000, // 30 seconds
  });
}

/**
 * Execute swap mutation
 */
export function useSwapExecute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      fromToken,
      toToken,
      amount,
      slippage = 0.5,
    }: {
      fromToken: string;
      toToken: string;
      amount: string;
      slippage?: number;
    }) => walletAPI.swapExecute(fromToken, toToken, amount, slippage),
    onSuccess: async (data) => {
      console.log('✅ [useSwap] Swap successful, hash:', data.hash);
      
      // Invalidate balance queries to refresh after swap
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['swap', 'quote'] });
      // Invalidate transaction history to show new swap transaction
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Wait a bit for transaction to appear on blockchain, then refetch with retries
      const retryRefetch = async (attempts = 5, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`🔄 [useSwap] Refetching transaction history (attempt ${i + 1}/${attempts})`);
          try {
            await queryClient.refetchQueries({ queryKey: ['transactions'] });
            console.log('✅ [useSwap] Transaction history refetched');
          } catch (error) {
            console.warn(`⚠️ [useSwap] Refetch attempt ${i + 1} failed:`, error);
          }
        }
      };
      
      retryRefetch().catch(err => console.error('Retry refetch error:', err));
    },
  });
}

