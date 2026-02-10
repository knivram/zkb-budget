import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function EmptyState({ title, description, className }: EmptyStateProps) {
  return (
    <View className={cn('items-center justify-center py-12', className)}>
      <Text className="text-base font-semibold text-slate-600 dark:text-slate-300">{title}</Text>
      {description ? (
        <Text className="mt-2 text-sm text-slate-400 dark:text-slate-500">{description}</Text>
      ) : null}
    </View>
  );
}
