import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, User } from 'lucide-react';
import { useAgent } from '../contexts/AgentContext';
import { useSendTransaction } from '../hooks/useSendTransaction';
import { useSwapExecute, useSwapQuote } from '../hooks/useSwap';
import { useWdk } from '../contexts/WdkContext';
import * as contactService from '../services/contactService';
import type { Contact } from '../utils/secureStorage';

export const TransactionApproval: React.FC = () => {
  const { pendingTransaction, approveTransaction, rejectTransaction } = useAgent();
  const { address, balance, refreshBalance } = useWdk();
  const sendMutation = useSendTransaction();
  const swapMutation = useSwapExecute();
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [swapQuote, setSwapQuote] = useState<any>(null);
  const [contact, setContact] = useState<Contact | null>(null);

  // Fetch swap quote if this is a swap transaction
  const { data: quoteData, isLoading: quoteLoading } = useSwapQuote(
    pendingTransaction?.type === 'swap' ? pendingTransaction.fromToken : null,
    pendingTransaction?.type === 'swap' ? pendingTransaction.toToken : null,
    pendingTransaction?.type === 'swap' ? pendingTransaction.amount : null,
    0.5,
    pendingTransaction?.type === 'swap' ? true : false
  );

  useEffect(() => {
    if (pendingTransaction?.type === 'swap' && quoteData) {
      setSwapQuote(quoteData);
    }
  }, [pendingTransaction, quoteData]);

  // Load contact info for transfer transactions
  useEffect(() => {
    const loadContact = async () => {
      if (pendingTransaction?.type === 'transfer') {
        try {
          const contactData = await contactService.getContactByAddress(pendingTransaction.toAddress);
          setContact(contactData);
        } catch (error) {
          setContact(null);
        }
      } else {
        setContact(null);
      }
    };
    loadContact();
  }, [pendingTransaction]);

  if (!pendingTransaction) {
    return null;
  }

  const handleApprove = async () => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      let txHash: string | undefined;
      let chain: string = pendingTransaction.chain || 'ethereum';
      
      if (pendingTransaction.type === 'transfer') {
        // Execute transfer
        const result = await sendMutation.mutateAsync({
          chain: pendingTransaction.chain,
          toAddress: pendingTransaction.toAddress,
          amount: pendingTransaction.amount,
          tokenAddress: pendingTransaction.tokenAddress,
          decimals: pendingTransaction.decimals,
        });
        txHash = result.hash;
        chain = pendingTransaction.chain;
      } else if (pendingTransaction.type === 'swap') {
        // Execute swap
        const result = await swapMutation.mutateAsync({
          fromToken: pendingTransaction.fromToken,
          toToken: pendingTransaction.toToken,
          amount: pendingTransaction.amount,
          slippage: pendingTransaction.slippage,
        });
        txHash = result.hash;
        chain = 'ethereum'; // Swaps are on Ethereum
      }

      // Refresh balance
      await refreshBalance();
      
      // Call the agent's approve function with hash and chain
      await approveTransaction(txHash, chain);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to execute transaction';
      setExecutionError(errorMsg);
      console.error('Transaction execution error:', error);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReject = () => {
    rejectTransaction();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <AnimatePresence>
      {pendingTransaction && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleReject}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-baifrost-teal/30">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-baifrost rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {pendingTransaction.type === 'transfer' ? 'Approve Transfer' : 'Approve Swap'}
                    </h2>
                    <p className="text-sm text-gray-400">Review transaction details</p>
                  </div>
                </div>
                <button
                  onClick={handleReject}
                  className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isExecuting}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {pendingTransaction.type === 'transfer' && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">To</span>
                        <div className="text-right">
                          {contact ? (
                            <div className="flex items-center gap-2 justify-end">
                              <User className="w-4 h-4 text-baifrost-teal" />
                              <span className="text-white font-semibold">{contact.name}</span>
                            </div>
                          ) : null}
                          <span className="text-white font-mono text-sm">
                            {formatAddress(pendingTransaction.toAddress)}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Amount</span>
                        <span className="text-white font-semibold">
                          {pendingTransaction.amount} {pendingTransaction.token}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Network</span>
                        <span className="text-white">Ethereum Sepolia</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Your Balance</span>
                        <span className="text-white">
                          {balance ? parseFloat(balance).toFixed(4) : '0.0000'} ETH
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {pendingTransaction.type === 'swap' && (
                  <>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">From</span>
                        <span className="text-white font-semibold">
                          {pendingTransaction.amount} {pendingTransaction.fromToken === 'native' ? 'ETH' : pendingTransaction.fromToken}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">To</span>
                        <span className="text-white font-semibold">
                          {quoteLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : swapQuote?.quote?.amountOut ? (
                            `${swapQuote.quote.amountOut} ${pendingTransaction.toToken === 'native' ? 'ETH' : pendingTransaction.toToken}`
                          ) : (
                            'Calculating...'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Slippage</span>
                        <span className="text-white">{pendingTransaction.slippage}%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Network</span>
                        <span className="text-white">Ethereum Sepolia</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Error message */}
                {executionError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{executionError}</p>
                  </motion.div>
                )}

                {/* Warning */}
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-400 text-sm">
                    Please review the transaction details carefully before approving.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-6 border-t border-gray-700 flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={isExecuting}
                  className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={isExecuting || (pendingTransaction.type === 'swap' && quoteLoading)}
                  className="flex-1 px-4 py-3 bg-gradient-baifrost rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

