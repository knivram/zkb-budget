import { cn } from '@/lib/utils';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

type ButtonProps = PressableProps & {
  variant?: ButtonVariant;
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, { container: string; text: string; pressed: string }> =
  {
    primary: {
      container: 'bg-blue-600 dark:bg-blue-500',
      text: 'text-white font-semibold',
      pressed: 'bg-blue-700 dark:bg-blue-600',
    },
    secondary: {
      container: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-900 dark:text-zinc-100 font-medium',
      pressed: 'bg-zinc-200 dark:bg-zinc-700',
    },
    destructive: {
      container: 'bg-red-600 dark:bg-red-500',
      text: 'text-white font-semibold',
      pressed: 'bg-red-700 dark:bg-red-600',
    },
    ghost: {
      container: 'bg-transparent',
      text: 'text-blue-600 dark:text-blue-400 font-medium',
      pressed: 'bg-zinc-100 dark:bg-zinc-800',
    },
  };

export function Button({
  variant = 'primary',
  label,
  loading = false,
  fullWidth = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const styles = variantClasses[variant];

  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-xl px-5 py-3',
        styles.container,
        fullWidth && 'w-full',
        disabled && 'opacity-50',
        className
      )}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : disabled || loading ? 0.5 : 1,
      })}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'ghost' || variant === 'secondary' ? '#71717a' : '#ffffff'}
        />
      ) : (
        <Text className={cn('text-base', styles.text)}>{label}</Text>
      )}
    </Pressable>
  );
}
