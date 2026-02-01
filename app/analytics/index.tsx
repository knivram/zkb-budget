import SpendingByCategory from '@/components/SpendingByCategory';
import AmountText from '@/components/ui/amount-text';
import { Card, CardHeader } from '@/components/ui/card';
import DomainLogo from '@/components/ui/domain-logo';
import EmptyState from '@/components/ui/empty-state';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { formatYearMonth } from '@/lib/date';
import { cn } from '@/lib/utils';
import { and, count, desc, eq, isNotNull, notInArray, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
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
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        {/* Month navigation */}
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={handlePreviousMonth}
            className="h-10 w-10 items-center justify-center rounded-full bg-card dark:bg-card-dark"
          >
            <Text className="text-lg text-accent dark:text-accent-dark">{'\u2039'}</Text>
          </Pressable>
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            disabled={isCurrentMonth}
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full bg-card dark:bg-card-dark',
              isCurrentMonth && 'opacity-30'
            )}
          >
            <Text className="text-lg text-accent dark:text-accent-dark">{'\u203A'}</Text>
          </Pressable>
        </View>

        {/* Income / Expenses */}
        <View className="mb-4 flex-row gap-3">
          <Card className="flex-1 p-4">
            <Text className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              Income
            </Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400"
            />
          </Card>
          <Card className="flex-1 p-4">
            <Text className="text-sm font-medium text-red-500 dark:text-red-400">Expenses</Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              className="mt-1 text-xl font-bold text-red-500 dark:text-red-400"
            />
          </Card>
        </View>

        {/* Trend */}
        {expenseChange !== null && (
          <Card className="mb-6 flex-row items-center justify-center p-3.5">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#ef4444" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#10b981" />
            ) : null}
            <Text
              className={`ml-2 text-sm font-medium ${
                expenseChange > 0
                  ? 'text-red-500 dark:text-red-400'
                  : expenseChange < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </Card>
        )}

        {/* Spending by Category */}
        {categoryData.length > 0 && (
          <View className="mb-6">
            <CardHeader title="Spending by Category" />
            <Card className="p-4">
              <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
            </Card>
          </View>
        )}

        {/* Top Merchants */}
        {merchantData.length > 0 && (
          <View className="mb-6">
            <CardHeader title="Top Merchants" />
            <Card className="p-4">
              {merchantData.map((merchant, index) => (
                <View
                  key={merchant.displayName ?? index}
                  className={cn(
                    'flex-row items-center',
                    index < merchantData.length - 1 &&
                      'mb-3 border-b border-separator pb-3 dark:border-separator-dark'
                  )}
                >
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={40}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-medium text-gray-900 dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-gray-500 dark:text-gray-400">
                      {merchant.count} transaction
                      {merchant.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    className="text-sm font-semibold text-gray-900 dark:text-gray-100"
                  />
                </View>
              ))}
            </Card>
          </View>
        )}

        {categoryData.length === 0 && merchantData.length === 0 ? (
          <EmptyState
            title="No transaction data available"
            subtitle="Import transactions to see your spending analytics"
          />
        ) : null}
      </View>
    </ScrollView>
  );
}
