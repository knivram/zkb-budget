import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
};

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20">
      <Text className="text-base font-medium text-stone-400 dark:text-stone-500">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-sm text-stone-300 dark:text-stone-600">{subtitle}</Text>
      )}
    </View>
  );
}
