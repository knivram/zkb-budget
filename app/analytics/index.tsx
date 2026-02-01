import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { and, count, desc, eq, isNotNull, notInArray, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native';
import SpendingByCategory from '@/components/SpendingByCategory';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { formatYearMonth } from '@/lib/date';
import { cn } from '@/lib/utils';

const formatMonthFull = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
};

const monthFilter = (month: string) => sql`strftime('%Y-%m', ${transactions.date}) = ${month}`;

export default function Analytics() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#a7b3c8' : '#5b677d';
  const { currentMonth, defaultMonth } = useMemo(() => {
    const now = new Date();
    const lastMonth = new Date(now);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    return { currentMonth: formatYearMonth(now), defaultMonth: formatYearMonth(lastMonth) };
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2);
    return formatYearMonth(date);
  }, [selectedMonth]);

  const { data: selectedMonthData } = useLiveQuery(
    db
      .select({
        income: sum(
          sql`CASE WHEN ${transactions.creditDebitIndicator} = 'credit' THEN ${transactions.amount} ELSE 0 END`
        ).mapWith(Number),
        expenses: sum(
          sql`CASE WHEN ${transactions.creditDebitIndicator} = 'debit' THEN ${transactions.amount} ELSE 0 END`
        ).mapWith(Number),
      })
      .from(transactions)
      .where(monthFilter(selectedMonth)),
    [selectedMonth]
  );

  const { data: previousMonthData } = useLiveQuery(
    db
      .select({
        expenses: sum(
          sql`CASE WHEN ${transactions.creditDebitIndicator} = 'debit' THEN ${transactions.amount} ELSE 0 END`
        ).mapWith(Number),
      })
      .from(transactions)
      .where(monthFilter(previousMonth)),
    [previousMonth]
  );

  const { data: categoryData } = useLiveQuery(
    db
      .select({
        category: transactions.category,
        total: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(
        and(
          monthFilter(selectedMonth),
          eq(transactions.creditDebitIndicator, 'debit'),
          notInArray(transactions.category, ['income', 'transfer'])
        )
      )
      .groupBy(transactions.category)
      .orderBy((ctx) => desc(ctx.total)),
    [selectedMonth]
  );

  const { data: merchantData } = useLiveQuery(
    db
      .select({
        displayName: transactions.displayName,
        domain: transactions.domain,
        total: sum(transactions.amount).mapWith(Number),
        count: count(),
      })
      .from(transactions)
      .where(
        and(
          monthFilter(selectedMonth),
          eq(transactions.creditDebitIndicator, 'debit'),
          isNotNull(transactions.displayName)
        )
      )
      .groupBy(transactions.displayName, transactions.domain)
      .orderBy((ctx) => desc(ctx.total))
      .limit(6),
    [selectedMonth]
  );

  const monthIncome = selectedMonthData[0]?.income ?? 0;
  const monthExpenses = selectedMonthData[0]?.expenses ?? 0;
  const prevMonthExpenses = previousMonthData[0]?.expenses ?? 0;

  const expenseChange = useMemo(() => {
    if (prevMonthExpenses === 0) return null;
    const change = ((monthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    return Math.round(change);
  }, [monthExpenses, prevMonthExpenses]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(formatYearMonth(date));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(formatYearMonth(date));
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <ScrollView
      className="flex-1 bg-canvas dark:bg-canvas-dark"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            className="h-10 w-10 items-center justify-center rounded-full border border-border bg-surface dark:border-border-dark dark:bg-surface-dark"
            onPress={handlePreviousMonth}
          >
            <ChevronLeft size={18} color={iconColor} />
          </Pressable>
          <Text className="text-lg font-semibold text-ink dark:text-ink-dark">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Pressable
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full border border-border bg-surface dark:border-border-dark dark:bg-surface-dark',
              isCurrentMonth && 'opacity-40'
            )}
            onPress={handleNextMonth}
            disabled={isCurrentMonth}
          >
            <ChevronRight size={18} color={iconColor} />
          </Pressable>
        </View>

        <View className="mb-4 flex-row justify-between">
          <View className="mr-2 flex-1 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            <Text className="text-xs font-semibold uppercase tracking-wide text-subtle dark:text-subtle-dark">
              Income
            </Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              className="text-xl font-bold"
            />
          </View>
          <View className="ml-2 flex-1 rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
            <Text className="text-xs font-semibold uppercase tracking-wide text-subtle dark:text-subtle-dark">
              Expenses
            </Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              className="text-xl font-bold"
            />
          </View>
        </View>

        {expenseChange !== null && (
          <View className="mb-6 flex-row items-center justify-center rounded-2xl border border-border bg-surface-muted p-3 dark:border-border-dark dark:bg-surface-muted-dark">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#e11d48" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#16a34a" />
            ) : null}
            <Text
              className={`ml-2 text-sm font-medium ${
                expenseChange > 0
                  ? 'text-danger dark:text-danger-dark'
                  : expenseChange < 0
                    ? 'text-success dark:text-success-dark'
                    : 'text-muted dark:text-muted-dark'
              }`}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </View>
        )}

        {categoryData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-ink dark:text-ink-dark">
              Spending by Category
            </Text>
            <View className="rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
              <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
            </View>
          </View>
        )}

        {merchantData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-ink dark:text-ink-dark">
              Top Merchants
            </Text>
            <View className="rounded-2xl border border-border bg-surface p-4 dark:border-border-dark dark:bg-surface-dark">
              {merchantData.map((merchant, index) => (
                <View
                  key={merchant.displayName ?? index}
                  className={cn(
                    'flex-row items-center',
                    index < merchantData.length - 1 &&
                      'mb-3 border-b border-border pb-3 dark:border-border-dark'
                  )}
                >
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={40}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-semibold text-ink dark:text-ink-dark"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-muted dark:text-muted-dark">
                      {merchant.count} transaction
                      {merchant.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    className="text-sm font-semibold text-ink dark:text-ink-dark"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {categoryData.length === 0 && merchantData.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-muted dark:text-muted-dark">No transaction data available</Text>
            <Text className="mt-2 text-sm text-subtle dark:text-subtle-dark">
              Import transactions to see your spending analytics
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
