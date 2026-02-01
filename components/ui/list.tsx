import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type ListRowProps = {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
  inset?: boolean;
};

export function ListRow({ children, onPress, className, inset = true }: ListRowProps) {
  const baseClasses = cn(
    'flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900',
    inset && 'mx-4',
    className
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={baseClasses}
        style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      >
        {children}
      </Pressable>
    );
  }

  return <View className={baseClasses}>{children}</View>;
}

type ListSectionHeaderProps = {
  title: string;
  value?: ReactNode;
  className?: string;
};

export function ListSectionHeader({ title, value, className }: ListSectionHeaderProps) {
  const resolvedValue =
    typeof value === 'string' || typeof value === 'number' ? (
      <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">{value}</Text>
    ) : (
      value
    );

  return (
    <View className={cn('mx-4 mb-2 mt-6 flex-row items-center justify-between', className)}>
      <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </Text>
      {resolvedValue}
    </View>
  );
}
