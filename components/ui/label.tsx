import { Text } from 'react-native';

export function Label({ children }: { children: string }) {
  return (
    <Text className="mb-2 text-sm leading-5 text-stone-500 dark:text-stone-400">{children}</Text>
  );
}
