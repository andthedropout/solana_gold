import React, { useState, useEffect } from 'react';
import { goldExchangeService } from '@/services/goldExchange';
import { Coins, RefreshCw } from 'lucide-react';
import type { PriceResponse } from '@/types/goldExchange';

export const SimpleHeader: React.FC = () => {
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const data = await goldExchangeService.getCurrentPrices();
      setPrices(data);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  return (
    <div className="w-full bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Main Title */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Coins className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">
              Solana Gold
            </h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Exchange Solana for Gold-Backed Tokens
          </p>
        </div>

        {/* Price Ticker */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
          {prices ? (
            <>
              <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">Gold:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(prices.gold_price_usd)}/oz
                </span>
              </div>

              <span className="text-muted-foreground">•</span>

              <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">SOL:</span>
                <span className="font-semibold text-foreground">
                  {formatCurrency(prices.sol_price_usd)}
                </span>
              </div>

              <span className="text-muted-foreground">•</span>

              <div className="flex items-center gap-2 px-4 py-2 bg-background/50 rounded-lg">
                <span className="text-muted-foreground">1 sGOLD =</span>
                <span className="font-semibold text-foreground">
                  $10 worth of gold
                </span>
              </div>

              <button
                onClick={fetchPrices}
                disabled={loading}
                className="p-2 hover:bg-background/50 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh prices"
              >
                <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-muted-foreground">Loading prices...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
