import { cn } from '@/lib/utils';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

type BadgeProps = {
  children: ReactNode;
  /** SF Symbol icon name */
  icon?: Parameters<typeof SwiftImage>[0]['systemName'];
  /** Tinted variant uses a custom color (hex). Default uses stone/neutral. */
  color?: string;
  className?: string;
};

export function Badge({ children, icon, color, className }: BadgeProps) {
  const isTinted = !!color;

  return (
    <View
      className={cn(
        'flex-row items-center rounded-lg px-2 py-0.5',
        !isTinted && 'bg-stone-100 dark:bg-stone-800',
        className
      )}
      style={isTinted ? { backgroundColor: `${color}18` } : undefined}
    >
      {icon && (
        <View className="mr-1">
          <Host matchContents>
            <SwiftImage systemName={icon} size={11} color={color ?? '#78716c'} />
          </Host>
        </View>
      )}
      <Text
        className={cn('text-xs font-medium', !isTinted && 'text-stone-600 dark:text-stone-400')}
        style={isTinted ? { color } : undefined}
      >
        {children}
      </Text>
    </View>
  );
}
