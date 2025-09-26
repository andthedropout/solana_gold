import React, { FC } from 'react';
import { useWallet } from './WalletContextProvider';
import { Copy } from 'lucide-react';

export const WalletInfo: FC = () => {
  const { publicKey, connected, balance } = useWallet();

  // Copy address to clipboard
  const copyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        // You could add a toast notification here
        console.log('Address copied to clipboard');
      } catch (error) {
        console.error('Failed to copy address:', error);
      }
    }
  };

  // Truncate address for display
  const truncateAddress = (address: string, start = 4, end = 4) => {
    if (address.length <= start + end) return address;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  if (!connected || !publicKey) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-md mx-auto">
      <h3 className="text-lg font-semibold text-foreground mb-4">Wallet Info</h3>

      {/* Address */}
      <div className="mb-4">
        <label className="text-sm text-muted-foreground block mb-1">Address</label>
        <div className="flex items-center gap-2 bg-muted rounded-md p-2">
          <code className="text-sm font-mono flex-1">
            {truncateAddress(publicKey.toString())}
          </code>
          <button
            onClick={copyAddress}
            className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Copy address"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Balance */}
      <div>
        <label className="text-sm text-muted-foreground block mb-1">Balance</label>
        <div className="bg-muted rounded-md p-2">
          {balance === null ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <span className="text-lg font-semibold">
              {balance.toFixed(4)} SOL
            </span>
          )}
        </div>
      </div>

      {/* Network indicator */}
      <div className="mt-4 text-center">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          Devnet
        </span>
      </div>
    </div>
  );
};