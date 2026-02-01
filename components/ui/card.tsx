import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <View className={cn('rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900', className)}>{children}</View>
  );
}
