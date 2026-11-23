import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  noPadding = false,
  ...props
}) => {
  return (
    <div
      className={`bg-surface-card border border-edge rounded-card shadow-card overflow-hidden ${
        noPadding ? '' : 'p-3.5 sm:p-5 lg:p-6'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
