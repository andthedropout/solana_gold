import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { Coins, Clock, AlertCircle, CheckCircle, ExternalLink, ArrowDown } from 'lucide-react';
import type { Quote, BuyInitiateResponse, BalanceResponse } from '@/types/goldExchange';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';

type TransactionStatus = 'idle' | 'quoting' | 'initiating' | 'signing' | 'confirming' | 'success' | 'error';

export const ExchangePanel: React.FC = () => {
  const { publicKey, connected, signAndSendTransaction, connection } = useWallet();

  // Balance state
  const [balance, setBalance] = useState<BalanceResponse | null>(null);

  // Form state - Dollar-first approach
  const [dollarAmount, setDollarAmount] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('');
  const [solPriceUsd, setSolPriceUsd] = useState<number>(0);

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

  // Fetch current prices (for SOL/USD conversion)
  const fetchPrices = useCallback(async () => {
    try {
      const prices = await goldExchangeService.getCurrentPrices();
      setSolPriceUsd(prices.sol_price_usd);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  }, []);

  // Fetch balance
  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const data = await goldExchangeService.getBalance(publicKey.toString());
      setBalance(data);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, [publicKey]);

  useEffect(() => {
    fetchPrices();
    fetchBalance();
  }, [fetchPrices, fetchBalance]);

  // Handle dollar amount input - calculate SOL equivalent
  const handleDollarChange = (value: string) => {
    setDollarAmount(value);
    if (value && parseFloat(value) > 0 && solPriceUsd > 0) {
      const calculatedSol = parseFloat(value) / solPriceUsd;
      setSolAmount(calculatedSol.toFixed(6));
    } else {
      setSolAmount('');
    }
  };

  // Max button handler - use dollars
  const handleMaxAmount = () => {
    if (!balance || !solPriceUsd) return;
    // Reserve 0.01 SOL for transaction fees
    const maxSol = Math.max(0, balance.sol_balance - 0.01);
    const maxDollars = maxSol * solPriceUsd;
    setDollarAmount(maxDollars.toFixed(2));
    setSolAmount(maxSol.toFixed(6));
  };

  // Preset amount handlers - use dollar amounts
  const handlePresetDollarAmount = (dollars: number) => {
    setDollarAmount(dollars.toString());
    if (solPriceUsd > 0) {
      const calculatedSol = dollars / solPriceUsd;
      setSolAmount(calculatedSol.toFixed(6));
    }
  };

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
      // Clear form
      setDollarAmount('');
      setSolAmount('');

      // Refresh balance after successful transaction
      fetchBalance();

      // Clear quote after a delay to show success message
      setTimeout(() => {
        setQuote(null);
      }, 100);

    } catch (err: any) {
      console.error('Transaction error:', err);
      setTxStatus('error');
      setTxError(err.message || 'Transaction failed');
    }
  };

  // Formatting helpers
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

  // Calculate gold weight from SOLGOLD tokens and gold price
  const calculateGoldWeight = (sgoldAmount: number, goldPricePerOz: number) => {
    // 1 SOLGOLD ≈ $10 worth of gold (based on line 314: sgold_amount * 10)
    const goldValueUsd = sgoldAmount * 10;
    // Convert to grams (1 troy oz = 31.1035 grams)
    const gramsPerOz = 31.1035;
    const grams = (goldValueUsd / goldPricePerOz) * gramsPerOz;
    return grams;
  };

  const canBuy = connected && quote && !quoteLoading && txStatus === 'idle' && timeRemaining > 0;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Coins className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Buy Gold</h2>
      </div>

      {/* Success Message */}
      {txStatus === 'success' && sgoldMinted && quote && (
        <div className="mb-6 p-5 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-bold text-lg text-green-800 dark:text-green-200">
                Success! You purchased {formatCurrency(sgoldMinted * 10)} of gold
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                ≈ {calculateGoldWeight(sgoldMinted, parseFloat(quote.gold_price_usd)).toFixed(2)} grams • {sgoldMinted.toFixed(2)} SOLGOLD
              </p>
              {txSignature && (
                <a
                  href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                >
                  View transaction
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {txStatus === 'error' && txError && (
        <div className="mb-6 p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-4">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="font-bold text-lg text-red-800 dark:text-red-200">
                Transaction Failed
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {txError}
              </p>
              <button
                onClick={() => setTxStatus('idle')}
                className="text-sm font-semibold text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dollar-First Input Interface */}
      <div className="space-y-1">
        {/* Top Input: You're Spending (Dollar-First) */}
        <div className="bg-muted/30 border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-muted-foreground">
              You're spending
            </label>
            {balance && solPriceUsd > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {formatCurrency(balance.sol_balance * solPriceUsd)} available
                </span>
                <button
                  onClick={handleMaxAmount}
                  disabled={!connected || txStatus !== 'idle' || !balance}
                  className="px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  MAX
                </button>
              </div>
            )}
          </div>
          {/* Dollar Input - Primary with aligned symbols */}
          <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
            <span className="text-xl font-bold text-muted-foreground flex-shrink-0">$</span>
            <input
              type="number"
              value={dollarAmount}
              onChange={(e) => handleDollarChange(e.target.value)}
              placeholder="0.00"
              min="0"
              step="1"
              disabled={!connected || txStatus !== 'idle'}
              className="flex-1 min-w-0 bg-transparent border-none text-4xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-lg font-medium text-muted-foreground flex-shrink-0">USD</span>
          </div>
          {/* SOL Amount - Fixed Height (prevents layout shift) */}
          <div className="h-6 mb-3">
            {solAmount && parseFloat(solAmount) > 0 ? (
              <p className="text-sm text-muted-foreground">
                Using {parseFloat(solAmount).toFixed(4)} SOL from your wallet
              </p>
            ) : (
              <p className="text-sm text-transparent">-</p>
            )}
          </div>
          {/* Preset Dollar Amount Buttons - Larger & Better Spaced */}
          <div className="flex gap-2">
            {[12.50, 25, 50, 100].map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetDollarAmount(amount)}
                disabled={!connected || txStatus !== 'idle'}
                className="flex-1 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-background hover:bg-muted border border-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ${amount}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Output: You're Receiving (Dollar-First with Gold Weight) */}
        <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-5">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            You're receiving
          </label>
          {quoteLoading ? (
            <div className="text-2xl font-bold text-muted-foreground">Calculating...</div>
          ) : quote ? (
            <div className="space-y-3">
              {/* Dollar Value & Gold Weight - Horizontal Layout */}
              <div className="flex items-baseline justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold text-foreground leading-none">
                    {formatCurrency(parseFloat(quote.sgold_amount) * 10)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    worth of gold
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    ≈ {calculateGoldWeight(parseFloat(quote.sgold_amount), parseFloat(quote.gold_price_usd)).toFixed(2)}g
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    physical equiv.
                  </div>
                </div>
              </div>

              {/* Token Count & Exchange Details - Horizontal */}
              <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                <div className="text-muted-foreground">
                  {formatNumber(quote.sgold_amount)} SOLGOLD
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground">Gold: {formatCurrency(quote.gold_price_usd)}/oz</div>
                  <div className="text-muted-foreground">Fee: {formatCurrency(quote.fees.total_fee_sol * parseFloat(quote.sol_price_usd))}</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="text-3xl font-bold text-muted-foreground leading-none mb-2">$0.00</div>
              <div className="text-sm text-muted-foreground">Enter an amount above</div>
            </div>
          )}
        </div>
      </div>

      {/* Quote Error */}
      {quoteError && !quoteLoading && (
        <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{quoteError}</p>
        </div>
      )}

      {/* Buy Button - only show when there's a quote or transaction in progress */}
      {(canBuy || txStatus !== 'idle') && (
        <>
          <button
            onClick={handleBuy}
            disabled={!canBuy || txStatus !== 'idle'}
            className="w-full mt-6 py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {txStatus === 'initiating' && 'Preparing transaction...'}
            {txStatus === 'signing' && 'Waiting for wallet approval...'}
            {txStatus === 'confirming' && 'Confirming on blockchain...'}
            {(txStatus === 'idle' || txStatus === 'error') && canBuy && dollarAmount && `Buy ${formatCurrency(parseFloat(quote!.sgold_amount) * 10)} of Gold`}
          </button>

          {/* Countdown - Below Button */}
          {quote && txStatus === 'idle' && (
            <div className="flex items-center justify-center gap-2 py-2 mt-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className={`text-xs font-semibold ${
                timeRemaining <= 10 ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
              }`}>
                Expires in {timeRemaining}s
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
