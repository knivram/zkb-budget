import { Text, View } from 'react-native';

type DetailRowProps = {
  label: string;
  value: string;
  showDivider?: boolean;
};

export function DetailRow({ label, value, showDivider = true }: DetailRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between px-5 py-3 ${showDivider ? 'border-b border-stone-100 dark:border-stone-800' : ''}`}
    >
      <Text className="text-sm text-stone-500 dark:text-stone-400">{label}</Text>
      <Text className="text-sm font-medium text-stone-900 dark:text-stone-100">{value}</Text>
    </View>
  );
}
