import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button.js';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There are no active records matching the selected criteria.',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
      <div className="p-3 bg-surface-subtle text-content-subtle rounded-full mb-3">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="text-sm font-semibold text-content-primary mb-1">{title}</h3>
      <p className="text-xs text-content-muted max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
