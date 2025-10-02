import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SystemStatusBannerProps {
  initialized: boolean;
}

export const SystemStatusBanner: React.FC<SystemStatusBannerProps> = ({ initialized }) => {
  if (initialized) {
    return null; // Don't show anything when system is working
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-700 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
            Devnet Token Not Initialized Yet
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
            The Solana gold token hasn't been created on devnet yet. You can still see prices and quotes,
            but you won't be able to complete exchanges until the token is initialized.
          </p>
          <div className="bg-yellow-100 dark:bg-yellow-900/40 p-3 rounded border border-yellow-300 dark:border-yellow-800">
            <p className="text-xs font-mono text-yellow-900 dark:text-yellow-200 mb-1">
              To initialize the system, run:
            </p>
            <code className="text-xs font-mono text-yellow-900 dark:text-yellow-100 block bg-yellow-200 dark:bg-yellow-900 px-2 py-1 rounded">
              docker-compose exec web python manage.py init_gold_token
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};
