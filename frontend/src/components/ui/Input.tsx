/**
 * Input 输入框组件
 */

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, icon, type = 'text', ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
            {icon}
          </div>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'w-full px-3 py-2 bg-zinc-900 border rounded-lg text-zinc-100 placeholder-zinc-500',
            'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            icon && 'pl-10',
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-zinc-700 focus:ring-blue-500 focus:border-blue-500',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
