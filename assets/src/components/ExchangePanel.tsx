import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from './WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { Coins, Clock, AlertCircle, CheckCircle, ExternalLink, ArrowDown, Loader2 } from 'lucide-react';
import type { Quote, BuyInitiateResponse, SellInitiateResponse, BalanceResponse } from '@/types/goldExchange';
import { Transaction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { motion, AnimatePresence } from 'framer-motion';

type TransactionStatus = 'idle' | 'quoting' | 'initiating' | 'signing' | 'confirming' | 'success' | 'error';

export const ExchangePanel: React.FC = () => {
  const { publicKey, connected, signAndSendTransaction, connection } = useWallet();

  // Tab state
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');

  // Balance state
  const [balance, setBalance] = useState<BalanceResponse | null>(null);

  // Buy form state - Dollar-first approach
  const [dollarAmount, setDollarAmount] = useState<string>('');
  const [solAmount, setSolAmount] = useState<string>('');
  const [solPriceUsd, setSolPriceUsd] = useState<number>(0);

  // Sell form state - SOLGOLD-first approach
  const [sgoldSellAmount, setSgoldSellAmount] = useState<string>('');
  const [solReceiveAmount, setSolReceiveAmount] = useState<string>('');

  // Quote state
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Transaction state
  const [txStatus, setTxStatus] = useState<TransactionStatus>('idle');
  const [txError, setTxError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [sgoldMinted, setSgoldMinted] = useState<number | null>(null);
  const [sgoldBurned, setSgoldBurned] = useState<number | null>(null);
  const [solReceived, setSolReceived] = useState<number | null>(null);

  // Quote countdown
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch current prices (for SOL/USD conversion in UI display only)
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

  // Clear quote and errors when switching tabs
  useEffect(() => {
    setQuote(null);
    setQuoteError(null);
    setTimeRemaining(0);
  }, [activeTab]);

  // Auto-reset transaction status after success
  useEffect(() => {
    if (txStatus === 'success') {
      const timer = setTimeout(() => {
        setTxStatus('idle');
        setTxError(null);
        setSgoldMinted(null);
        setSgoldBurned(null);
        setSolReceived(null);
        setTxSignature(null);
      }, 5000); // Reset after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [txStatus]);

  // Handle dollar amount input - calculate SOL equivalent for display
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

  // Fetch quote with debounce - now accepts DOLLAR amounts to avoid price sync issues
  const fetchQuote = useCallback(async (dollarAmount: string) => {
    if (!dollarAmount || parseFloat(dollarAmount) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteError(null);
      // Send USD amount directly to backend to ensure price consistency
      const quoteData = await goldExchangeService.getQuote(parseFloat(dollarAmount), 'buy', 'usd');
      setQuote(quoteData);
      setTimeRemaining(quoteData.expires_in);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  // Debounced quote fetching - now uses dollar amount instead of SOL
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dollarAmount && connected) {
        fetchQuote(dollarAmount);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dollarAmount, connected, fetchQuote]);

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

      // Emit custom event to notify other components (like BalancePanel)
      window.dispatchEvent(new CustomEvent('balanceUpdate'));

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

  // Sell handlers
  const handleSgoldSellChange = (value: string) => {
    setSgoldSellAmount(value);
    // Calculate equivalent USD and SOL for display
    if (value && parseFloat(value) > 0) {
      const usdValue = parseFloat(value) * 10; // 1 SOLGOLD = $10
      setSolReceiveAmount(usdValue.toString());
    } else {
      setSolReceiveAmount('');
    }
  };

  const handleMaxSellAmount = () => {
    if (!balance) return;
    setSgoldSellAmount(balance.sgold_balance.toString());
    setSolReceiveAmount((balance.sgold_balance * 10).toString());
  };

  const handlePresetSgoldAmount = (sgold: number) => {
    setSgoldSellAmount(sgold.toString());
    const usdValue = sgold * 10;
    setSolReceiveAmount(usdValue.toString());
  };

  // Fetch sell quote
  const fetchSellQuote = useCallback(async (sgoldAmount: string) => {
    if (!sgoldAmount || parseFloat(sgoldAmount) <= 0) {
      setQuote(null);
      return;
    }

    try {
      setQuoteLoading(true);
      setQuoteError(null);
      // For sell: send USD amount (sgold * 10), rounded to 2 decimal places
      const usdAmount = parseFloat((parseFloat(sgoldAmount) * 10).toFixed(2));
      const quoteData = await goldExchangeService.getQuote(usdAmount, 'sell', 'usd');
      setQuote(quoteData);
      setTimeRemaining(quoteData.expires_in);
    } catch (err: any) {
      setQuoteError(err.message || 'Failed to get quote');
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, []);

  // Debounced sell quote fetching
  useEffect(() => {
    if (activeTab === 'sell') {
      const timer = setTimeout(() => {
        if (sgoldSellAmount && connected) {
          fetchSellQuote(sgoldSellAmount);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sgoldSellAmount, connected, fetchSellQuote, activeTab]);

  // Handle sell transaction
  const handleSell = async () => {
    if (!publicKey || !quote || !signAndSendTransaction) {
      setTxError('Missing wallet connection or quote');
      return;
    }

    try {
      setTxStatus('initiating');
      setTxError(null);

      // Step 1: Initiate sell - backend builds transaction
      const initiateResponse: SellInitiateResponse = await goldExchangeService.initiateSell(
        publicKey.toString(),
        quote.quote_id
      );

      setTxStatus('signing');

      // Step 2: Deserialize transaction from backend
      const txBuffer = Buffer.from(initiateResponse.serialized_transaction, 'base64');
      const transaction = Transaction.from(txBuffer);

      // Step 3: Sign and send transaction with Phantom
      const txSignature = await signAndSendTransaction(transaction);

      setTxStatus('confirming');

      // Step 4: Confirm with transaction signature
      const confirmResponse = await goldExchangeService.confirmSell(
        initiateResponse.exchange_id,
        txSignature
      );

      // Success
      setTxStatus('success');
      setTxSignature(confirmResponse.tx_signature);
      setSgoldBurned(confirmResponse.sgold_burned);
      setSolReceived(confirmResponse.sol_received);

      // Clear form
      setSgoldSellAmount('');
      setSolReceiveAmount('');

      // Refresh balance
      fetchBalance();

      // Emit custom event to notify other components (like BalancePanel)
      window.dispatchEvent(new CustomEvent('balanceUpdate'));

      // Clear quote after delay
      setTimeout(() => {
        setQuote(null);
      }, 100);

    } catch (err: any) {
      console.error('Sell transaction error:', err);
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

  const canBuy = connected && quote && !quoteLoading && txStatus === 'idle' && timeRemaining > 0 && activeTab === 'buy';
  const canSell = connected && quote && !quoteLoading && txStatus === 'idle' && timeRemaining > 0 && activeTab === 'sell';

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header with Tabs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Exchange SOLGOLD</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'buy'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Buy SOLGOLD
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex-1 py-2 px-4 rounded-md font-semibold text-sm transition-all ${
              activeTab === 'sell'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Sell SOLGOLD
          </button>
        </div>
      </div>

      {/* Sell Tab Content */}
      {activeTab === 'sell' && (
        <>
          {/* Success Message */}
          {txStatus === 'success' && sgoldBurned && solReceived && (
            <div className="mb-6 p-5 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-bold text-lg text-green-800 dark:text-green-200">
                    Success! You sold {sgoldBurned.toFixed(2)} SOLGOLD
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Received {solReceived.toFixed(4)} SOL ≈ {formatCurrency(solReceived * solPriceUsd)}
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

          {/* SOLGOLD Input Interface */}
          <div className="space-y-1">
            {/* Top Input: SOLGOLD Amount */}
            <div className="bg-muted/30 border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-muted-foreground">
                  You're selling
                </label>
                {balance && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {balance.sgold_balance.toFixed(2)} SOLGOLD available
                    </span>
                    <button
                      onClick={handleMaxSellAmount}
                      disabled={!connected || txStatus !== 'idle' || !balance}
                      className="px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      MAX
                    </button>
                  </div>
                )}
              </div>
              {/* SOLGOLD Input */}
              <div className="flex items-baseline gap-2 mb-1 overflow-hidden">
                <input
                  type="number"
                  value={sgoldSellAmount}
                  onChange={(e) => handleSgoldSellChange(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={!connected || txStatus !== 'idle'}
                  className="flex-1 min-w-0 bg-transparent border-none text-4xl font-bold text-foreground placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-lg font-medium text-muted-foreground flex-shrink-0">SOLGOLD</span>
              </div>
              {/* USD Value */}
              <div className="h-6 mb-3">
                {solReceiveAmount && parseFloat(solReceiveAmount) > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ≈ {formatCurrency(parseFloat(solReceiveAmount))} worth of gold
                  </p>
                ) : (
                  <p className="text-sm text-transparent">-</p>
                )}
              </div>
              {/* Preset SOLGOLD Amount Buttons */}
              <div className="flex gap-2">
                {[1, 2.5, 5, 10].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handlePresetSgoldAmount(amount)}
                    disabled={!connected || txStatus !== 'idle'}
                    className="flex-1 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground bg-background hover:bg-muted border border-border rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {amount} SG
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Output: SOL Received */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-5">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                You're receiving
              </label>
              <AnimatePresence mode="wait">
                {quoteLoading ? (
                  // Skeleton loader with spinner - maintains exact dimensions to prevent layout shift
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="relative space-y-3"
                  >
                    {/* Animated skeleton background */}
                    <div className="animate-pulse">
                      {/* SOL Amount & SOLGOLD Tokens skeleton */}
                      <div className="flex items-baseline justify-between gap-4">
                        <div>
                          <div className="h-9 w-40 bg-muted/50 rounded"></div>
                          <div className="h-3 w-24 bg-muted/30 rounded mt-1"></div>
                        </div>
                        <div className="text-right">
                          <div className="h-7 w-20 bg-muted/50 rounded ml-auto"></div>
                          <div className="h-3 w-20 bg-muted/30 rounded mt-1 ml-auto"></div>
                        </div>
                      </div>

                      {/* Fee info skeleton */}
                      <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                        <div className="h-3 w-36 bg-muted/40 rounded"></div>
                        <div className="h-3 w-24 bg-muted/40 rounded"></div>
                      </div>
                    </div>

                    {/* Loading spinner overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    </div>
                  </motion.div>
                ) : quote ? (
                  <motion.div
                    key="quote"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {/* SOL Amount & SOLGOLD Tokens - Horizontal Layout */}
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <div className="text-3xl font-bold text-foreground leading-none">
                          {parseFloat(quote.sol_amount).toFixed(4)} SOL
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          ≈ {formatCurrency(parseFloat(quote.sol_amount) * solPriceUsd)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {formatNumber(quote.sgold_amount)} SG
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          tokens sold
                        </div>
                      </div>
                    </div>
                    {/* Fee Info & SOL Price */}
                    <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                      <div className="text-muted-foreground">
                        No fees on redemption
                      </div>
                      <div className="text-right text-muted-foreground">
                        SOL: {formatCurrency(quote.sol_price_usd)}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  // Empty state - maintains same height to prevent shift
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <div>
                        <div className="text-3xl font-bold text-muted-foreground leading-none">0.0000 SOL</div>
                        <div className="text-xs text-transparent mt-1">placeholder</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-transparent">0.00 SG</div>
                        <div className="text-xs text-transparent mt-1">placeholder</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-border/30 text-center">
                      <div className="text-sm text-muted-foreground">Enter amount above</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quote Error */}
          {quoteError && !quoteLoading && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">{quoteError}</p>
            </div>
          )}

          {/* Sell Button */}
          {(canSell || txStatus !== 'idle') && (
            <>
              <button
                onClick={handleSell}
                disabled={!canSell || txStatus !== 'idle'}
                className="w-full mt-6 py-4 px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg rounded-lg shadow-sm hover:shadow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {txStatus === 'initiating' && 'Preparing transaction...'}
                {txStatus === 'signing' && 'Waiting for wallet approval...'}
                {txStatus === 'confirming' && 'Confirming on blockchain...'}
                {(txStatus === 'idle' || txStatus === 'error') && canSell && sgoldSellAmount && quote && `Sell ${parseFloat(sgoldSellAmount).toFixed(2)} SOLGOLD for ${parseFloat(quote.sol_amount).toFixed(4)} SOL`}
              </button>

              {/* Countdown */}
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
        </>
      )}

      {/* Buy Tab Content */}
      {activeTab === 'buy' && (
        <>
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
          <AnimatePresence mode="wait">
            {quoteLoading ? (
              // Skeleton loader with spinner - maintains exact dimensions to prevent layout shift
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative space-y-3"
              >
                {/* Animated skeleton background */}
                <div className="animate-pulse">
                  {/* Dollar Value & Gold Weight skeleton */}
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <div className="h-9 w-32 bg-muted/50 rounded"></div>
                      <div className="h-3 w-24 bg-muted/30 rounded mt-1"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-7 w-20 bg-muted/50 rounded ml-auto"></div>
                      <div className="h-3 w-24 bg-muted/30 rounded mt-1 ml-auto"></div>
                    </div>
                  </div>

                  {/* Token details skeleton */}
                  <div className="pt-3 border-t border-border/30 flex items-center justify-between text-xs">
                    <div className="h-3 w-28 bg-muted/40 rounded"></div>
                    <div className="text-right space-y-1">
                      <div className="h-3 w-32 bg-muted/40 rounded ml-auto"></div>
                      <div className="h-3 w-24 bg-muted/40 rounded ml-auto"></div>
                    </div>
                  </div>
                </div>

                {/* Loading spinner overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
              </motion.div>
            ) : quote ? (
              <motion.div
                key="quote"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="space-y-3"
              >
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
              </motion.div>
            ) : (
              // Empty state - maintains same height to prevent shift
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <div className="text-3xl font-bold text-muted-foreground leading-none">$0.00</div>
                    <div className="text-xs text-transparent mt-1">placeholder</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-transparent">0.00g</div>
                    <div className="text-xs text-transparent mt-1">placeholder</div>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/30 text-center">
                  <div className="text-sm text-muted-foreground">Enter an amount above</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
            {(txStatus === 'idle' || txStatus === 'error') && canBuy && dollarAmount && `Buy ${formatCurrency(parseFloat(quote!.sgold_amount) * 10)} of SOLGOLD`}
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
      </>
    )}
    </div>
  );
};
