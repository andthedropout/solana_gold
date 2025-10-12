import React from 'react';
import { Wallet, ArrowRightLeft, Coins } from 'lucide-react';

export const HowItWorksFooter: React.FC = () => {
  return (
    <div className="w-full bg-gradient-to-b from-background via-muted/20 to-background border-t border-border py-16 mt-20">
      <div className="container">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-serif">
            What is SOLGOLD?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A cryptocurrency gold certificate on the Solana blockchain
          </p>
        </div>

        {/* Main Explanation Card */}
        <div className="p-8 bg-card border-2 border-primary/20 rounded-xl shadow-lg mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Coins className="h-12 w-12 text-primary" />
            </div>
          </div>

          <p className="text-base md:text-lg text-foreground text-center mb-6 leading-relaxed">
            SOLGOLD is a digital gold certificate that lives on the Solana blockchain. Each token represents
            <span className="font-bold text-primary"> $10 worth of physical gold</span>, giving you instant exposure
            to gold prices without the hassle of storing physical precious metals.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary mb-2">1 SOLGOLD</div>
              <div className="text-sm text-muted-foreground">= $10 worth of gold</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary mb-2">Instant</div>
              <div className="text-sm text-muted-foreground">Trading on Solana</div>
            </div>
            <div className="text-center p-4">
              <div className="text-2xl font-bold text-primary mb-2">Real-time</div>
              <div className="text-sm text-muted-foreground">Gold price tracking</div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="group p-6 bg-card rounded-xl border-2 border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 text-center">
            <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit mx-auto group-hover:bg-primary/20 transition-colors">
              <Wallet className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              Easy to Hold
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Store value in gold without vaults, insurance, or physical storage concerns.
            </p>
          </div>

          <div className="group p-6 bg-card rounded-xl border-2 border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 text-center">
            <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit mx-auto group-hover:bg-primary/20 transition-colors">
              <ArrowRightLeft className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              Instant Trading
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Buy or sell instantly on Solana. No waiting periods or complicated processes.
            </p>
          </div>

          <div className="group p-6 bg-card rounded-xl border-2 border-primary/10 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 text-center">
            <div className="mb-4 p-3 bg-primary/10 rounded-lg w-fit mx-auto group-hover:bg-primary/20 transition-colors">
              <Coins className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              Price Appreciation
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When gold prices rise, your SOLGOLD value rises with it automatically.
            </p>
          </div>
        </div>

        {/* Need Help */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need test SOL for the devnet?{' '}
            <a
              href="https://faucet.solana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              Get free devnet SOL here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};
