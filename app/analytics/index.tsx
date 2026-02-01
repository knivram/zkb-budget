import SpendingByCategory from '@/components/SpendingByCategory';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { SectionGroup } from '@/components/ui/section-group';
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
      className="flex-1 bg-stone-50 dark:bg-stone-950"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        {/* Month navigation */}
        <View className="mb-6 flex-row items-center justify-between">
          <Host matchContents>
            <Button
              onPress={handlePreviousMonth}
              label="Previous"
              systemImage="chevron.left"
              modifiers={[buttonStyle('glass'), controlSize('regular'), labelStyle('iconOnly')]}
            />
          </Host>
          <Text className="text-lg font-semibold text-stone-900 dark:text-stone-50">
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

        {/* Income / Expense summary cards */}
        <View className="mb-4 flex-row justify-between gap-3">
          <View className="flex-1 rounded-2xl bg-accent-50 p-4 dark:bg-accent-950/50">
            <Text className="text-sm text-accent-700 dark:text-accent-300">Income</Text>
            <AmountText
              amountCents={monthIncome}
              roundToDollars={true}
              className="text-xl font-bold text-accent-800 dark:text-accent-200"
            />
          </View>
          <View className="flex-1 rounded-2xl bg-rose-50 p-4 dark:bg-rose-950/50">
            <Text className="text-sm text-rose-600 dark:text-rose-300">Expenses</Text>
            <AmountText
              amountCents={monthExpenses}
              roundToDollars={true}
              className="text-xl font-bold text-rose-700 dark:text-rose-200"
            />
          </View>
        </View>

        {/* Expense trend */}
        {expenseChange !== null && (
          <View className="mb-6 flex-row items-center justify-center rounded-2xl bg-white p-3 dark:bg-stone-900">
            {expenseChange > 0 ? (
              <TrendingUp size={18} color="#e11d48" />
            ) : expenseChange < 0 ? (
              <TrendingDown size={18} color="#0d9488" />
            ) : null}
            <Text
              className={`ml-2 text-sm font-medium ${
                expenseChange > 0
                  ? 'text-rose-600 dark:text-rose-300'
                  : expenseChange < 0
                    ? 'text-accent-700 dark:text-accent-300'
                    : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              {expenseChange === 0
                ? 'Same as last month'
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? 'more' : 'less'} than last month`}
            </Text>
          </View>
        )}

        {/* Spending by category */}
        {categoryData.length > 0 && (
          <SectionGroup header="Spending by Category" className="p-4">
            <SpendingByCategory categories={categoryData} monthExpenses={monthExpenses} />
          </SectionGroup>
        )}

        {/* Top merchants — using unified ListItem */}
        {merchantData.length > 0 && (
          <SectionGroup header="Top Merchants">
            {merchantData.map((merchant, index) => (
              <ListItem
                key={merchant.displayName ?? index}
                leading={
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ''}
                    size={40}
                  />
                }
                trailing={
                  <AmountText
                    amountCents={merchant.total}
                    roundToDollars={true}
                    className="text-sm font-semibold"
                  />
                }
                showDivider={index < merchantData.length - 1}
              >
                <Text
                  className="text-sm font-medium text-stone-900 dark:text-stone-50"
                  numberOfLines={1}
                >
                  {merchant.displayName}
                </Text>
                <Text className="text-xs text-stone-500 dark:text-stone-400">
                  {merchant.count} transaction
                  {merchant.count !== 1 ? 's' : ''}
                </Text>
              </ListItem>
            ))}
          </SectionGroup>
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
