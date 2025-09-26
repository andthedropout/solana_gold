import React, { FC } from 'react';
import { useWallet } from './WalletContextProvider';

export const WalletButton: FC = () => {
  const { connected, connect, disconnect, connecting, error } = useWallet();

  if (connected) {
    return (
      <div className="flex gap-2">
        <button
          onClick={disconnect}
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={connect}
        disabled={connecting}
        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg px-6 py-3 font-medium transition-colors"
      >
        {connecting ? 'Connecting...' : 'Connect Phantom Wallet'}
      </button>

      {error && (
        <p className="text-destructive text-sm text-center max-w-sm">
          {error}
        </p>
      )}

      {!connecting && !connected && (
        <p className="text-muted-foreground text-xs text-center">
          Make sure Phantom wallet is installed
        </p>
      )}
    </div>
  );
};