import { cn } from '@/lib/utils';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
};

export default function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: ActionButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(
        'items-center justify-center rounded-xl py-3.5',
        variant === 'primary' ? 'bg-accent dark:bg-accent-dark' : 'bg-gray-100 dark:bg-gray-800',
        isDisabled && 'opacity-50'
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#ffffff' : '#8e8e93'} />
      ) : (
        <Text
          className={cn(
            'text-base font-semibold',
            variant === 'primary' ? 'text-white' : 'text-gray-900 dark:text-gray-100'
          )}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
