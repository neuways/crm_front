import React from 'react';

export interface LoadingStateProps {
  message?: string;
  rows?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  rows = 4,
}) => {
  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center space-y-4">
      <div className="flex items-center space-x-2 text-brand-primary">
        <svg
          className="animate-spin h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          />
        </svg>
        <span className="text-sm font-medium text-content-secondary">{message}</span>
      </div>

      <div className="w-full space-y-2.5 max-w-2xl mt-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-9 bg-slate-100 rounded animate-pulse w-full"
          />
        ))}
      </div>
    </div>
  );
};
