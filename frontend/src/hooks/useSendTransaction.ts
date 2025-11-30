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
    onSuccess: async (data) => {
      console.log('✅ [useSendTransaction] Transaction successful, hash:', data.hash);
      
      // Invalidate balance and transaction queries
      queryClient.invalidateQueries({ queryKey: ['balance'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Wait a bit for transaction to appear on blockchain, then refetch with retries
      // Etherscan API may take a few seconds to index the new transaction
      const retryRefetch = async (attempts = 5, delay = 2000) => {
        for (let i = 0; i < attempts; i++) {
          await new Promise(resolve => setTimeout(resolve, delay));
          console.log(`🔄 [useSendTransaction] Refetching transaction history (attempt ${i + 1}/${attempts})`);
          try {
            // Refetch all transaction queries
            await queryClient.refetchQueries({ queryKey: ['transactions'] });
            console.log('✅ [useSendTransaction] Transaction history refetched');
          } catch (error) {
            console.warn(`⚠️ [useSendTransaction] Refetch attempt ${i + 1} failed:`, error);
          }
        }
      };
      
      // Start retry mechanism (don't await - let it run in background)
      retryRefetch().catch(err => console.error('Retry refetch error:', err));
    },
  });
}

