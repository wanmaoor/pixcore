/**
 * Button 通用按钮组件
 */

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    const baseStyles =
      'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none';

    const variantStyles = {
      primary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500',
      secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 focus:ring-zinc-600',
      ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 focus:ring-zinc-600',
      danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500',
      outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white focus:ring-zinc-600',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {children}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

export default Button;
