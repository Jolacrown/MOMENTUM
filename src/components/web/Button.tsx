'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title?: string;
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600',
  secondary: 'bg-bg-elevated text-text-primary border border-border-base hover:bg-border-light',
  ghost: 'bg-transparent text-primary-500 hover:bg-primary-50',
  danger: 'bg-error-500 text-white hover:bg-red-600',
};

const sizes = {
  sm: 'px-3 py-2 text-xs',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-base',
};

export function Button({
  title,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`rounded-lg font-semibold text-center flex items-center justify-center gap-2 transition-all duration-200 ${variants[variant]} ${sizes[size]} ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      {...props}
    >
      {isLoading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {title || children}
    </button>
  );
}
