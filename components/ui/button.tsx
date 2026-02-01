import type { ReactNode } from 'react';
import { Pressable, Text, View, type PressableStateCallbackType } from 'react-native';

import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = {
  label?: string;
  children?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  textClassName?: string;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 dark:bg-indigo-500',
  secondary: 'bg-slate-100 dark:bg-slate-800',
  ghost: 'bg-transparent',
};

const textClasses: Record<ButtonVariant, string> = {
  primary: 'text-white',
  secondary: 'text-slate-700 dark:text-slate-200',
  ghost: 'text-slate-600 dark:text-slate-300',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-5 py-3 text-base',
};

export function Button({
  label,
  children,
  onPress,
  disabled,
  variant = 'primary',
  size = 'md',
  className,
  textClassName,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center rounded-2xl border border-transparent',
        variant === 'secondary' && 'border-slate-200 dark:border-slate-700',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className
      )}
      style={({ pressed }: PressableStateCallbackType) =>
        pressed && !disabled ? { opacity: 0.9 } : undefined
      }
    >
      {label ? (
        <Text className={cn('font-semibold', textClasses[variant], textClassName)}>{label}</Text>
      ) : (
        <View className="flex-row items-center justify-center">{children}</View>
      )}
    </Pressable>
  );
}
