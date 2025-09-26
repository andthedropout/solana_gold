import React from 'react';
import { useWallet } from '@/components/WalletContextProvider';
import { WalletButton } from '@/components/WalletButton';
import { WalletInfo } from '@/components/WalletInfo';

export const Homepage: React.FC = () => {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-foreground mb-4">
          Solana
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Connect your wallet to get started
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <WalletButton />

        {connected && (
          <div className="animate-in slide-in-from-top-4 duration-500">
            <WalletInfo />
          </div>
        )}
      </div>

      {/* Instructions for getting devnet SOL */}
      {connected && (
        <div className="max-w-md mx-auto mt-8 p-4 bg-muted/50 rounded-lg border">
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
  );
};

export default Homepage;