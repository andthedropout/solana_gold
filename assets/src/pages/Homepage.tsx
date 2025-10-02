import React, { useState, useEffect } from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { SimpleHeader } from '@/components/SimpleHeader';
import { ConnectionPrompt } from '@/components/ConnectionPrompt';
import { BalancePanel } from '@/components/BalancePanel';
import { ExchangePanel } from '@/components/ExchangePanel';
import { HowItWorksFooter } from '@/components/HowItWorksFooter';
import { SystemStatusBanner } from '@/components/SystemStatusBanner';
import { goldExchangeService } from '@/services/goldExchange';

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
      {/* Header with prices */}
      <SimpleHeader />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* System Status Banner */}
        {connected && <SystemStatusBanner initialized={systemInitialized} />}

        {!connected ? (
          // Not connected: Show connection prompt
          <ConnectionPrompt />
        ) : (
          // Connected: Show two-column layout
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column: Balances */}
            <div>
              <BalancePanel />
            </div>

            {/* Right Column: Exchange */}
            <div>
              <ExchangePanel />
            </div>
          </div>
        )}
      </div>

      {/* How It Works Footer */}
      <HowItWorksFooter />
    </div>
  );
};

export default Homepage;