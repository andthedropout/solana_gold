import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { ConnectionPrompt } from '@/components/ConnectionPrompt';
import { BalancePanel } from '@/components/BalancePanel';
import { ExchangePanel } from '@/components/ExchangePanel';
import { HowItWorksFooter } from '@/components/HowItWorksFooter';
import { SystemStatusBanner } from '@/components/SystemStatusBanner';
import { goldExchangeService } from '@/services/goldExchange';
import AnimatedBackground from '@/components/backgrounds/AnimatedBackground';

export const Homepage: React.FC = () => {
  const { connected } = useWallet();
  const [systemInitialized, setSystemInitialized] = useState<boolean>(true);

  // Check system initialization status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const prices = await goldExchangeService.getCurrentPrices();
        setSystemInitialized(prices.system_initialized !== false);
      } catch (error) {
        console.error('Failed to check system status:', error);
      }
    };
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen">

      {/* Animated Background spanning hero and exchange sections */}
      {connected ? (
        <AnimatedBackground type="bokeh_up" opacity={0.2}>
          {/* Hero Section */}
          <div className="pt-20 pb-16 px-4 text-center">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="text-2xl md:text-4xl font-bold tracking-wide text-primary uppercase">
                SOLGOLD
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight font-serif text-foreground underline decoration-primary decoration-4 underline-offset-8">
                Set The Standard
              </h1>
            </div>
          </div>

          {/* Main Content */}
          <div className="container py-8">
            {/* System Status Banner */}
            <SystemStatusBanner initialized={systemInitialized} />

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Exchange (2/3 width) */}
              <div className="lg:col-span-2">
                <ExchangePanel />
              </div>

              {/* Right Column: Balances (1/3 width) */}
              <div className="lg:col-span-1">
                <BalancePanel />
              </div>
            </div>
          </div>
        </AnimatedBackground>
      ) : (
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Not connected: Show connection prompt */}
          <ConnectionPrompt />
        </div>
      )}

      {/* How It Works Footer */}
      <HowItWorksFooter />
    </div>
  );
};

export default Homepage;