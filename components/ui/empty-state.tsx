import { Text, View } from 'react-native';

type EmptyStateProps = {
  title: string;
  subtitle?: string;
};

export default function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-20">
      <Text className="text-base text-gray-400 dark:text-gray-500">{title}</Text>
      {subtitle && (
        <Text className="mt-2 text-sm text-gray-400 dark:text-gray-600">{subtitle}</Text>
      )}
    </View>
  );
}
