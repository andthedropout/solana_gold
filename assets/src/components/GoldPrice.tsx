import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface GoldPriceData {
  price: number;
  currency: string;
  change: number;
  change_percent: number;
  timestamp: number;
}

export const GoldPrice: React.FC = () => {
  const [goldData, setGoldData] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch gold price data
  const fetchGoldPrice = async () => {
    try {
      setError(null);

      // Try multiple APIs in case one fails
      const apis = [
        {
          url: 'https://api.goldapi.io/api/XAU/USD',
          transform: (data: any) => ({
            price: data.price,
            currency: 'USD',
            change: data.ch || 0,
            change_percent: data.chp || 0,
            timestamp: data.timestamp || Date.now()
          })
        },
        {
          url: 'https://api.metals.live/v1/spot/gold',
          transform: (data: any) => ({
            price: data.price || data.bid || data.ask || 0,
            currency: 'USD',
            change: data.change || 0,
            change_percent: data.change_percent || 0,
            timestamp: Date.now()
          })
        }
      ];

      let success = false;

      for (const api of apis) {
        try {
          const response = await fetch(api.url);
          if (response.ok) {
            const data = await response.json();
            const transformedData = api.transform(data);

            if (transformedData.price > 0) {
              setGoldData(transformedData);
              setLastUpdated(new Date());
              success = true;
              break;
            }
          }
        } catch (apiError) {
          console.log(`API ${api.url} failed:`, apiError);
          continue;
        }
      }

      if (!success) {
        // Fallback with mock data for demonstration
        setGoldData({
          price: 2023.45,
          currency: 'USD',
          change: 15.30,
          change_percent: 0.76,
          timestamp: Date.now()
        });
        setLastUpdated(new Date());
        setError('Using demo data - API temporarily unavailable');
      }

    } catch (err) {
      setError('Failed to fetch gold price');
      console.error('Gold price fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoldPrice();

    // Update every 60 seconds
    const interval = setInterval(fetchGoldPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const formatChange = (change: number) => {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Math.abs(change));

    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
          <span className="text-muted-foreground">Loading gold price...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Gold Spot Price
          </h1>
          <p className="text-muted-foreground">
            Live precious metals pricing
          </p>
        </div>

        {/* Main Price Card */}
        <div className="bg-card border border-border rounded-lg p-8 mb-6">
          <div className="text-center">
            {/* Current Price */}
            <div className="mb-6">
              <div className="text-6xl font-bold text-foreground mb-2">
                {goldData ? formatPrice(goldData.price) : '--'}
              </div>
              <div className="text-lg text-muted-foreground">
                per troy ounce
              </div>
            </div>

            {/* Price Change */}
            {goldData && (
              <div className={`flex items-center justify-center gap-2 text-lg font-semibold ${getTrendColor(goldData.change)}`}>
                {getTrendIcon(goldData.change)}
                <span>{formatChange(goldData.change)}</span>
                <span>({goldData.change_percent.toFixed(2)}%)</span>
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {lastUpdated && `Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </div>
            <button
              onClick={fetchGoldPrice}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {error}
              </p>
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Market Status</h3>
            <p className="text-sm text-muted-foreground">
              Gold markets trade 24/7 globally
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Currency</h3>
            <p className="text-sm text-muted-foreground">
              US Dollars (USD)
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-foreground mb-2">Update Frequency</h3>
            <p className="text-sm text-muted-foreground">
              Every 60 seconds
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground text-center">
            <strong>Disclaimer:</strong> Gold prices are indicative and may vary from actual market prices.
            This information is for educational purposes only and should not be considered as financial advice.
          </p>
        </div>
      </div>
    </div>
  );
};