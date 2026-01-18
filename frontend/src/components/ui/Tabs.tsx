/**
 * Tabs 标签页组件
 * 基于 Radix UI Tabs
 */

import { forwardRef } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

// ============ Tabs Root ============

export const Tabs = TabsPrimitive.Root;

// ============ Tabs List ============

export const TabsList = forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex items-center gap-1 p-1 bg-zinc-900 rounded-lg',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

// ============ Tabs Trigger ============

export const TabsTrigger = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md',
      'text-zinc-400 hover:text-zinc-200 transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-950',
      'disabled:opacity-50 disabled:pointer-events-none',
      'data-[state=active]:bg-zinc-800 data-[state=active]:text-white',
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = 'TabsTrigger';

// ============ Tabs Content ============

export const TabsContent = forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-4 focus:outline-none',
      'data-[state=inactive]:hidden',
      className
    )}
    {...props}
  />
));
TabsContent.displayName = 'TabsContent';

export default Tabs;
