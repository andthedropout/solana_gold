import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { ArrowDownUp, Clock, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import type { Quote, BuyInitiateResponse } from '@/types/goldExchange';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

type TransactionStatus = 'idle' | 'quoting' | 'initiating' | 'signing' | 'confirming' | 'success' | 'error';

export const ExchangePanel: React.FC = () => {
  const { publicKey, connected, signAndSendTransaction, connection } = useWallet();

  // Form state
  const [solAmount, setSolAmount] = useState<string>('');

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
      const quoteData = await goldExchangeService.getQuote(parseFloat(amount), 'buy');
      setQuote(quoteData);
      setTimeRemaining(quoteData.expires_in);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  // Debounced quote fetching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (solAmount && connected) {
        fetchQuote(solAmount);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [solAmount, connected, fetchQuote]);

  // Quote countdown timer
  useEffect(() => {
    if (quote && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setQuote(null);
            setQuoteError('Quote expired. Please enter amount again.');
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
    console.log('handleBuy called', { publicKey, quote, signAndSendTransaction });

    if (!publicKey || !quote || !signAndSendTransaction) {
      console.error('Missing required data:', { publicKey, quote, signAndSendTransaction });
      setTxError('Missing wallet connection or quote');
      return;
    }

    try {
      console.log('Starting buy transaction...');
      setTxStatus('initiating');
      setTxError(null);

      // Step 1: Initiate buy - backend builds complete transaction
      const initiateResponse: BuyInitiateResponse = await goldExchangeService.initiateBuy(
        publicKey.toString(),
        quote.quote_id
      );

      setTxStatus('signing');

      // Step 2: Deserialize transaction from backend
      const txBuffer = Buffer.from(initiateResponse.serialized_transaction, 'base64');
      const transaction = Transaction.from(txBuffer);

      // Step 3: Sign and send transaction with Phantom
      const txSignature = await signAndSendTransaction(transaction);
      console.log('Transaction signature from Phantom:', txSignature, 'Length:', txSignature.length);

      setTxStatus('confirming');

      // Step 4: Confirm with transaction signature
      const confirmResponse = await goldExchangeService.confirmBuy(
        initiateResponse.exchange_id,
        txSignature
      );

      // Success
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

  const canBuy = connected && quote && !quoteLoading && txStatus === 'idle' && timeRemaining > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <ArrowDownUp className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Exchange SOL for Gold</h2>
      </div>

      {/* Success Message */}
      {txStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-green-800 dark:text-green-200">
                Success! You received {sgoldMinted?.toFixed(2)} sGOLD tokens
              </p>
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-sm text-green-700 dark:text-green-300 hover:underline"
                >
                  View transaction
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
      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground mb-2">
          I want to spend
        </label>
        <div className="relative">
          <input
            type="number"
            value={solAmount}
            onChange={(e) => setSolAmount(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.1"
            disabled={!connected || txStatus !== 'idle'}
            className="w-full px-4 py-3 pr-16 bg-background border border-border rounded-lg text-lg font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            SOL
          </div>
        </div>
      </div>

      {/* Quote Loading */}
      {quoteLoading && (
        <div className="mb-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
            <span className="text-sm text-muted-foreground">Calculating...</span>
          </div>
        </div>
      )}

      {/* Quote Error */}
      {quoteError && !quoteLoading && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{quoteError}</p>
        </div>
      )}

      {/* Quote Display */}
      {quote && !quoteLoading && (
        <div className="mb-4">
          {/* You'll receive */}
          <div className="mb-4 p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">You'll receive</div>
            <div className="text-3xl font-bold text-foreground">
              {formatNumber(quote.sgold_amount)} <span className="text-xl text-muted-foreground">sGOLD</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              ≈ ${(parseFloat(quote.sgold_amount) * 10).toFixed(2)} worth of gold
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange rate</span>
              <span className="text-foreground font-medium">
                1 SOL = {formatNumber((parseFloat(quote.sgold_amount) / parseFloat(quote.sol_amount)).toString())} sGOLD
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total fees (5%)</span>
              <span className="text-foreground">{quote.fees.total_fee_sol.toFixed(4)} SOL</span>
            </div>
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 py-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={`text-sm font-medium ${
              timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
            }`}>
              Quote expires in {timeRemaining}s
            </span>
          </div>
        </div>
      )}

      {/* Buy Button */}
      <button
        onClick={handleBuy}
        disabled={!canBuy || txStatus !== 'idle'}
        className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {txStatus === 'initiating' && 'Preparing...'}
        {txStatus === 'signing' && 'Waiting for approval...'}
        {txStatus === 'confirming' && 'Confirming...'}
        {(txStatus === 'idle' || txStatus === 'error') && canBuy && `Exchange for ${formatNumber(quote.sgold_amount)} sGOLD`}
        {(txStatus === 'idle' || txStatus === 'error') && !canBuy && 'Enter amount to continue'}
      </button>
    </div>
  );
};
