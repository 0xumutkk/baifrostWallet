const API_BASE = '/api';

export interface InitializeResponse {
  success: boolean;
  message: string;
  seedPhrase?: string;
  accounts: {
    ethereum: {
      address: string;
    };
    bitcoin: {
      address: string;
    };
  };
}

export interface AccountResponse {
  success: boolean;
  chain: string;
  index: number;
  address: string;
}

export interface BalanceResponse {
  success: boolean;
  chain: string;
  address: string;
  balance: string;
}

export interface TransactionPrepareResponse {
  success: boolean;
  chain: string;
  transaction: any;
}

export interface TransactionSendResponse {
  success: boolean;
  chain: string;
  hash: string;
  fee: string;
}

export interface ErrorResponse {
  success: false;
  error: string;
}

export interface SwapQuoteResponse {
  success: boolean;
  quote: any;
  fromToken: string;
  toToken: string;
  amount: string;
  slippage: number;
}

export interface SwapExecuteResponse {
  success: boolean;
  hash: string;
  fee: string;
  transaction: any;
  fromToken: string;
  toToken: string;
  amount: string;
}

export interface TokenTransferResponse {
  success: boolean;
  hash: string;
  fee: string;
  tokenAddress: string;
  toAddress: string;
  amount: string;
}

export interface TokenBalanceResponse {
  success: boolean;
  tokenAddress: string;
  holderAddress: string;
  balance: string;
  message?: string;
}

export interface TokenListResponse {
  success: boolean;
  chain: string;
  tokens: Array<{
    address: string;
    symbol: string;
    name: string;
    decimals: number;
    chain: string;
  }>;
}

export interface ERC4337SignResponse {
  success: boolean;
  signedTransaction: any;
  userOp: any;
  message?: string;
}

export const walletAPI = {
  /**
   * Initialize wallet - create new or restore from seed
   */
  initialize: async (seedPhrase?: string): Promise<InitializeResponse> => {
    const response = await fetch(`${API_BASE}/wallet/initialize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seedPhrase }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to initialize wallet');
    }
    
    return response.json();
  },

  /**
   * Get account address for specific chain and index
   */
  getAccount: async (chain: string, index: number): Promise<AccountResponse> => {
    const response = await fetch(`${API_BASE}/wallet/account/${chain}/${index}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get account');
    }
    
    return response.json();
  },

  /**
   * Get balance for specific chain
   */
  getBalance: async (chain: string): Promise<BalanceResponse> => {
    const url = `${API_BASE}/wallet/balance/${chain}`;
    console.log(`🌐 [API] Fetching balance from: ${url}`);
    
    const response = await fetch(url, {
      credentials: 'include',
    });
    
    console.log(`🌐 [API] Response status: ${response.status} ${response.statusText}`);
    console.log(`🌐 [API] Response headers:`, {
      'content-type': response.headers.get('content-type'),
      'set-cookie': response.headers.get('set-cookie') ? 'present' : 'missing'
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      console.error(`❌ [API] Balance fetch error:`, error);
      throw new Error(error.error || 'Failed to get balance');
    }
    
    const data = await response.json();
    console.log(`✅ [API] Balance response:`, data);
    return data;
  },

  /**
   * Prepare transaction (does not broadcast)
   */
  prepareTransaction: async (
    chain: string,
    toAddress: string,
    amount: string
  ): Promise<TransactionPrepareResponse> => {
    const response = await fetch(`${API_BASE}/wallet/transaction/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, toAddress, amount }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to prepare transaction');
    }
    
    return response.json();
  },

  /**
   * Send transaction (broadcasts to network)
   * Supports both legacy format (transaction object) and new format (toAddress, amount)
   */
  sendTransaction: async (
    chain: string,
    transaction?: any,
    toAddress?: string,
    amount?: string
  ): Promise<TransactionSendResponse> => {
    const body: any = { chain };
    
    // If toAddress and amount are provided, use new direct RPC method
    if (toAddress && amount) {
      body.toAddress = toAddress;
      body.amount = amount;
    } else if (transaction) {
      // Legacy support: use transaction object
      body.transaction = transaction;
    } else {
      throw new Error('Either transaction object or toAddress+amount must be provided');
    }

    const response = await fetch(`${API_BASE}/wallet/transaction/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to send transaction');
    }
    
    return response.json();
  },

  /**
   * Get transaction history
   */
  getTransactions: async (chain: string, address: string): Promise<any> => {
    const response = await fetch(`${API_BASE}/wallet/transactions/${chain}/${address}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get transactions');
    }
    
    return response.json();
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<{ success: boolean; message: string }> => {
    const response = await fetch(`${API_BASE}/health`);
    return response.json();
  },

  /**
   * Get swap quote from Velora
   */
  swapQuote: async (
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number = 0.5
  ): Promise<SwapQuoteResponse> => {
    const response = await fetch(`${API_BASE}/swap/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromToken, toToken, amount, slippage }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get swap quote');
    }
    
    return response.json();
  },

  /**
   * Execute swap using Velora
   */
  swapExecute: async (
    fromToken: string,
    toToken: string,
    amount: string,
    slippage: number = 0.5
  ): Promise<SwapExecuteResponse> => {
    const response = await fetch(`${API_BASE}/swap/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fromToken, toToken, amount, slippage }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to execute swap');
    }
    
    return response.json();
  },

  /**
   * Transfer ERC-20 token
   */
  tokenTransfer: async (
    tokenAddress: string,
    toAddress: string,
    amount: string,
    decimals: number = 18
  ): Promise<TokenTransferResponse> => {
    const response = await fetch(`${API_BASE}/tokens/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenAddress, toAddress, amount, decimals }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to transfer token');
    }
    
    return response.json();
  },

  /**
   * Get ERC-20 token balance
   */
  getTokenBalance: async (
    tokenAddress: string,
    holderAddress?: string
  ): Promise<TokenBalanceResponse> => {
    const params = new URLSearchParams({ tokenAddress });
    if (holderAddress) {
      params.append('holderAddress', holderAddress);
    }
    
    const response = await fetch(`${API_BASE}/tokens/balance?${params}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get token balance');
    }
    
    return response.json();
  },

  /**
   * Get list of supported tokens
   */
  getTokenList: async (chain: string = 'ethereum'): Promise<TokenListResponse> => {
    const response = await fetch(`${API_BASE}/tokens/list?chain=${chain}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to get token list');
    }
    
    return response.json();
  },

  /**
   * Sign transaction for ERC-4337
   */
  signWith4337: async (transaction: {
    to: string;
    value?: string;
    data?: string;
  }): Promise<ERC4337SignResponse> => {
    const response = await fetch(`${API_BASE}/4337/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transaction }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to sign with ERC-4337');
    }
    
    return response.json();
  },

  /**
   * Prepare ERC-4337 UserOperation
   */
  prepare4337Transaction: async (
    to: string,
    value?: string,
    data?: string
  ): Promise<ERC4337SignResponse> => {
    const response = await fetch(`${API_BASE}/4337/prepare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, value, data }),
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error: ErrorResponse = await response.json();
      throw new Error(error.error || 'Failed to prepare ERC-4337 transaction');
    }
    
    return response.json();
  },
};

