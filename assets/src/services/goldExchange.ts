/**
 * API service for Gold Exchange operations
 */
import type {
  Quote,
  BuyInitiateResponse,
  BuyConfirmResponse,
  SellInitiateResponse,
  SellConfirmResponse,
  BalanceResponse,
  PriceResponse,
  ApiError,
} from '@/types/goldExchange';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const API_PREFIX = '/api/v1/gold';

class GoldExchangeService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}${API_PREFIX}`;
  }

  private getCsrfToken(): string | null {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(name + '=')) {
        return trimmed.substring(name.length + 1);
      }
    }
    return null;
  }

  private async ensureCsrfToken(): Promise<string | null> {
    let token = this.getCsrfToken();
    if (!token) {
      try {
        const response = await fetch('/api/v1/csrf_token/', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          return data.csrfToken;
        }
      } catch (e) {
        console.warn('Failed to fetch CSRF token:', e);
      }
    }
    return token;
  }

  /**
   * Get a quote for buying/selling gold tokens
   * @param amount - Amount to exchange
   * @param action - 'buy' or 'sell'
   * @param amountType - 'usd' or 'sol' (defaults to 'sol' for backwards compatibility)
   */
  async getQuote(
    amount: number,
    action: 'buy' | 'sell' = 'buy',
    amountType: 'usd' | 'sol' = 'sol'
  ): Promise<Quote> {
    const csrfToken = await this.ensureCsrfToken();

    // Build request body based on amount type
    const requestBody = amountType === 'usd'
      ? { usd_amount: amount.toString(), action }
      : { sol_amount: amount.toString(), action };

    const response = await fetch(`${this.baseUrl}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to get quote');
    }

    return response.json();
  }

  /**
   * Initiate a buy transaction
   */
  async initiateBuy(
    walletAddress: string,
    quoteId: string
  ): Promise<BuyInitiateResponse> {
    const csrfToken = await this.ensureCsrfToken();
    const response = await fetch(`${this.baseUrl}/buy/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        wallet_address: walletAddress,
        quote_id: quoteId,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to initiate buy');
    }

    return response.json();
  }

  /**
   * Confirm buy transaction with transaction signature
   */
  async confirmBuy(
    exchangeId: number,
    txSignature: string
  ): Promise<BuyConfirmResponse> {
    const csrfToken = await this.ensureCsrfToken();
    const response = await fetch(`${this.baseUrl}/buy/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        exchange_id: exchangeId,
        tx_signature: txSignature,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to confirm buy');
    }

    return response.json();
  }

  /**
   * Initiate a sell transaction
   */
  async initiateSell(
    walletAddress: string,
    quoteId: string
  ): Promise<SellInitiateResponse> {
    const csrfToken = await this.ensureCsrfToken();
    const response = await fetch(`${this.baseUrl}/sell/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        wallet_address: walletAddress,
        quote_id: quoteId,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to initiate sell');
    }

    return response.json();
  }

  /**
   * Confirm sell transaction with transaction signature
   */
  async confirmSell(
    exchangeId: number,
    txSignature: string
  ): Promise<SellConfirmResponse> {
    const csrfToken = await this.ensureCsrfToken();
    const response = await fetch(`${this.baseUrl}/sell/confirm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken || '',
      },
      credentials: 'include',
      body: JSON.stringify({
        exchange_id: exchangeId,
        tx_signature: txSignature,
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to confirm sell');
    }

    return response.json();
  }

  /**
   * Get user's sGOLD balance and transaction history
   */
  async getBalance(walletAddress: string): Promise<BalanceResponse> {
    const response = await fetch(`${this.baseUrl}/balance/${walletAddress}`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to get balance');
    }

    return response.json();
  }

  /**
   * Get current gold and SOL prices
   */
  async getCurrentPrices(): Promise<PriceResponse> {
    const response = await fetch(`${this.baseUrl}/price`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to get prices');
    }

    return response.json();
  }
}

// Export singleton instance
export const goldExchangeService = new GoldExchangeService();
