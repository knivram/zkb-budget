import { cn } from "@/lib/utils";
import { Text } from "react-native";

type AmountTextProps = {
  amountCents: number;
  className?: string;
  showCurrency?: boolean;
  currency?: string;
};

const formatAmount = (
  amountCents: number,
  showCurrency: boolean,
  currency: string,
): string => {
  const rounded = Math.round(amountCents);
  const formatted = (rounded / 100).toFixed(2);
  return showCurrency ? `${currency} ${formatted}` : formatted;
};

export default function AmountText({
  amountCents,
  className,
  showCurrency = true,
  currency = "CHF",
}: AmountTextProps) {
  return (
    <Text
      className={cn(
        "text-base font-semibold",
        amountCents >= 0
          ? "text-emerald-700 dark:text-emerald-200"
          : "text-rose-800 dark:text-rose-200",
        className,
      )}
    >
      {formatAmount(amountCents, showCurrency, currency)}
    </Text>
  );
}
