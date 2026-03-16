'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
  showPasswordToggle?: boolean;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  (
    {
      className,
      type,
      label,
      error,
      success,
      helperText,
      leftIcon,
      rightIcon,
      required,
      showPasswordToggle,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const inputType = showPasswordToggle
      ? showPassword
        ? 'text'
        : 'password'
      : type;

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background transition-all',
              'file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-muted-foreground',
              'disabled:cursor-not-allowed disabled:opacity-50',
              // Focus state
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              // Error state
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : success
                ? 'border-green-500 focus-visible:ring-green-500'
                : 'border-input focus-visible:ring-ring',
              // Padding adjustments for icons
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          )}
          {!showPasswordToggle && rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
          {success && !rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
          {error && !rightIcon && !showPasswordToggle && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
        {success && !error && (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {success}
          </p>
        )}
        {helperText && !error && !success && (
          <p className="text-xs text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';

export { FormInput };
