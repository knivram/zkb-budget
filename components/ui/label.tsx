import { Text } from 'react-native';

export function Label({ children }: { children: string }) {
  return (
    <Text className="mb-1.5 text-sm font-medium text-gray-500 dark:text-gray-400">{children}</Text>
  );
}
