import { TextInput, TextInputProps } from 'react-native';

import { cn } from '@/lib/utils';

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        'rounded-2xl border border-slate-200 bg-white px-4 text-base text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
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
      placeholderTextColor="#94a3b8"
      multiline={false}
      {...props}
    />
  );
}
