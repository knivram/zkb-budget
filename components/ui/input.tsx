import { cn } from '@/lib/utils';
import { TextInput, TextInputProps } from 'react-native';

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'rounded-2xl border border-border bg-surface px-4 text-base text-ink dark:border-border-dark dark:bg-surface-dark dark:text-ink-dark',
        className
      )}
      style={[
        {
          height: 44,
          lineHeight: 20,
          paddingVertical: 0,
          paddingBottom: 4,
        },
      ]}
      placeholderTextColor="#9aa4b2"
      multiline={false}
      {...props}
    />
  );
}
