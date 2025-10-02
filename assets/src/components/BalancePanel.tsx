import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { RefreshCw, Coins, Wallet } from 'lucide-react';
import type { BalanceResponse } from '@/types/goldExchange';

export const BalancePanel: React.FC = () => {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
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
  };

  useEffect(() => {
    fetchBalance();
  }, [publicKey]);

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
          {/* sGOLD Balance */}
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Gold Tokens</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                {formatNumber(balance.sgold_balance)}
              </span>
              <span className="text-sm text-muted-foreground">sGOLD</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              ≈ {formatCurrency(balance.usd_value)}
            </p>
          </div>

          {/* SOL Balance */}
          <div className="p-4 bg-muted/50 border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Solana Balance</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatNumber(balance.sol_balance)}
              </span>
              <span className="text-sm text-muted-foreground">SOL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
