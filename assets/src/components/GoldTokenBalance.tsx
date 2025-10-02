import React, { useState, useEffect } from 'react';
import { useWallet } from './WalletContextProvider';
import { goldExchangeService } from '@/services/goldExchange';
import { RefreshCw, Coins } from 'lucide-react';
import type { BalanceResponse } from '@/types/goldExchange';

export const GoldTokenBalance: React.FC = () => {
  const { publicKey, connected } = useWallet();
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
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
      console.error('Error fetching balance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      fetchBalance();
    }
  }, [connected, publicKey]);

  if (!connected || !publicKey) {
    return null;
  }

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

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            sGOLD Balance
          </h3>
        </div>
        <button
          onClick={fetchBalance}
          disabled={loading}
          className="p-2 hover:bg-muted rounded-md transition-colors disabled:opacity-50"
          title="Refresh balance"
        >
          <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !balance ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : error ? (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      ) : balance ? (
        <div className="space-y-4">
          {/* Main Balance */}
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-foreground mb-1">
              {formatNumber(balance.sgold_balance)}
            </div>
            <div className="text-sm text-muted-foreground">sGOLD tokens</div>
          </div>

          {/* USD Value */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">Estimated Value</span>
            <span className="text-sm font-medium text-foreground">
              {formatCurrency(balance.estimated_usd_value)}
            </span>
          </div>

          {/* SOL Balance */}
          <div className="flex items-center justify-between py-2 border-t border-border">
            <span className="text-sm text-muted-foreground">SOL Balance</span>
            <span className="text-sm font-medium text-foreground">
              {formatNumber(balance.sol_balance)} SOL
            </span>
          </div>

          {/* Exchange Rate */}
          <div className="mt-4 p-3 bg-muted/50 rounded-md">
            <p className="text-xs text-center text-muted-foreground">
              1 sGOLD = $10 worth of gold
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};
