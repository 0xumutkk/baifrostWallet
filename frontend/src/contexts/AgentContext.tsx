import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useConversation } from '@elevenlabs/react';
import { walletAPI } from '../services/api';
import { useWdk } from './WdkContext';
import * as contactService from '../services/contactService';

// Agent ID from plan
const AGENT_ID = 'agent_3801kb9v9kkzfg5t4n7fw780qram';

// Types for pending transactions
export interface PendingTransfer {
  type: 'transfer';
  toAddress: string;
  amount: string;
  token: string;
  tokenAddress?: string;
  decimals?: number;
  chain: string;
}

export interface PendingSwap {
  type: 'swap';
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}

export type PendingTransaction = PendingTransfer | PendingSwap;

// Re-export interfaces for convenience
export type { PendingTransfer, PendingSwap };

interface AgentContextType {
  // Connection state
  status: 'connected' | 'disconnected' | 'connecting';
  isSpeaking: boolean;
  conversationId: string | null;
  
  // Messages
  messages: Array<{
    role: 'user' | 'agent' | 'system';
    content: string;
    timestamp: Date;
  }>;
  
  // Pending transaction awaiting approval
  pendingTransaction: PendingTransaction | null;
  
  // Methods
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
  sendUserMessage: (message: string) => void;
  approveTransaction: (txHash?: string, chain?: string) => Promise<void>;
  rejectTransaction: () => void;
  
  // Microphone state
  micMuted: boolean;
  setMicMuted: (muted: boolean) => void;
}

const AgentContext = createContext<AgentContextType | undefined>(undefined);

