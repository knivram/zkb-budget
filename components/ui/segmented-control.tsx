import { cn } from '@/lib/utils';
import { Pressable, Text, View } from 'react-native';

type SegmentedControlProps<T extends string> = {
  options: readonly T[];
  labels: Record<T, string>;
  selected: T;
  onSelect: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  labels,
  selected,
  onSelect,
}: SegmentedControlProps<T>) {
  return (
    <View className="flex-row rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
      {options.map((option) => {
        const isSelected = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            className={cn(
              'flex-1 items-center rounded-lg px-3 py-2',
              isSelected && 'bg-white shadow-sm dark:bg-zinc-700'
            )}
          >
            <Text
              className={cn(
                'text-sm font-medium',
                isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {labels[option]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
