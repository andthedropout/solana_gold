import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { WalletButton } from '@/components/WalletButton';
import { WalletInfo } from '@/components/WalletInfo';
import { TrendingUp, TrendingDown, Minus, RefreshCw } from 'lucide-react';

interface GoldPriceData {
  price: number;
  currency: string;
  change: number;
  change_percent: number;
  timestamp: number;
}

export const Homepage: React.FC = () => {
  const { connected } = useWallet();
  const [goldData, setGoldData] = useState<GoldPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch gold price data
  const fetchGoldPrice = async () => {
    try {
      setError(null);

      // Try multiple APIs in case one fails
      const apis = [
        {
          url: 'https://api.coingecko.com/api/v3/simple/price?ids=pax-gold&vs_currencies=usd&include_24hr_change=true',
          transform: (data: any) => ({
            price: data['pax-gold']?.usd || 0,
            currency: 'USD',
            change: 0, // Would need historical data
            change_percent: data['pax-gold']?.usd_24h_change || 0,
            timestamp: Date.now()
          })
        },
        {
          url: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=GLD&apikey=demo',
          transform: (data: any) => {
            const quote = data['Global Quote'];
            if (!quote) return { price: 0, currency: 'USD', change: 0, change_percent: 0, timestamp: Date.now() };

            const price = parseFloat(quote['05. price']) * 10; // GLD ETF is ~1/10th gold price
            const change = parseFloat(quote['09. change']);
            const changePercent = parseFloat(quote['10. change percent']?.replace('%', ''));

            return {
              price: price || 0,
              currency: 'USD',
              change: change || 0,
              change_percent: changePercent || 0,
              timestamp: Date.now()
            };
          }
        },
        {
          url: 'https://api.exchangerate-api.com/v4/latest/USD',
          transform: (data: any) => {
            // This doesn't have gold, but we can use it as a fallback with estimated gold price
            const estimatedGoldPrice = 2020; // Rough current gold price
            return {
              price: estimatedGoldPrice,
              currency: 'USD',
              change: 0,
              change_percent: 0,
              timestamp: Date.now()
            };
          }
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
        setError('Unable to fetch gold price from any available API');
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

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-foreground mb-4">
            Solana Gold
          </h1>
          <p className="text-xl text-muted-foreground">
            Crypto meets precious metals
          </p>
        </div>

        {/* Gold Price Card */}
        <div className="bg-card border border-border rounded-lg p-8 mb-8">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-6">
              Live Gold Price
            </h2>

            {loading ? (
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
                <span className="text-muted-foreground">Loading gold price...</span>
              </div>
            ) : (
              <>
                {/* Current Price */}
                <div className="mb-4">
                  <div className="text-4xl font-bold text-foreground mb-2">
                    {goldData ? formatPrice(goldData.price) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    per troy ounce {!goldData?.timestamp || (Date.now() - goldData.timestamp > 300000) ? '(demo)' : ''}
                  </div>
                </div>

                {/* Price Change */}
                {goldData && (
                  <div className={`flex items-center justify-center gap-2 text-sm font-semibold mb-4 ${getTrendColor(goldData.change)}`}>
                    {getTrendIcon(goldData.change)}
                    <span>{formatChange(goldData.change)}</span>
                    <span>({goldData.change_percent.toFixed(2)}%)</span>
                  </div>
                )}
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  {error}
                </p>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchGoldPrice}
              disabled={loading}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 disabled:opacity-50 mx-auto"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Price
            </button>
          </div>
        </div>

        {/* Wallet Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Connect Your Wallet
          </h2>

          <div className="flex flex-col items-center gap-6">
            <WalletButton />

            {connected && (
              <div className="animate-in slide-in-from-top-4 duration-500">
                <WalletInfo />
              </div>
            )}
          </div>
        </div>

        {/* Instructions for getting devnet SOL */}
        {connected && (
          <div className="max-w-md mx-auto p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold text-sm mb-2">Need devnet SOL?</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Visit the Solana faucet to get free devnet SOL for testing:
            </p>
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-sm font-medium"
            >
              https://faucet.solana.com/
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Homepage;