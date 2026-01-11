import DomainLogo from '@/components/DomainLogo';
import SpendingByCategory, { CategoryItem } from '@/components/SpendingByCategory';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { Button, Host } from '@expo/ui/swift-ui';
import { scaleEffect } from '@expo/ui/swift-ui/modifiers';
import { and, count, desc, eq, isNotNull, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

const formatMonthFull = (monthStr: string): string => {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
};

const formatAmount = (amountCents: number): string => {
  return (amountCents / 100).toLocaleString('de-CH', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function Analytics() {
  // Current month (for limiting forward navigation)
  const currentMonth = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  // Default to previous month (more likely to have complete data)
  const defaultMonth = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Calculate previous month for comparison
  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }, [selectedMonth]);

  // Helper to filter by month using strftime
  const monthFilter = (month: string) => sql`strftime('%Y-%m', ${transactions.date}) = ${month}`;

  // Query: Selected month income/expenses
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

  // Query: Previous month expenses (for comparison)
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

  // Query: Category breakdown for selected month (expenses only)
  const { data: categoryData } = useLiveQuery(
    db
      .select({
        category: transactions.category,
        total: sum(transactions.amount).mapWith(Number),
      })
      .from(transactions)
      .where(and(monthFilter(selectedMonth), eq(transactions.creditDebitIndicator, 'debit')))
      .groupBy(transactions.category)
      .orderBy(desc(sum(transactions.amount))),
    [selectedMonth]
  );

  // Query: Top merchants for selected month
  const { data: merchantData } = useLiveQuery(
    db
      .select({
        displayName: transactions.displayName,
        domain: transactions.domain,
        total: sum(transactions.amount).mapWith(Number),
        count: count().mapWith(Number),
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
      .orderBy(desc(sum(transactions.amount)))
      .limit(6),
    [selectedMonth]
  );

  const monthIncome = selectedMonthData?.[0]?.income ?? 0;
  const monthExpenses = selectedMonthData?.[0]?.expenses ?? 0;
  const prevMonthExpenses = previousMonthData?.[0]?.expenses ?? 0;

  // Calculate month-over-month change
  const expenseChange = useMemo(() => {
    if (prevMonthExpenses === 0) return null;
    const change = ((monthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    return Math.round(change);
  }, [monthExpenses, prevMonthExpenses]);

  // Filter and process category data for display
  const displayCategories: CategoryItem[] = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [];

    return categoryData
      .filter((item) => item.category !== 'income' && item.category !== 'transfer')
      .map((item) => ({
        category: item.category,
        total: item.total ?? 0,
      }));
  }, [categoryData]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        <View className="mb-6 flex-row items-center justify-between">
          <Host matchContents>
            <Button
              onPress={handlePreviousMonth}
              systemImage="chevron.left"
              variant="glass"
              modifiers={[scaleEffect(1.1)]}
            />
          </Host>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Host matchContents>
            <Button
              onPress={handleNextMonth}
              systemImage="chevron.right"
              disabled={isCurrentMonth}
              variant="glass"
              modifiers={[scaleEffect(1.1)]}
            />
          </Host>
        </View>

        <View className="mb-4 flex-row justify-between">
          <View className="mr-2 flex-1 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400">Income</Text>
            <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-200">
              CHF {formatAmount(monthIncome)}
            </Text>
          </View>
          <View className="ml-2 flex-1 rounded-xl bg-rose-50 p-4 dark:bg-rose-900/30">
            <Text className="text-sm text-rose-600 dark:text-rose-400">Expenses</Text>
            <Text className="text-xl font-bold text-rose-700 dark:text-rose-200">
              CHF {formatAmount(monthExpenses)}
            </Text>
          </View>
        </View>

        {expenseChange !== null && (
          <View className="mb-6 flex-row items-center justify-center rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#f43f5e" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#10b981" />
            ) : null}
            <Text
              className={`ml-2 text-sm font-medium ${
                expenseChange > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : expenseChange < 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </View>
        )}

        {displayCategories.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Spending by Category
            </Text>
            <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <SpendingByCategory
                categories={displayCategories}
                monthExpenses={monthExpenses}
                formatAmount={formatAmount}
              />
            </View>
          </View>
        )}

        {merchantData && merchantData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Top Merchants
            </Text>
            <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
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
                      className="text-sm font-medium text-zinc-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-zinc-500">
                      {merchant.count} transaction
                      {(merchant.count ?? 0) !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text className="text-sm font-semibold text-zinc-900 dark:text-white">
                    CHF {formatAmount(merchant.total ?? 0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {displayCategories.length === 0 && (!merchantData || merchantData.length === 0) ? (
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
