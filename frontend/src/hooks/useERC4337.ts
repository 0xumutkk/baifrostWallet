import { useMutation } from '@tanstack/react-query';
import { walletAPI } from '../services/api';

/**
 * Sign transaction with ERC-4337
 */
export function useSignWith4337() {
  return useMutation({
    mutationFn: (transaction: {
      to: string;
      value?: string;
      data?: string;
    }) => walletAPI.signWith4337(transaction),
  });
}

/**
 * Prepare ERC-4337 UserOperation
 */
export function usePrepare4337Transaction() {
  return useMutation({
    mutationFn: ({
      to,
      value,
      data,
    }: {
      to: string;
      value?: string;
      data?: string;
    }) => walletAPI.prepare4337Transaction(to, value, data),
  });
}

