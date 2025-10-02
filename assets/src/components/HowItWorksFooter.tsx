import React from 'react';
import { Wallet, ArrowRightLeft, Coins } from 'lucide-react';

export const HowItWorksFooter: React.FC = () => {
  return (
    <div className="w-full bg-muted/30 border-t border-border py-12 px-4 mt-16">
      <div className="max-w-5xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            How It Works
          </h2>
          <p className="text-muted-foreground">
            Exchange Solana for gold-backed tokens in three simple steps
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-4 bg-primary/10 rounded-full">
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <div className="mb-2 px-3 py-1 bg-primary/20 rounded-full">
              <span className="text-sm font-semibold text-primary">Step 1</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Connect Wallet
            </h3>
            <p className="text-muted-foreground text-sm">
              Connect your Phantom or any Solana wallet securely. Your funds stay safe with you.
            </p>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-4 bg-primary/10 rounded-full">
              <ArrowRightLeft className="h-10 w-10 text-primary" />
            </div>
            <div className="mb-2 px-3 py-1 bg-primary/20 rounded-full">
              <span className="text-sm font-semibold text-primary">Step 2</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Enter Amount
            </h3>
            <p className="text-muted-foreground text-sm">
              Choose how much SOL you want to exchange. We'll show you exactly how much gold-backed tokens you'll receive.
            </p>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 p-4 bg-primary/10 rounded-full">
              <Coins className="h-10 w-10 text-primary" />
            </div>
            <div className="mb-2 px-3 py-1 bg-primary/20 rounded-full">
              <span className="text-sm font-semibold text-primary">Step 3</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Get Gold Tokens
            </h3>
            <p className="text-muted-foreground text-sm">
              Confirm the exchange and receive sGOLD tokens instantly. Each token represents $10 worth of gold.
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-10 p-6 bg-card border border-border rounded-lg">
          <h3 className="font-semibold text-foreground mb-2 text-center">
            What are sGOLD tokens?
          </h3>
          <p className="text-sm text-muted-foreground text-center max-w-3xl mx-auto">
            sGOLD tokens are digital tokens backed by real gold prices. Each token is pegged to $10 worth of gold,
            so when gold prices go up, your tokens' value goes up too. You can hold them, trade them,
            or exchange them back to SOL anytime.
          </p>
        </div>

        {/* Need Help */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Need test SOL for the devnet?{' '}
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Get free devnet SOL here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
