import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { RefreshCw, Coins, Wallet } from 'lucide-react';
import type { BalanceResponse, PriceResponse } from '@/types/goldExchange';

export const BalancePanel: React.FC = () => {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      setError(null);
      const data = await goldExchangeService.getBalance(publicKey.toString());
      setBalance(data);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError('Unable to load balance');
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  const fetchPrices = async () => {
    try {
      const data = await goldExchangeService.getCurrentPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update prices every minute

    // Listen for balance update events from ExchangePanel
    const handleBalanceUpdate = () => {
      fetchBalance();
    };
    window.addEventListener('balanceUpdate', handleBalanceUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('balanceUpdate', handleBalanceUpdate);
    };
  }, [publicKey, fetchBalance]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  if (!publicKey) return null;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Your Balances</h2>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
          title="Refresh balances"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && !balance && (
        <div className="flex items-center justify-center gap-2 py-8">
          <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-sm text-muted-foreground">Loading balances...</span>
        </div>
      )}

      {/* Balance Display */}
      {balance && (
        <div className="space-y-4">
          {/* SOLGOLD Balance */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Gold Tokens</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {formatNumber(balance.sgold_balance)}
              </span>
              <span className="text-sm text-muted-foreground">SOLGOLD</span>
              <span className="text-sm text-muted-foreground ml-1">
                ≈ {formatCurrency(balance.usd_value)}
              </span>
            </div>
          </div>

          {/* SOL Balance */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Solana Balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatNumber(balance.sol_balance)}
              </span>
              <span className="text-sm text-muted-foreground">SOL</span>
              {prices && (
                <span className="text-sm text-muted-foreground ml-1">
                  ≈ {formatCurrency(balance.sol_balance * prices.sol_price_usd)}
                </span>
              )}
            </div>
          </div>

          {/* Current Prices */}
          {prices && (
            <div className="pt-4 mt-4 border-t border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Gold</span>
                <span className="font-medium text-foreground">{formatCurrency(prices.gold_price_usd)}/oz</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">SOL</span>
                <span className="font-medium text-foreground">{formatCurrency(prices.sol_price_usd)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
