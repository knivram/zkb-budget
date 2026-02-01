import { Text } from 'react-native';

export function Label({ children }: { children: string }) {
  return <Text className="mb-2 text-sm leading-5 text-muted dark:text-muted-dark">{children}</Text>;
}
