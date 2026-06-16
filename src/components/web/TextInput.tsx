'use client';

import { InputHTMLAttributes, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  isPassword?: boolean;
}

export function TextInput({ label, error, helperText, isPassword, className = '', ...props }: TextInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : (props.type || 'text');

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-text-primary">{label}</label>
      <div className="relative">
        <input
          type={inputType}
          className={`w-full px-4 py-3 rounded-lg bg-bg-elevated border text-text-primary text-sm outline-none transition-all duration-200 ${error ? 'border-error-500' : 'border-border-base focus:border-primary-500 focus:ring-1 focus:ring-primary-500'} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && <p className="text-error-500 text-xs">{error}</p>}
      {helperText && !error && <p className="text-text-muted text-xs">{helperText}</p>}
    </div>
  );
}
