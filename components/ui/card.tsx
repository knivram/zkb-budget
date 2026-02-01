import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return <View className={cn('rounded-2xl bg-card dark:bg-card-dark', className)}>{children}</View>;
}

type CardHeaderProps = {
  title: string;
  className?: string;
};

export function CardHeader({ title, className }: CardHeaderProps) {
  return (
    <Text
      className={cn(
        'mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400',
        className
      )}
    >
      {title}
    </Text>
  );
}
