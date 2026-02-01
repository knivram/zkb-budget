import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { and, count, desc, eq, isNotNull, notInArray, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react-native';

import SpendingByCategory from '@/components/SpendingByCategory';
import { Button } from '@/components/ui';
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
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4 pb-10">
        <View className="mb-6 flex-row items-center justify-between">
          <Button
            onPress={handlePreviousMonth}
            variant="ghost"
            size="sm"
            className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900"
          >
            <ChevronLeft size={18} color="#64748b" />
          </Button>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Button
            onPress={handleNextMonth}
            variant="ghost"
            size="sm"
            disabled={isCurrentMonth}
            className="h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900"
          >
            <ChevronRight size={18} color={isCurrentMonth ? '#cbd5f5' : '#64748b'} />
          </Button>
        </View>

        <View className="mb-5 flex-row justify-between gap-3">
          <View className="flex-1 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/40">
            <Text className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Income
            </Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              className="text-2xl font-bold text-emerald-700 dark:text-emerald-200"
            />
          </View>
          <View className="flex-1 rounded-2xl border border-rose-100 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/40">
            <Text className="text-xs font-semibold uppercase tracking-wide text-rose-600 dark:text-rose-400">
              Expenses
            </Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              className="text-2xl font-bold text-rose-700 dark:text-rose-200"
            />
          </View>
        </View>

        {expenseChange !== null && (
          <View className="mb-6 flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#f43f5e" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#10b981" />
            ) : null}
            <Text
              className={`ml-2 text-sm font-medium ${
                expenseChange > 0
                  ? 'text-rose-600 dark:text-rose-300'
                  : expenseChange < 0
                    ? 'text-emerald-600 dark:text-emerald-300'
                    : 'text-slate-600 dark:text-slate-400'
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
            <Text className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
              Spending by Category
            </Text>
            <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
            </View>
          </View>
        )}

        {merchantData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
              Top Merchants
            </Text>
            <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              {merchantData.map((merchant, index) => (
                <View
                  key={merchant.displayName ?? index}
                  className={cn(
                    'flex-row items-center',
                    index < merchantData.length - 1 &&
                      'mb-3 border-b border-slate-200 pb-3 dark:border-slate-800'
                  )}
                >
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={40}
                  />
                  <View className="ml-3 flex-1">
                    <Text
                      className="text-sm font-medium text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {merchant.count} transaction
                      {merchant.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    className="text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </View>
              ))}
            </View>
          </View>
        )}

        {categoryData.length === 0 && merchantData.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Text className="text-slate-500">No transaction data available</Text>
            <Text className="mt-2 text-sm text-slate-400">
              Import transactions to see your spending analytics
            </Text>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
