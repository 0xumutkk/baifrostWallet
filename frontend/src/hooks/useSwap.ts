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
    onSuccess: () => {
      // Invalidate balance queries to refresh after swap
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['swap', 'quote'] });
    },
  });
}

