import SpendingByCategory from '@/components/SpendingByCategory';
import AmountText from '@/components/ui/amount-text';
import { ListRow, SectionTitle, Surface } from '@/components/ui';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions } from '@/db/schema';
import { formatYearMonth } from '@/lib/date';
import { Button, Host } from '@expo/ui/swift-ui';
import { buttonStyle, controlSize, disabled, labelStyle } from '@expo/ui/swift-ui/modifiers';
import { and, count, desc, eq, isNotNull, notInArray, sql, sum } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

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
      <View className="p-4 pb-8">
        <View className="mb-6 flex-row items-center justify-between">
          <Host matchContents>
            <Button
              onPress={handlePreviousMonth}
              label="Previous"
              systemImage="chevron.left"
              modifiers={[buttonStyle('glass'), controlSize('regular'), labelStyle('iconOnly')]}
            />
          </Host>
          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Host matchContents>
            <Button
              onPress={handleNextMonth}
              label="Next"
              systemImage="chevron.right"
              modifiers={[
                buttonStyle('glass'),
                controlSize('regular'),
                labelStyle('iconOnly'),
                disabled(isCurrentMonth),
              ]}
            />
          </Host>
        </View>

        <View className="mb-4 flex-row justify-between gap-3">
          <Surface className="flex-1 border-emerald-200 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-500/10">
            <Text className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
              Income
            </Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              tone="neutral"
              className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-200"
            />
          </Surface>
          <Surface className="flex-1 border-rose-200 bg-rose-50/60 dark:border-rose-800 dark:bg-rose-500/10">
            <Text className="text-sm font-semibold text-rose-600 dark:text-rose-300">Expenses</Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              tone="neutral"
              className="mt-2 text-xl font-bold text-rose-700 dark:text-rose-200"
            />
          </Surface>
        </View>

        {expenseChange !== null && (
          <Surface className="mb-6 flex-row items-center justify-center border-slate-200 bg-slate-100/60 dark:border-slate-800 dark:bg-slate-900/60">
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
                    : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </Surface>
        )}

        {categoryData.length > 0 && (
          <View className="mb-6">
            <SectionTitle title="Spending by Category" />
            <Surface>
              <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
            </Surface>
          </View>
        )}

        {merchantData.length > 0 && (
          <View className="mb-6">
            <SectionTitle title="Top Merchants" />
            <View className="gap-2">
              {merchantData.map((merchant, index) => (
                <ListRow key={merchant.displayName ?? index}>
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={44}
                  />
                  <View className="flex-1">
                    <Text
                      className="text-sm font-semibold text-slate-900 dark:text-white"
                      numberOfLines={1}
                    >
                      {merchant.displayName}
                    </Text>
                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                      {merchant.count} transaction
                      {merchant.count !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    tone="neutral"
                    className="text-sm font-semibold text-slate-900 dark:text-white"
                  />
                </ListRow>
              ))}
            </View>
          </View>
        )}

        {categoryData.length === 0 && merchantData.length === 0 ? (
          <Surface className="items-center justify-center py-12">
            <Text className="text-slate-500">No transaction data available</Text>
            <Text className="mt-2 text-sm text-slate-400">
              Import transactions to see your spending analytics
            </Text>
          </Surface>
        ) : null}
      </View>
    </ScrollView>
  );
}
