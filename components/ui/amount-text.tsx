import { Text } from 'react-native';

import { cn } from '@/lib/utils';

type AmountTextProps = {
  amountCents: number;
  className?: string;
  showCurrency?: boolean;
  currency?: string;
  roundToDollars?: boolean;
  tone?: 'auto' | 'neutral' | 'positive' | 'negative';
};

const formatAmount = (
  amountCents: number,
  showCurrency: boolean,
  currency: string,
  roundToDollars: boolean
): string => {
  const rounded = Math.round(amountCents);
  const formatted = (rounded / 100).toLocaleString('de-CH', {
    minimumFractionDigits: roundToDollars ? 0 : 2,
    maximumFractionDigits: roundToDollars ? 0 : 2,
  });
  return showCurrency ? `${currency} ${formatted}` : formatted;
};

export default function AmountText({
  amountCents,
  className,
  showCurrency = true,
  currency = 'CHF',
  roundToDollars = false,
  tone = 'auto',
}: AmountTextProps) {
  const resolvedTone = tone === 'auto' ? (amountCents >= 0 ? 'positive' : 'negative') : tone;
  const toneClasses = {
    positive: 'text-emerald-600 dark:text-emerald-300',
    negative: 'text-rose-600 dark:text-rose-300',
    neutral: 'text-slate-900 dark:text-white',
  } as const;

  return (
    <Text className={cn('text-base font-semibold', toneClasses[resolvedTone], className)}>
      {formatAmount(amountCents, showCurrency, currency, roundToDollars)}
    </Text>
  );
}
