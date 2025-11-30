import React from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import type { Transaction } from '../hooks/useTransactionHistory';
import { useWdk } from '../contexts/WdkContext';

interface TransactionListProps {
  chain?: string;
  limit?: number;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  chain = 'ethereum', 
  limit 
}) => {
  const { address } = useWdk();
  const { data, isLoading, error } = useTransactionHistory(chain, address || '', !!address);

  // Debug logging
  React.useEffect(() => {
    console.log('📜 [TransactionList] Render - address:', address, 'chain:', chain, 'isLoading:', isLoading, 'error:', error);
    if (data) {
      console.log('📜 [TransactionList] Data received:', data);
      console.log('📜 [TransactionList] Transactions count:', data.transactions?.length || 0);
    }
  }, [address, chain, isLoading, error, data]);

  // Format transaction hash for display
  const formatHash = (hash: string) => `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Get explorer URL
  const getExplorerUrl = (hash: string) => {
    if (chain === 'ethereum') {
      return `https://sepolia.etherscan.io/tx/${hash}`;
    }
    return '#';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-700/30 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    console.error('📜 [TransactionList] Error loading transactions:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-400 text-sm">Failed to load transactions</p>
        {process.env.NODE_ENV === 'development' && (
          <p className="text-red-300 text-xs mt-2">{error.message || String(error)}</p>
        )}
      </div>
    );
  }

  const transactions = data?.transactions || [];
  const displayTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div className="space-y-2">
      {displayTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No transactions yet</p>
        </div>
      ) : (
        displayTransactions.map((tx: Transaction) => (
          <motion.div
            key={tx.hash}
            whileHover={{ scale: 1.02 }}
            className="card-cyber p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {tx.to.toLowerCase() === address?.toLowerCase() ? (
                <ArrowDownLeft className="w-5 h-5 text-baifrost-teal" />
              ) : (
                <ArrowUpRight className="w-5 h-5 text-baifrost-orange" />
              )}
              <div>
                <p className="text-white font-medium">
                  {tx.to.toLowerCase() === address?.toLowerCase() ? 'Received' : 'Sent'}
                </p>
                <p className="text-sm text-gray-400">{formatHash(tx.hash)}</p>
                <p className="text-xs text-gray-500">{formatTime(tx.timestamp)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-white font-semibold">
                  {tx.value} {chain === 'ethereum' ? 'ETH' : 'BTC'}
                </p>
                {tx.status === 'pending' && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Clock className="w-3 h-3" />
                    <span>Pending</span>
                  </div>
                )}
                {tx.status === 'confirmed' && (
                  <div className="flex items-center gap-1 text-xs text-baifrost-teal">
                    <CheckCircle className="w-3 h-3" />
                    <span>Confirmed</span>
                  </div>
                )}
                {tx.status === 'failed' && (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="w-3 h-3" />
                    <span>Failed</span>
                  </div>
                )}
              </div>
              <a
                href={getExplorerUrl(tx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-baifrost-teal" />
              </a>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
};

