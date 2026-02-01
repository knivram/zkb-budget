import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type SectionHeaderProps = {
  /** Main header text */
  title: string;
  /** Right-side element, e.g. AmountText */
  trailing?: ReactNode;
};

export function SectionHeader({ title, trailing }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between bg-stone-100 px-5 py-2 dark:bg-stone-800/80">
      <Text className="text-sm font-semibold text-stone-500 dark:text-stone-400">{title}</Text>
      {trailing}
    </View>
  );
}
