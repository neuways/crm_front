import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while loading this section.',
  onRetry,
}) => {
  return (
    <div className="py-8 px-4 text-center flex flex-col items-center justify-center bg-red-50/50 rounded-lg border border-red-100 my-2">
      <div className="p-2.5 bg-red-100 text-status-danger rounded-full mb-2.5">
        <AlertCircle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-red-900 mb-1">{title}</h3>
      <p className="text-xs text-red-700 max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetry}
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          className="border-red-200 text-red-800 hover:bg-red-100/50"
        >
          Retry
        </Button>
      )}
    </div>
  );
};
