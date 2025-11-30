import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  QrCode, 
  User, 
  Copy,
  Check,
  AlertCircle,
  Loader2,
  CheckCircle,
  ExternalLink,
  UserPlus,
  ChevronDown
} from 'lucide-react';
import { useWdk } from '../contexts/WdkContext';
import { useTokenList } from '../hooks/useTokenTransfer';
import { useSendTransaction } from '../hooks/useSendTransaction';
import { isValidEthereumAddress, isValidAmount, exceedsBalance } from '../utils/validation';
import * as contactService from '../services/contactService';
import type { Contact } from '../utils/secureStorage';

interface SendScreenProps {
  onBack: () => void;
}

export const SendScreen: React.FC<SendScreenProps> = ({ onBack }) => {
  const { address, balance, refreshBalance } = useWdk();
  const { data: tokenList } = useTokenList('ethereum');
  const sendMutation = useSendTransaction();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('native');
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  const [copied, setCopied] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Contact management state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [showContactSelector, setShowContactSelector] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Load contacts on mount
  useEffect(() => {
    loadContacts();
  }, []);

  // Check if current address matches a contact
  useEffect(() => {
    if (toAddress && isValidEthereumAddress(toAddress)) {
      checkContactForAddress(toAddress);
    } else {
      setCurrentContact(null);
    }
  }, [toAddress]);

  const loadContacts = async () => {
    try {
      const allContacts = await contactService.getAllContacts();
      // Sort by lastUsed (most recent first), then by name
      const sorted = allContacts.sort((a, b) => {
        const aLastUsed = a.lastUsed || 0;
        const bLastUsed = b.lastUsed || 0;
        if (bLastUsed !== aLastUsed) {
          return bLastUsed - aLastUsed;
        }
        return a.name.localeCompare(b.name);
      });
      setContacts(sorted);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    }
  };

  const checkContactForAddress = async (addr: string) => {
    try {
      const contact = await contactService.getContactByAddress(addr.toLowerCase());
      setCurrentContact(contact);
    } catch (error) {
      setCurrentContact(null);
    }
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSelectContact = (contact: Contact) => {
    setToAddress(contact.address);
    setCurrentContact(contact);
    setShowContactSelector(false);
    setContactSearchQuery('');
    // Update last used
    contactService.updateContactLastUsed(contact.id).then(() => loadContacts());
  };

  const handleSaveAsContact = async () => {
    if (!toAddress || !isValidEthereumAddress(toAddress) || !newContactName.trim()) {
      return;
    }

    try {
      await contactService.addContact(
        newContactName.trim(),
        toAddress.toLowerCase(),
        'ethereum'
      );
      await loadContacts();
      await checkContactForAddress(toAddress);
      setShowAddContactModal(false);
      setNewContactName('');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to save contact';
      setErrorMessage(errorMsg);
    }
  };

  const filteredContacts = contactSearchQuery
    ? contacts.filter(c => 
        c.name.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        c.address.toLowerCase().includes(contactSearchQuery.toLowerCase())
      )
    : contacts.slice(0, 5); // Show top 5 recent contacts

  // Validate inputs
  const validateInputs = (): boolean => {
    setValidationError(null);

    if (!toAddress.trim()) {
      setValidationError('Please enter a recipient address');
      return false;
    }

    if (!isValidEthereumAddress(toAddress.trim())) {
      setValidationError('Invalid Ethereum address format');
      return false;
    }

    if (!amount.trim()) {
      setValidationError('Please enter an amount');
      return false;
    }

    if (!isValidAmount(amount)) {
      setValidationError('Amount must be a positive number');
      return false;
    }

    // Check balance for native ETH
    if (selectedToken === 'native' && exceedsBalance(amount, balance)) {
      setValidationError('Insufficient balance');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);
    setValidationError(null);

    if (!validateInputs()) {
      return;
    }

    try {
      const result = await sendMutation.mutateAsync({
        chain: 'ethereum',
        toAddress: toAddress.trim(),
        amount: amount.trim(),
        tokenAddress: selectedToken === 'native' ? undefined : selectedToken,
        decimals: selectedTokenData?.decimals || 18,
      });

      // Show success message
      setSuccessMessage(`Transaction sent! Hash: ${result.hash?.slice(0, 10)}...`);
      
      // Refresh balance
      await refreshBalance();

      // Clear form after 3 seconds
      setTimeout(() => {
        setToAddress('');
        setAmount('');
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to send transaction';
      setErrorMessage(errorMsg);
      console.error('Send transaction error:', error);
    }
  };

  const selectedTokenData = selectedToken === 'native' 
    ? { symbol: 'ETH', decimals: 18, address: 'native' }
    : tokenList?.tokens.find(t => t.address === selectedToken);

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00';
    return parseFloat(bal).toFixed(4);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 pt-8 pb-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-baifrost-teal" />
          </motion.button>
          <h1 className="text-2xl font-bold text-white">Send</h1>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-cyber mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-baifrost rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Account 1</p>
                <p className="text-baifrost-teal text-sm font-medium">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'No address'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Balance</p>
              <p className="text-white font-semibold">
                {formatBalance(balance)} {selectedTokenData?.symbol || 'ETH'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* To Address Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="to-address-input" className="block text-sm font-medium text-gray-300">To</label>
            {toAddress && isValidEthereumAddress(toAddress) && !currentContact && (
              <button
                onClick={() => setShowAddContactModal(true)}
                className="text-xs text-baifrost-teal hover:text-baifrost-teal-light transition-colors flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                Save as Contact
              </button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="to-address-input"
              type="text"
              value={toAddress}
              onChange={(e) => {
                setToAddress(e.target.value);
                setValidationError(null);
              }}
              onFocus={() => {
                if (contacts.length > 0) {
                  setShowContactSelector(true);
                }
              }}
              placeholder="Search contact, address (0x), or ENS"
              className={`w-full pl-10 pr-24 py-3 bg-gray-800/50 border rounded-xl text-white placeholder-gray-500 focus:outline-none transition-colors ${
                toAddress && !isValidEthereumAddress(toAddress) ? 'border-red-500/60' : 'border-baifrost-teal/20 focus:border-baifrost-teal/60'
              }`}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              {currentContact && (
                <span className="text-xs text-baifrost-teal bg-baifrost-teal/10 px-2 py-1 rounded">
                  {currentContact.name}
                </span>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowContactSelector(!showContactSelector)}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <ChevronDown className={`w-4 h-4 text-baifrost-teal transition-transform ${showContactSelector ? 'rotate-180' : ''}`} />
              </motion.button>
            </div>
          </div>
          {currentContact && (
            <p className="mt-1 text-xs text-gray-400">
              Contact: {currentContact.name}
            </p>
          )}
          {validationError && validationError.includes('address') && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-xs mt-2"
            >
              {validationError}
            </motion.p>
          )}
          
          {/* Contact Selector Dropdown */}
          <AnimatePresence>
            {showContactSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card-cyber mt-2 max-h-64 overflow-y-auto"
              >
                <div className="mb-2">
                  <input
                    type="text"
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-baifrost-teal/60"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <div className="space-y-1">
                  {filteredContacts.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">No contacts found</p>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => handleSelectContact(contact)}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700/30 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-8 h-8 bg-baifrost-orange/20 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-baifrost-orange" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{contact.name}</p>
                          <p className="text-xs text-gray-400 truncate">{contact.address.slice(0, 6)}...{contact.address.slice(-4)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Amount Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="amount-input" className="block text-sm font-medium text-gray-300">Amount</label>
            <button
              onClick={() => setShowTokenSelector(!showTokenSelector)}
              className="text-sm text-baifrost-teal hover:text-baifrost-teal-light transition-colors flex items-center gap-1"
            >
              {selectedTokenData?.symbol || 'ETH'}
              <span className="text-gray-400">▼</span>
            </button>
          </div>

          {/* Token Selector */}
          <AnimatePresence>
            {showTokenSelector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="card-cyber mb-3 max-h-48 overflow-y-auto"
              >
                <div
                  onClick={() => {
                    setSelectedToken('native');
                    setShowTokenSelector(false);
                  }}
                  className="flex items-center gap-3 p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer"
                >
                  <div className="w-8 h-8 bg-gradient-baifrost rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-xs">ETH</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Ethereum</p>
                    <p className="text-xs text-gray-400">Native</p>
                  </div>
                  {selectedToken === 'native' && (
                    <Check className="w-5 h-5 text-baifrost-teal" />
                  )}
                </div>
                {tokenList?.tokens
                  .filter((t) => t.address !== 'native')
                  .map((token) => (
                    <div
                      key={token.address}
                      onClick={() => {
                        setSelectedToken(token.address);
                        setShowTokenSelector(false);
                      }}
                      className="flex items-center gap-3 p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer"
                    >
                      <div className="w-8 h-8 bg-baifrost-teal/20 rounded-full flex items-center justify-center">
                        <span className="text-baifrost-teal font-bold text-xs">
                          {token.symbol.slice(0, 3)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{token.name}</p>
                        <p className="text-xs text-gray-400">{token.symbol}</p>
                      </div>
                      {selectedToken === token.address && (
                        <Check className="w-5 h-5 text-baifrost-teal" />
                      )}
                    </div>
                  ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <input
              id="amount-input"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-4 bg-gray-800/50 border border-baifrost-teal/20 rounded-xl text-3xl font-bold text-white placeholder-gray-600 focus:outline-none focus:border-baifrost-teal/60 transition-colors"
            />
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
              <span className="text-gray-400 text-sm">$0.00</span>
              <button className="p-1 hover:bg-gray-700/50 rounded transition-colors">
                <span className="text-gray-400">↕</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Contacts */}
        {contacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Contacts</h3>
            <div className="space-y-2">
              {contacts.slice(0, 3).map((contact) => (
                <motion.div
                  key={contact.id}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleSelectContact(contact)}
                  className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 bg-baifrost-orange/20 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-baifrost-orange" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{contact.name}</p>
                    <p className="text-xs text-gray-400">{contact.address.slice(0, 6)}...{contact.address.slice(-4)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Add Contact Modal */}
        <AnimatePresence>
          {showAddContactModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddContactModal(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full border border-baifrost-teal/30 p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Save as Contact</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="contact-name-input-modal" className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                      <input
                        id="contact-name-input-modal"
                        type="text"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        placeholder="Enter contact name"
                        className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-baifrost-teal/60"
                        autoFocus
                      />
                    </div>
                    <div>
                      <label htmlFor="contact-address-input-modal" className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                      <input
                        id="contact-address-input-modal"
                        type="text"
                        value={toAddress}
                        disabled
                        className="w-full px-4 py-2 bg-gray-700/30 border border-gray-600 rounded-lg text-gray-400"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddContactModal(false);
                          setNewContactName('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAsContact}
                        disabled={!newContactName.trim()}
                        className="flex-1 px-4 py-2 bg-gradient-baifrost rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Validation Error */}
        <AnimatePresence>
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-2"
            >
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{validationError}</p>
            </motion.div>
          )}
        </AnimatePresence>

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
                {sendMutation.data?.hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${sendMutation.data.hash}`}
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

        {/* Send Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSend}
          disabled={
            !toAddress || 
            !amount || 
            !isValidAmount(amount) || 
            !isValidEthereumAddress(toAddress.trim()) ||
            sendMutation.isPending ||
            (selectedToken === 'native' && exceedsBalance(amount, balance))
          }
          className="w-full btn-primary py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {sendMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            `Send ${selectedTokenData?.symbol || 'ETH'}`
          )}
        </motion.button>
      </div>
    </div>
  );
};

