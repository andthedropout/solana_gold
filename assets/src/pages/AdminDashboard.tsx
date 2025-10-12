import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, TrendingUp, Activity, DollarSign, Copy, Check, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface WalletInfo {
  address: string;
  balance_sol: number;
  balance_usd: number;
  description: string;
}

interface DashboardData {
  system_info: {
    solana_network: string;
    sgold_mint_address: string;
    system_initialized: boolean;
  };
  wallets: {
    mint_authority: WalletInfo;
    treasury: WalletInfo;
    profit: WalletInfo;
    transaction_fee: WalletInfo;
    liquidity: WalletInfo;
    dev_fund: WalletInfo;
  };
  prices: {
    gold_price_usd: number;
    sol_price_usd: number;
    sgold_rate: number;
  };
  statistics: {
    total_transactions: number;
    completed_transactions: number;
    pending_transactions: number;
    failed_transactions: number;
    total_sol_volume: number;
    total_sgold_minted: number;
    total_fees_collected_sol: number;
    total_fees_collected_usd: number;
  };
  recent_transactions: Array<{
    id: number;
    user_wallet: string;
    type: string;
    sol_amount: number;
    token_amount: number;
    status: string;
    created_at: string;
    tx_signature: string;
  }>;
}

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="ml-2 h-6 px-2"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawModal, setWithdrawModal] = useState<{
    wallet: string;
    walletName: string;
    maxBalance: number;
  } | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/v1/gold/admin/dashboard', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
          // Redirect to Django admin login
          window.location.href = '/admin/login/?next=/exchange-admin';
          return;
        }
        throw new Error('Failed to load dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCsrfToken = () => {
    const name = 'csrftoken';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const trimmed = cookie.trim();
      if (trimmed.startsWith(name + '=')) {
        return trimmed.substring(name.length + 1);
      }
    }
    return null;
  };

  const ensureCsrfToken = async () => {
    let token = getCsrfToken();
    if (!token) {
      // Fetch CSRF token from Django
      const response = await fetch('/api/v1/csrf_token/', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
    }
    return token;
  };

  const handleWithdraw = async () => {
    if (!withdrawModal || !withdrawAmount || !withdrawDestination) return;

    setWithdrawing(true);
    setWithdrawError(null);
    setWithdrawSuccess(null);

    try {
      const csrfToken = await ensureCsrfToken();
      const response = await fetch('/api/v1/gold/admin/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          wallet: withdrawModal.wallet,
          destination: withdrawDestination,
          amount_sol: parseFloat(withdrawAmount),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      setWithdrawSuccess(`Successfully withdrawn ${withdrawAmount} SOL. Tx: ${result.tx_signature}`);
      setWithdrawAmount('');
      setWithdrawDestination('');
      setTimeout(() => {
        setWithdrawModal(null);
        setWithdrawSuccess(null);
        fetchDashboardData(); // Refresh balances
      }, 3000);
    } catch (err) {
      setWithdrawError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            sGOLD Exchange Management - {data.system_info.solana_network}
          </p>
        </div>
        <Button onClick={fetchDashboardData}>Refresh</Button>
      </div>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Network:</span>
            <span className="text-sm">{data.system_info.solana_network}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-sm ${data.system_info.system_initialized ? 'text-green-600' : 'text-yellow-600'}`}>
              {data.system_info.system_initialized ? 'Initialized' : 'Not Initialized'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Token Mint:</span>
            <div className="flex items-center">
              <span className="text-sm font-mono">{formatAddress(data.system_info.sgold_mint_address)}</span>
              <CopyButton text={data.system_info.sgold_mint_address} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.prices.gold_price_usd.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per troy ounce</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOL Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.prices.sol_price_usd.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">USD per SOL</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">sGOLD Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.prices.sgold_rate.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">per token</p>
          </CardContent>
        </Card>
      </div>

      {/* Wallets */}
      <Card>
        <CardHeader>
          <CardTitle>System Wallets</CardTitle>
          <CardDescription>All wallet balances and addresses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(data.wallets).map(([key, wallet]) => (
              <div key={key} className="border-b pb-4 last:border-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold capitalize text-left">{key.replace('_', ' ')}</h3>
                    <p className="text-sm text-muted-foreground text-left">{wallet.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold">{wallet.balance_sol.toFixed(4)} SOL</p>
                      <p className="text-sm text-muted-foreground">${wallet.balance_usd.toFixed(2)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={wallet.balance_sol <= 0.005}
                      onClick={() => setWithdrawModal({
                        wallet: key,
                        walletName: key.replace('_', ' '),
                        maxBalance: wallet.balance_sol
                      })}
                    >
                      <ArrowUpRight className="h-4 w-4 mr-1" />
                      Withdraw
                    </Button>
                  </div>
                </div>
                <div className="flex items-center bg-muted p-2 rounded font-mono text-xs">
                  <span className="flex-1">{wallet.address}</span>
                  <CopyButton text={wallet.address} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total_transactions}</div>
            <p className="text-xs text-muted-foreground">
              {data.statistics.completed_transactions} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SOL Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total_sol_volume.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total SOL traded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">sGOLD Minted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total_sgold_minted.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total tokens issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.statistics.total_fees_collected_sol.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground">
              ${data.statistics.total_fees_collected_usd.toFixed(2)} USD
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Last 10 transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.recent_transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet
              </p>
            ) : (
              data.recent_transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="text-sm font-medium">
                      {tx.type.toUpperCase()} - {tx.sol_amount.toFixed(4)} SOL → {tx.token_amount.toFixed(2)} sGOLD
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatAddress(tx.user_wallet)} · {formatDate(tx.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded ${
                      tx.status === 'completed' ? 'bg-green-100 text-green-800' :
                      tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Modal */}
      {withdrawModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Withdraw from {withdrawModal.walletName}</CardTitle>
              <CardDescription>
                Available balance: {withdrawModal.maxBalance.toFixed(4)} SOL
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {withdrawSuccess && (
                <Alert>
                  <AlertDescription className="text-green-600">{withdrawSuccess}</AlertDescription>
                </Alert>
              )}
              {withdrawError && (
                <Alert variant="destructive">
                  <AlertDescription>{withdrawError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.001"
                  max={withdrawModal.maxBalance - 0.005}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Max: {(withdrawModal.maxBalance - 0.005).toFixed(4)} SOL (leaves 0.005 for fees)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destination Address</Label>
                <Input
                  id="destination"
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  placeholder="Solana wallet address"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawing || !withdrawAmount || !withdrawDestination}
                  className="flex-1"
                >
                  {withdrawing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Withdrawing...
                    </>
                  ) : (
                    'Withdraw'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setWithdrawModal(null);
                    setWithdrawAmount('');
                    setWithdrawDestination('');
                    setWithdrawError(null);
                    setWithdrawSuccess(null);
                  }}
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
