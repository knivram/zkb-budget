import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type ListItemProps = {
  /** Left-side element, typically a DomainLogo or icon container */
  leading?: ReactNode;
  /** Main content area */
  children: ReactNode;
  /** Right-side element, typically AmountText or chevron */
  trailing?: ReactNode;
  /** Show a bottom divider line */
  showDivider?: boolean;
  /** Navigation / tap handler */
  onPress?: () => void;
  /** Extra className on the outer container */
  className?: string;
};

export function ListItem({
  leading,
  children,
  trailing,
  showDivider = true,
  onPress,
  className,
}: ListItemProps) {
  const content = (
    <View
      className={cn(
        'flex-row items-center px-5 py-3',
        showDivider && 'border-b border-stone-100 dark:border-stone-800',
        className
      )}
    >
      {leading && <View className="mr-3">{leading}</View>}
      <View className="flex-1">{children}</View>
      {trailing && <View className="ml-3 items-end justify-center">{trailing}</View>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} className="active:bg-stone-50 dark:active:bg-stone-800/50">
        {content}
      </Pressable>
    );
  }

  return content;
}
