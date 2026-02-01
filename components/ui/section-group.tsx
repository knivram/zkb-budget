import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type SectionGroupProps = {
  /** Uppercase section header label */
  header?: string;
  /** Content — typically ListItems or DetailRows */
  children: ReactNode;
  /** Small footer note below the section */
  footer?: string;
  /** Extra className on the card container */
  className?: string;
};

export function SectionGroup({ header, children, footer, className }: SectionGroupProps) {
  return (
    <View className="px-4 py-2">
      {header && (
        <Text className="mb-2 ml-1 text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
          {header}
        </Text>
      )}
      <View className={cn('overflow-hidden rounded-2xl bg-white dark:bg-stone-900', className)}>
        {children}
      </View>
      {footer && (
        <Text className="ml-1 mt-1.5 text-xs text-stone-400 dark:text-stone-500">{footer}</Text>
      )}
    </View>
  );
}
