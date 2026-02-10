import { cn } from '@/lib/utils';
import { Text } from 'react-native';

type AmountTextProps = {
  amountCents: number;
  className?: string;
  showCurrency?: boolean;
  currency?: string;
  roundToDollars?: boolean;
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
}: AmountTextProps) {
  return (
    <Text
      className={cn(
        'text-base font-semibold',
        amountCents >= 0
          ? 'text-success dark:text-success-dark'
          : 'text-danger dark:text-danger-dark',
        className
      )}
    >
      {formatAmount(amountCents, showCurrency, currency, roundToDollars)}
    </Text>
  );
}