export const AgentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, balance, refreshBalance } = useWdk();
  const [messages, setMessages] = useState<AgentContextType['messages']>([]);
  const [pendingTransaction, setPendingTransaction] = useState<PendingTransaction | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [localStatus, setLocalStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  // Helper to add messages - defined early so it can be used in callbacks
  const addMessage = useCallback((role: 'user' | 'agent' | 'system', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  }, []);

  // Initialize conversation hook
  const conversation = useConversation({
    micMuted,
    onConnect: () => {
      console.log('🤖 [Agent] Connected to ElevenLabs');
      setLocalStatus('connected');
    },
    onDisconnect: () => {
      console.log('🤖 [Agent] Disconnected from ElevenLabs');
      setLocalStatus('disconnected');
    },
    onMessage: (message) => {
      console.log('🤖 [Agent] Message received:', message);
      if (message.type === 'transcription' && message.text) {
        addMessage('user', message.text);
      } else if (message.type === 'response' && message.text) {
        addMessage('agent', message.text);
      }
    },
    onError: (error) => {
      console.error('🤖 [Agent] Error:', error);
      addMessage('system', `Error: ${error.message || 'Unknown error'}`);
    },
    onModeChange: (mode) => {
      console.log('🤖 [Agent] Mode changed:', mode);
    },
    onStatusChange: (status) => {
      console.log('🤖 [Agent] Status changed:', status);
    },
    onUnhandledClientToolCall: async (toolCall) => {
      console.log('🤖 [Agent] Unhandled tool call:', toolCall);
      // This should not happen if tools are properly defined
      addMessage('system', `Unhandled tool call: ${toolCall.name}`);
    },
    // Client tools definition
    clientTools: {
      get_balance: async (parameters: { token?: string }) => {
        try {
          console.log('🔧 [Agent Tool] get_balance called with:', parameters);
          
          if (parameters.token && parameters.token !== 'ETH' && parameters.token !== 'native') {
            // Token balance - would need token address lookup
            // For now, return message that token balance is not yet supported
            return `Token balance for ${parameters.token} is not yet available. Please use ETH balance.`;
          }
          
          // Get ETH balance
          const balanceResult = await walletAPI.getBalance('ethereum');
          const balanceValue = parseFloat(balanceResult.balance || '0');
          const formattedBalance = balanceValue.toFixed(4);
          
          addMessage('system', `Balance checked: ${formattedBalance} ETH`);
          return `Your current balance is ${formattedBalance} ETH.`;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to get balance';
          console.error('❌ [Agent Tool] get_balance error:', errorMsg);
          return `Failed to get balance: ${errorMsg}`;
        }
      },
      
      prepare_transfer: async (parameters: {
        recipient_identifier: string;
        amount: number;
        token?: string;
      }) => {
        try {
          console.log('🔧 [Agent Tool] prepare_transfer called with:', parameters);
          
          const { recipient_identifier, amount, token = 'ETH' } = parameters;
          
          let resolvedAddress: string;
          let resolvedChain: string = 'ethereum';
          let contactName: string | null = null;
          
          // Check if recipient_identifier is an address or a name
          if (recipient_identifier.startsWith('0x') && recipient_identifier.length === 42) {
            // It's an address
            resolvedAddress = recipient_identifier;
            
            // Try to find contact name for this address
            const contact = await contactService.getContactByAddress(resolvedAddress);
            if (contact) {
              contactName = contact.name;
            }
          } else {
            // It's a name - try to resolve it
            console.log('🔍 [Agent Tool] Resolving name to address:', recipient_identifier);
            const resolved = await contactService.resolveNameToAddress(recipient_identifier);
            
            if (!resolved) {
              // Check if there are multiple matches
              const matches = await contactService.getContactsByName(recipient_identifier);
              
              if (matches.length === 0) {
                return `No contact found with name "${recipient_identifier}". Please add the contact first or provide a valid Ethereum address.`;
              }
              
              if (matches.length > 1) {
                // Multiple matches - return list for user selection
                const matchList = matches.map((c, i) => 
                  `${i + 1}. ${c.name} (${c.address.slice(0, 6)}...${c.address.slice(-4)})`
                ).join('\n');
                
                addMessage('system', `Multiple contacts found for "${recipient_identifier}":\n${matchList}`);
                return `Multiple contacts found with name "${recipient_identifier}":\n${matchList}\n\nPlease specify which one you want to send to, or provide the full address.`;
              }
              
              // Should not reach here, but handle it
              return `Could not resolve contact "${recipient_identifier}". Please check the name or provide a valid address.`;
            }
            
            resolvedAddress = resolved.address;
            resolvedChain = resolved.chain;
            contactName = resolved.contact.name;
            
            console.log('✅ [Agent Tool] Name resolved:', recipient_identifier, '->', resolvedAddress);
          }
          
          // Validate address format
          if (!resolvedAddress.startsWith('0x') || resolvedAddress.length !== 42) {
            return `Invalid recipient address format. Please provide a valid Ethereum address starting with 0x.`;
          }
          
          // Check balance if transferring ETH
          if (token === 'ETH' || token === 'native') {
            const currentBalance = parseFloat(balance || '0');
            if (amount > currentBalance) {
              return `Insufficient balance. You have ${currentBalance.toFixed(4)} ETH but trying to send ${amount} ETH.`;
            }
          }
          
          // Store pending transaction
          const pending: PendingTransfer = {
            type: 'transfer',
            toAddress: resolvedAddress,
            amount: amount.toString(),
            token: token,
            chain: resolvedChain,
          };
          
          setPendingTransaction(pending);
          
          const displayName = contactName ? `${contactName} (${resolvedAddress.slice(0, 6)}...${resolvedAddress.slice(-4)})` : resolvedAddress.slice(0, 6) + '...' + resolvedAddress.slice(-4);
          addMessage('system', `Transfer prepared: ${amount} ${token} to ${displayName}`);
          
          return `Transaction hazırlandı: ${amount} ${token} ${displayName} adresine gönderilecek. Ekranda görünen onay ekranını kontrol edip "Approve" butonuna tıklayarak işlemi gerçekleştirebilirsiniz. İşlem için onayınızı bekliyorum.`;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to prepare transfer';
          console.error('❌ [Agent Tool] prepare_transfer error:', errorMsg);
          return `Failed to prepare transfer: ${errorMsg}`;
        }
      },
      
      prepare_swap: async (parameters: {
        from_token: string;
        to_token: string;
        amount: number;
      }) => {
        try {
          console.log('🔧 [Agent Tool] prepare_swap called with:', parameters);
          
          const { from_token, to_token, amount } = parameters;
          
          // For now, we'll prepare the swap and store it
          // The actual quote will be fetched when approval screen is shown
          const pending: PendingSwap = {
            type: 'swap',
            fromToken: from_token === 'ETH' ? 'native' : from_token,
            toToken: to_token === 'ETH' ? 'native' : to_token,
            amount: amount.toString(),
            slippage: 0.5, // Default slippage
          };
          
          setPendingTransaction(pending);
          addMessage('system', `Swap prepared: ${amount} ${from_token} to ${to_token}`);
          
          return `Swap işlemi hazırlandı: ${amount} ${from_token} ${to_token} ile değiştirilecek. Ekranda görünen onay ekranını kontrol edip "Approve" butonuna tıklayarak işlemi gerçekleştirebilirsiniz. İşlem için onayınızı bekliyorum.`;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to prepare swap';
          console.error('❌ [Agent Tool] prepare_swap error:', errorMsg);
          return `Failed to prepare swap: ${errorMsg}`;
        }
      },
      
      get_transaction_history: async (parameters: { limit?: number }) => {
        try {
          console.log('🔧 [Agent Tool] get_transaction_history called with:', parameters);
          
          if (!address) {
            return 'Wallet address not available. Please unlock your wallet first.';
          }
          
          const limit = parameters.limit || 10;
          const transactionsResult = await walletAPI.getTransactions('ethereum', address);
          const transactions = transactionsResult.transactions || [];
          const displayCount = Math.min(limit, transactions.length);
          
          if (transactions.length === 0) {
            return 'You have no transaction history yet.';
          }
          
          // Format transactions for display
          const formatted = transactions.slice(0, displayCount).map((tx: any, index: number) => {
            const date = new Date(tx.timestamp * 1000).toLocaleDateString();
            const direction = tx.to.toLowerCase() === address.toLowerCase() ? 'Received' : 'Sent';
            return `${index + 1}. ${direction} ${tx.value} ETH on ${date}`;
          }).join('\n');
          
          addMessage('system', `Transaction history retrieved: ${displayCount} transactions`);
          return `Here are your recent ${displayCount} transactions:\n\n${formatted}`;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Failed to get transaction history';
          console.error('❌ [Agent Tool] get_transaction_history error:', errorMsg);
          return `Failed to get transaction history: ${errorMsg}`;
        }
      },
      
      schedule_transfer: async (parameters: {
        condition: string;
        recipient_identifier: string;
        amount: number;
        token?: string;
      }) => {
        // Mock implementation - just show notification
        console.log('🔧 [Agent Tool] schedule_transfer called (MOCK):', parameters);
        addMessage('system', `Scheduled transfer created (mock): ${parameters.amount} ${parameters.token || 'ETH'} to ${parameters.recipient_identifier} when ${parameters.condition}`);
        return `Transaction scheduling is not yet implemented. This is a mock response.`;
      },
      
      create_automation: async (parameters: {
        frequency: string;
        action_type: string;
        amount: number;
        token?: string;
      }) => {
        // Mock implementation - just show notification
        console.log('🔧 [Agent Tool] create_automation called (MOCK):', parameters);
        addMessage('system', `Automation created (mock): ${parameters.action_type} ${parameters.amount} ${parameters.token || 'ETH'} ${parameters.frequency}`);
        return `Automation creation is not yet implemented. This is a mock response.`;
      },
    },
  });

  // Use status from conversation hook, with local state as fallback
  const conversationStatus = conversation.status || 'disconnected';
  const status = conversationStatus === 'connected' ? 'connected' : conversationStatus === 'connecting' ? 'connecting' : localStatus;

  // Start conversation session
  const startSession = useCallback(async () => {
    try {
      console.log('🤖 [Agent] Starting session...');
      setLocalStatus('connecting');
      
      // Request microphone permission first
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('🎤 [Agent] Microphone permission granted');
      } catch (micError) {
        console.error('❌ [Agent] Microphone permission denied:', micError);
        addMessage('system', 'Microphone permission is required for voice interaction. Please allow microphone access.');
        setLocalStatus('disconnected');
        return;
      }
      
      // Start conversation with agent ID
      const id = await conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'websocket',
      });
      
      setConversationId(id);
      console.log('🤖 [Agent] Session started with ID:', id);
      addMessage('system', 'Connected to heima. How can I help you?');
    } catch (error) {
      console.error('❌ [Agent] Failed to start session:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to start session';
      addMessage('system', `Failed to connect: ${errorMsg}`);
      setLocalStatus('disconnected');
    }
  }, [conversation, addMessage]);

  // End conversation session
  const endSession = useCallback(async () => {
    try {
      console.log('🤖 [Agent] Ending session...');
      await conversation.endSession();
      setConversationId(null);
      setMessages([]);
      setPendingTransaction(null);
      setLocalStatus('disconnected');
    } catch (error) {
      console.error('❌ [Agent] Failed to end session:', error);
    }
  }, [conversation]);

  // Send user message
  const sendUserMessage = useCallback((message: string) => {
    if (conversation.sendUserMessage) {
      conversation.sendUserMessage(message);
      addMessage('user', message);
    }
  }, [conversation, addMessage]);

  // Approve pending transaction
  // Note: Actual execution is handled by TransactionApproval component
  // This function just clears the pending transaction and notifies the agent
  const approveTransaction = useCallback(async (txHash?: string, chain: string = 'ethereum') => {
    if (!pendingTransaction) return;
    
    // The actual transaction execution is handled by TransactionApproval component
    // This function is called after successful execution
    setPendingTransaction(null);
    
    // Get explorer URL based on chain
    const getExplorerUrl = (hash: string, chainType: string) => {
      if (chainType === 'ethereum') {
        return `https://sepolia.etherscan.io/tx/${hash}`;
      } else if (chainType === 'bitcoin') {
        return `https://blockstream.info/testnet/tx/${hash}`;
      }
      return `#`;
    };
    
    if (txHash) {
      const explorerUrl = getExplorerUrl(txHash, chain);
      const successMessage = `✅ Transaction başarıyla gerçekleştirildi!\n\nTransaction Hash: ${txHash}\n\nBlock Explorer: ${explorerUrl}`;
      
      addMessage('system', successMessage);
      
      // Notify agent with hash and explorer link
      if (conversation.sendUserMessage) {
        conversation.sendUserMessage(`Transaction başarıyla gerçekleştirildi. Hash: ${txHash}. Block explorer'da görüntüleyebilirsiniz: ${explorerUrl}`);
      }
    } else {
      addMessage('system', 'Transaction approved and executed successfully.');
      // Notify agent
      if (conversation.sendUserMessage) {
        conversation.sendUserMessage('Transaction approved and executed successfully.');
      }
    }
  }, [pendingTransaction, addMessage, conversation]);

  // Reject pending transaction
  const rejectTransaction = useCallback(() => {
    if (pendingTransaction) {
      addMessage('system', 'Transaction rejected by user.');
      setPendingTransaction(null);
      sendUserMessage('Transaction rejected.');
    }
  }, [pendingTransaction, addMessage, sendUserMessage]);

  const value: AgentContextType = {
    status,
    isSpeaking: conversation.isSpeaking || false,
    conversationId,
    messages,
    pendingTransaction,
    startSession,
    endSession,
    sendUserMessage,
    approveTransaction,
    rejectTransaction,
    micMuted,
    setMicMuted,
  };

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
};

export const useAgent = () => {
  const context = useContext(AgentContext);
  if (context === undefined) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
};

