import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

export function useSendTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chain,
      toAddress,
      amount,
      tokenAddress,
      decimals = 18,
    }: {
      chain: string;
      toAddress: string;
      amount: string;
      tokenAddress?: string; // 'native' for ETH, or ERC-20 address
      decimals?: number;
    }) => {
      if (tokenAddress && tokenAddress !== 'native') {
        // ERC-20 token transfer
        return walletAPI.tokenTransfer(tokenAddress, toAddress, amount, decimals);
      } else {
        // Native ETH transfer - use direct RPC method (toAddress, amount)
        return walletAPI.sendTransaction(chain, undefined, toAddress, amount);
      }
    },
    onSuccess: () => {
      // Invalidate balance and transaction queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

