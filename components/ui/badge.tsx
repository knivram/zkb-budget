import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning';

type BadgeProps = {
  label: string;
  variant?: BadgeVariant;
  className?: string;
  icon?: ReactNode;
  textClassName?: string;
};

const badgeStyles: Record<BadgeVariant, { container: string; text: string }> = {
  neutral: {
    container: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
  },
  accent: {
    container: 'bg-indigo-100 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-200',
  },
  success: {
    container: 'bg-emerald-100 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-200',
  },
  warning: {
    container: 'bg-amber-100 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-200',
  },
};

export function Badge({ label, variant = 'neutral', className, icon, textClassName }: BadgeProps) {
  return (
    <View
      className={cn(
        'flex-row items-center gap-1.5 rounded-full px-2.5 py-1',
        badgeStyles[variant].container,
        className
      )}
    >
      {icon ? <View className="items-center justify-center">{icon}</View> : null}
      <Text className={cn('text-xs font-semibold', badgeStyles[variant].text, textClassName)}>
        {label}
      </Text>
    </View>
  );
}
