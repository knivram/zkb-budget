import { cn } from '@/lib/utils';
import { TextInput, TextInputProps } from 'react-native';

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'rounded-xl bg-stone-100 px-4 text-base text-stone-900 dark:bg-stone-800 dark:text-stone-50',
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
      placeholderTextColor="#a8a29e"
      multiline={false}
      {...props}
    />
  );
}
