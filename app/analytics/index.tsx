import SpendingByCategory from '@/components/SpendingByCategory';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { formatYearMonth } from '@/lib/date';
import { cn } from '@/lib/utils';
import { and, count, desc, eq, isNotNull, notInArray, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

const formatMonthFull = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
};

const monthFilter = (month: string) => sql`strftime('%Y-%m', ${transactions.date}) = ${month}`;

export default function Analytics() {
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
      className="flex-1 bg-white dark:bg-zinc-950"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={handlePreviousMonth}
            className="h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700"
          >
            <ChevronLeft size={20} color="#71717a" strokeWidth={2} />
          </Pressable>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            disabled={isCurrentMonth}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-xl',
              isCurrentMonth
                ? 'bg-zinc-50 dark:bg-zinc-900'
                : 'bg-zinc-100 active:bg-zinc-200 dark:bg-zinc-800 dark:active:bg-zinc-700'
            )}
          >
            <ChevronRight
              size={20}
              color={isCurrentMonth ? '#d4d4d8' : '#71717a'}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        <View className="mb-4 flex-row justify-between">
          <View className="mr-2 flex-1 rounded-2xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400">Income</Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              className="text-xl font-bold text-emerald-700 dark:text-emerald-200"
            />
          </View>
          <View className="ml-2 flex-1 rounded-2xl bg-rose-50 p-4 dark:bg-rose-900/30">
            <Text className="text-sm text-rose-600 dark:text-rose-400">Expenses</Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              className="text-xl font-bold text-rose-700 dark:text-rose-200"
            />
          </View>
        </View>

        {expenseChange !== null && (
          <View className="mb-6 flex-row items-center justify-center rounded-2xl bg-zinc-50 p-3 dark:bg-zinc-900">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#f43f5e" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#10b981" />
            ) : null}
            <Text
              className={cn(
                'ml-2 text-sm font-medium',
                expenseChange > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : expenseChange < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400'
              )}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </View>
        )}

        {categoryData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Spending by Category
            </Text>
            <View className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
              <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
            </View>
          </View>
        )}

        {merchantData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Top Merchants
            </Text>
            <View className="rounded-2xl bg-zinc-50 p-4 dark:bg-zinc-900">
              {merchantData.map((merchant, index) => (
                <View
                  key={merchant.displayName ?? index}
                  className={cn(
                    'flex-row items-center',
                    index < merchantData.length - 1 &&
                      'mb-3 border-b border-zinc-200 pb-3 dark:border-zinc-700'
                  )}
                >
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={40}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-medium text-zinc-900 dark:text-zinc-50"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                      {merchant.count} transaction
                      {merchant.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    className="text-sm font-semibold text-zinc-900 dark:text-zinc-50"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {categoryData.length === 0 && merchantData.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-zinc-500">No transaction data available</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Import transactions to see your spending analytics
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
