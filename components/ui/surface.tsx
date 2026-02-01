import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { cn } from '@/lib/utils';

export function Surface({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn(
        'rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900',
        className
      )}
      {...props}
    />
  );
}
