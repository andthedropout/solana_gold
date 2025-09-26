import React, { FC, ReactNode, createContext, useContext, useState, useEffect } from 'react';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Simple wallet interface
interface WalletContextType {
  connected: boolean;
  publicKey: PublicKey | null;
  balance: number | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  connecting: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  connected: false,
  publicKey: null,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  connecting: false,
  error: null,
});

interface WalletContextProviderProps {
  children: ReactNode;
}

export const WalletContextProvider: FC<WalletContextProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Solana connection to devnet
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // Check if Phantom wallet is installed
  const getPhantom = () => {
    if (typeof window !== 'undefined' && 'solana' in window) {
      const solana = (window as any).solana;
      if (solana?.isPhantom) {
        return solana;
      }
    }
    return null;
  };

  // Connect to Phantom wallet
  const connect = async () => {
    try {
      setConnecting(true);
      setError(null);

      const phantom = getPhantom();
      if (!phantom) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      const response = await phantom.connect();
      const pubKey = new PublicKey(response.publicKey.toString());

      setPublicKey(pubKey);
      setConnected(true);

      // Fetch balance
      const lamports = await connection.getBalance(pubKey);
      setBalance(lamports / LAMPORTS_PER_SOL);

    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnect = () => {
    const phantom = getPhantom();
    if (phantom) {
      phantom.disconnect();
    }

    setConnected(false);
    setPublicKey(null);
    setBalance(null);
    setError(null);
  };

  // Auto-connect on load if previously connected
  useEffect(() => {
    const phantom = getPhantom();
    if (phantom?.isConnected && phantom.publicKey) {
      const pubKey = new PublicKey(phantom.publicKey.toString());
      setPublicKey(pubKey);
      setConnected(true);

      // Fetch balance
      connection.getBalance(pubKey).then(lamports => {
        setBalance(lamports / LAMPORTS_PER_SOL);
      });
    }
  }, []);

  // Update balance periodically when connected
  useEffect(() => {
    if (connected && publicKey) {
      const interval = setInterval(async () => {
        try {
          const lamports = await connection.getBalance(publicKey);
          setBalance(lamports / LAMPORTS_PER_SOL);
        } catch (err) {
          console.error('Error fetching balance:', err);
        }
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [connected, publicKey]);

  const value: WalletContextType = {
    connected,
    publicKey,
    balance,
    connect,
    disconnect,
    connecting,
    error,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletContextProvider');
  }
  return context;
};