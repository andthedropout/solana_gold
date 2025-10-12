/**
 * TypeScript interfaces for Gold Exchange API
 */

export interface Quote {
  quote_id: string;
  sol_amount: string;
  sgold_amount: string;
  gold_price_usd: string;
  sol_price_usd: string;
  fees: {
    treasury: number;
    profit: number;
    transaction: number;
    total_fee_sol: number;
    // Legacy fields (kept for backwards compatibility)
    dev_fund?: number;
  };
  net_sol_to_liquidity: string;
  exchange_rate: string;
  expires_in: number;
  expires_at: string;
}

export interface TransactionInstruction {
  type: string;
  from: string;
  to: string;
  amount_sol: number;
  description: string;
}

export interface BuyInitiateResponse {
  exchange_id: number;
  serialized_transaction: string;
  total_sol: number;
  expected_sgold: number;
  expires_at: string;
}

export interface BuyConfirmResponse {
  status: string;
  tx_signature: string;
  mint_tx_signature: string;
  sgold_minted: number;
  user_ata: string;
  message: string;
}

export interface GoldTransaction {
  id: number;
  user_wallet: string;
  transaction_type: 'buy' | 'sell';
  transaction_type_display: string;
  sol_amount: string;
  token_amount: string;
  gold_price_usd: string;
  sol_price_usd: string;
  fees_collected: string;
  treasury_fee: string;
  dev_fee: string;
  profit_fee: string;
  transaction_fee: string;
  tx_signature: string | null;
  user_token_account: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  status_display: string;
  status_message: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface BalanceResponse {
  wallet_address: string;
  sgold_balance: number;
  usd_value: number;
  sol_balance: number;
  recent_transactions: GoldTransaction[];
  system_initialized?: boolean;
}

export interface PriceResponse {
  gold_price_usd: number;
  sol_price_usd: number;
  sgold_value_sol?: number;
  sgold_rate: number;
  last_updated: string;
  system_initialized?: boolean;
}

export interface ApiError {
  error: string;
  detail?: string;
}
