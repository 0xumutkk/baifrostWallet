import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUpDown, Settings, AlertCircle, TrendingUp, CheckCircle, ExternalLink } from 'lucide-react';
import { useWdk } from '../contexts/WdkContext';
import { useTokenList } from '../hooks/useTokenTransfer';
import { useSwapQuote, useSwapExecute } from '../hooks/useSwap';

interface SwapScreenProps {
  onBack: () => void;
}

export const SwapScreen: React.FC<SwapScreenProps> = ({ onBack }) => {
  const { address, balance, refreshBalance } = useWdk();
  const { data: tokenList } = useTokenList('ethereum');
  const [fromToken, setFromToken] = useState('native');
  const [toToken, setToToken] = useState('');
  const [fromAmount, setFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSlippage, setShowSlippage] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: quote, isLoading: quoteLoading } = useSwapQuote(
    fromToken,
    toToken || null,
    fromAmount || null,
    slippage,
    !!fromToken && !!toToken && !!fromAmount && parseFloat(fromAmount) > 0
  );

  const swapMutation = useSwapExecute();

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const result = await swapMutation.mutateAsync({
        fromToken,
        toToken,
        amount: fromAmount,
        slippage,
      });

      // Show success message
      setSuccessMessage(`Swap successful! Transaction: ${result.hash?.slice(0, 10)}...`);

      // Refresh balance
      await refreshBalance();

      // Clear form after 3 seconds
      setTimeout(() => {
        setFromAmount('');
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to execute swap';
      setErrorMessage(errorMsg);
      console.error('Swap error:', error);
    }
  };

  const handleSwitchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount('');
  };

  const fromTokenData = fromToken === 'native'
    ? { symbol: 'ETH', decimals: 18, address: 'native', name: 'Ethereum' }
    : tokenList?.tokens.find(t => t.address === fromToken);

  const toTokenData = toToken === 'native'
    ? { symbol: 'ETH', decimals: 18, address: 'native', name: 'Ethereum' }
    : tokenList?.tokens.find(t => t.address === toToken);

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00';
    return parseFloat(bal).toFixed(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 pt-8 pb-4 max-w-md">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onBack}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-baifrost-teal" />
            </motion.button>
            <h1 className="text-2xl font-bold text-white">Swap</h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowSlippage(!showSlippage)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5 text-baifrost-teal" />
          </motion.button>
        </motion.div>

        {/* Slippage Settings */}
        {showSlippage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-cyber mb-4"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-3">Slippage Tolerance</h3>
            <div className="flex gap-2 mb-3">
              {[0.1, 0.5, 1.0, 3.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    slippage === val
                      ? 'bg-gradient-baifrost text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700/70'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
            <input
              type="number"
              value={slippage}
              onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-800/50 border border-baifrost-teal/20 rounded-lg text-white focus:outline-none focus:border-baifrost-teal/60"
              placeholder="Custom"
            />
          </motion.div>
        )}

        {/* From Token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="swap-from-amount-input" className="text-sm font-medium text-gray-300">From</label>
            <span className="text-xs text-gray-400">
              Balance: {fromToken === 'native' ? formatBalance(balance) : '0.00'} {fromTokenData?.symbol}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
              <div className="w-6 h-6 bg-gradient-baifrost rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">{fromTokenData?.symbol?.slice(0, 3) || 'ETH'}</span>
              </div>
              <span className="text-white font-medium">{fromTokenData?.symbol || 'ETH'}</span>
              <span className="text-gray-400">▼</span>
            </button>
            <div className="flex-1">
              <input
                id="swap-from-amount-input"
                type="text"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0.0"
                className="w-full px-3 py-2 bg-transparent text-2xl font-bold text-white placeholder-gray-600 focus:outline-none text-right"
              />
              <p className="text-xs text-gray-400 text-right mt-1">$0.00</p>
            </div>
          </div>
        </motion.div>

        {/* Swap Arrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center -my-2 relative z-10"
        >
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleSwitchTokens}
            className="p-3 bg-gray-800 border-2 border-baifrost-teal/30 rounded-full hover:border-baifrost-teal/60 transition-colors"
          >
            <ArrowUpDown className="w-5 h-5 text-baifrost-teal" />
          </motion.button>
        </motion.div>

        {/* To Token */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-cyber mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-300">To</span>
            <span className="text-xs text-gray-400">
              Balance: {toToken === 'native' ? formatBalance(balance) : '0.00'} {toTokenData?.symbol || 'Select'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
              <div className="w-6 h-6 bg-baifrost-teal/20 rounded-full flex items-center justify-center">
                <span className="text-baifrost-teal font-bold text-xs">{toTokenData?.symbol?.slice(0, 3) || '?'}</span>
              </div>
              <span className="text-white font-medium">{toTokenData?.symbol || 'Select Token'}</span>
              <span className="text-gray-400">▼</span>
            </button>
            <div id="swap-to-amount-display" className="flex-1">
              <div className="text-right">
                {quoteLoading ? (
                  <div className="h-8 bg-gray-700/30 rounded animate-pulse" />
                ) : quote ? (
                  <>
                    <p className="text-2xl font-bold text-white">
                      {quote.quote?.amountOut || '0.0'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">$0.00</p>
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-gray-600">0.0</p>
                    <p className="text-xs text-gray-500 mt-1">--</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quote Info */}
        {quote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card-cyber mb-4"
          >
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Price Impact</span>
                <span className="text-baifrost-teal">0.1%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Received</span>
                <span className="text-white">
                  {quote.quote?.amountOutMin || '0.0'} {toTokenData?.symbol}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fee</span>
                <span className="text-white">0.3%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-baifrost-teal/20 border border-baifrost-teal/50 rounded-lg flex items-start gap-2"
            >
              <CheckCircle className="w-5 h-5 text-baifrost-teal flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-baifrost-teal text-sm font-medium">{successMessage}</p>
                {swapMutation.data?.hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${swapMutation.data.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-baifrost-teal/80 hover:text-baifrost-teal flex items-center gap-1 mt-1"
                  >
                    View on Etherscan
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSwap}
          disabled={!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0 || swapMutation.isPending}
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {swapMutation.isPending ? 'Swapping...' : 'Swap'}
        </motion.button>
      </div>
    </div>
  );
};

