import { cn } from '@/lib/utils';
import { TextInput, TextInputProps } from 'react-native';

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'rounded-xl border border-separator bg-card px-4 text-base text-gray-900 dark:border-separator-dark dark:bg-card-dark dark:text-gray-100',
        className
      )}
      style={[
        {
          height: 48,
          lineHeight: 20,
          paddingVertical: 0,
          paddingBottom: 4,
        },
      ]}
      placeholderTextColor="#8e8e93"
      multiline={false}
      {...props}
    />
  );
}
