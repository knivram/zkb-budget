import { cn } from '@/lib/utils';
import { TextInput, TextInputProps } from 'react-native';

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'rounded-xl bg-zinc-100 px-4 text-base text-zinc-900 dark:bg-zinc-800 dark:text-white',
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
      placeholderTextColor="#a1a1aa"
      multiline={false}
      {...props}
    />
  );
}
