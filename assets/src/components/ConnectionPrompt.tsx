import React from 'react';
import { WalletButton } from '@/components/WalletButton';
import { Wallet, Shield, Zap } from 'lucide-react';

export const ConnectionPrompt: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-primary/10 rounded-full">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-semibold text-foreground mb-3">
          Connect Your Wallet to Get Started
        </h2>

        {/* Explanation */}
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          A wallet is like a digital account that lets you hold and exchange Solana (SOL) for gold-backed tokens.
          Your wallet stays secure and private—we never have access to your funds.
        </p>

        {/* Connect Button */}
        <div className="mb-8">
          <WalletButton />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-border">
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">100% Secure</h3>
            <p className="text-xs text-muted-foreground">
              You control your funds. We never touch your money.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Instant Exchange</h3>
            <p className="text-xs text-muted-foreground">
              Convert SOL to gold tokens in seconds.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            <h3 className="font-semibold text-sm text-foreground">Easy to Use</h3>
            <p className="text-xs text-muted-foreground">
              Simple interface designed for everyone.
            </p>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
        <p className="text-sm text-muted-foreground text-center">
          <strong className="text-foreground">Don't have a wallet?</strong> Download{' '}
          <a
            href="https://phantom.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline font-medium"
          >
            Phantom Wallet
          </a>{' '}
          (recommended) or any Solana-compatible wallet to get started.
        </p>
      </div>
    </div>
  );
};
