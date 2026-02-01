import { Text } from 'react-native';

import { cn } from '@/lib/utils';

type SectionTitleProps = {
  title: string;
  className?: string;
};

export function SectionTitle({ title, className }: SectionTitleProps) {
  return (
    <Text
      className={cn(
        'mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400',
        className
      )}
    >
      {title}
    </Text>
  );
}
