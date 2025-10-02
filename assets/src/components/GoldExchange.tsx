import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { ArrowDownUp, Clock, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import type { Quote, BuyInitiateResponse } from '@/types/goldExchange';
import { Transaction } from '@solana/web3.js';

type TransactionStatus = 'idle' | 'quoting' | 'initiating' | 'signing' | 'confirming' | 'success' | 'error';

export const GoldExchange: React.FC = () => {
  const { publicKey, connected, signTransaction, connection } = useWallet();

  // Form state
  const [solAmount, setSolAmount] = useState<string>('');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');

  // Quote state
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Transaction state
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [sgoldMinted, setSgoldMinted] = useState<number | null>(null);

  // Quote countdown
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch quote with debounce
  const fetchQuote = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteError(null);
      const quoteData = await goldExchangeService.getQuote(parseFloat(amount), action);
      setQuote(quoteData);
      setTimeRemaining(quoteData.expires_in);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [action]);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (solAmount && connected) {
        fetchQuote(solAmount);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [solAmount, connected, fetchQuote]);

  // Quote countdown timer
  useEffect(() => {
    if (quote && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setQuote(null);
            setQuoteError('Quote expired. Please try again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [quote, timeRemaining]);

  // Handle buy transaction
  const handleBuy = async () => {
    if (!publicKey || !quote || !signTransaction) {
      return;
    }

    try {
      setTxStatus('initiating');
      setTxError(null);

      // Step 1: Initiate buy
      const initiateResponse: BuyInitiateResponse = await goldExchangeService.initiateBuy(
        publicKey.toString(),
        quote.quote_id
      );

      setTxStatus('signing');

      // Step 2: Build transaction from instructions
      const transaction = new Transaction();

      // Add transfer instructions
      for (const instruction of initiateResponse.transaction.instructions) {
        // Note: In production, you'd properly build SystemProgram.transfer instructions
        // For now, the backend needs to return a serialized transaction we can sign
      }

      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Step 3: Sign transaction with Phantom
      const signed = await signTransaction(transaction);

      setTxStatus('confirming');

      // Step 4: Submit signed transaction to backend
      const confirmResponse = await goldExchangeService.confirmBuy(
        initiateResponse.exchange_id,
        Buffer.from(signed.serialize()).toString('base64')
      );

      // Success!
      setTxStatus('success');
      setTxSignature(confirmResponse.tx_signature);
      setSgoldMinted(confirmResponse.sgold_minted);
      setQuote(null);
      setSolAmount('');

    } catch (err: any) {
      console.error('Transaction error:', err);
      setTxStatus('error');
      setTxError(err.message || 'Transaction failed');
    }
  };

  const formatNumber = (num: number | string) => {
    return parseFloat(num.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatCurrency = (num: number | string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parseFloat(num.toString()));
  };

  const canBuy = connected && quote && !quoteLoading && txStatus === 'idle' && timeRemaining > 0;

  const getStatusMessage = () => {
    switch (txStatus) {
      case 'initiating':
        return 'Preparing transaction...';
      case 'signing':
        return 'Waiting for signature...';
      case 'confirming':
        return 'Confirming transaction...';
      case 'success':
        return 'Transaction successful!';
      case 'error':
        return 'Transaction failed';
      default:
        return '';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowDownUp className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Exchange</h3>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setAction('buy')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            action === 'buy'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Buy sGOLD
        </button>
        <button
          onClick={() => setAction('sell')}
          disabled
          className="flex-1 py-2 px-4 rounded-md font-medium bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
          title="Sell functionality coming in V1.2"
        >
          Sell sGOLD
        </button>
      </div>

      {/* Success Message */}
      {txStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-200">
                Successfully purchased {sgoldMinted?.toFixed(2)} sGOLD!
              </p>
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-green-700 dark:text-green-300 hover:underline"
                >
                  View on Solana Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {txStatus === 'error' && txError && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-200">
                Transaction Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {txError}
              </p>
              <button
                onClick={() => setTxStatus('idle')}
                className="mt-2 text-sm text-red-700 dark:text-red-300 hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOL Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-foreground mb-2">
          Amount (SOL)
        </label>
        <input
          type="number"
          value={solAmount}
          onChange={(e) => setSolAmount(e.target.value)}
          placeholder="0.00"
          min="0"
          step="0.1"
          disabled={!connected || txStatus !== 'idle'}
          className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {!connected && (
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet to get started
          </p>
        )}
      </div>

      {/* Quote Display */}
      {quoteLoading && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm text-muted-foreground">Getting quote...</span>
          </div>
        </div>
      )}

      {quoteError && !quoteLoading && (
        <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{quoteError}</p>
        </div>
      )}

      {quote && !quoteLoading && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg space-y-3">
          {/* You'll receive */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">You'll receive</span>
            <span className="text-lg font-bold text-foreground">
              {formatNumber(quote.sgold_amount)} sGOLD
            </span>
          </div>

          {/* Exchange rate */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Exchange rate</span>
            <span className="text-sm text-foreground">
              1 SOL = {formatNumber((parseFloat(quote.sgold_amount) / parseFloat(quote.sol_amount)).toString())} sGOLD
            </span>
          </div>

          {/* Fees */}
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Treasury Fee (3%)</span>
              <span className="text-foreground">{quote.fees.treasury.toFixed(4)} SOL</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Dev Fund (2%)</span>
              <span className="text-foreground">{quote.fees.dev_fund.toFixed(4)} SOL</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2 font-medium">
              <span className="text-foreground">Total Fees</span>
              <span className="text-foreground">{quote.fees.total_fee_sol.toFixed(4)} SOL</span>
            </div>
          </div>

          {/* Prices */}
          <div className="pt-3 border-t border-border text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>Gold: {formatCurrency(quote.gold_price_usd)}/oz</span>
              <span>SOL: {formatCurrency(quote.sol_price_usd)}</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 pt-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-medium ${
              timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
            }`}>
              Expires in {timeRemaining}s
            </span>
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={!canBuy || txStatus !== 'idle'}
        className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {txStatus !== 'idle' && txStatus !== 'error' ? (
          <span className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full"></div>
            {getStatusMessage()}
          </span>
        ) : canBuy ? (
          `Buy ${formatNumber(quote.sgold_amount)} sGOLD for ${formatNumber(quote.sol_amount)} SOL`
        ) : (
          'Enter amount to get quote'
        )}
      </button>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
        <p className="text-xs text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> Quotes expire after 30 seconds to protect against price volatility.
          A new quote will be generated automatically when the current one expires.
        </p>
      </div>
    </div>
  );
};
