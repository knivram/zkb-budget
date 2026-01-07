import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { gte, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useMemo } from "react";
import { ScrollView, Text, useColorScheme, useWindowDimensions, View } from "react-native";
import { BarChart } from "react-native-gifted-charts";

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("de-CH", { month: "short" });
};

const formatAmount = (amountCents: number): string => {
  return (amountCents / 100).toLocaleString("de-CH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

export default function Analytics() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width } = useWindowDimensions();

  const sixMonthsAgo = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6);
    return date.toISOString().slice(0, 10);
  }, []);

  const { data: monthlyData } = useLiveQuery(
    db
      .select({
        month: sql<string>`strftime('%Y-%m', ${transactions.date})`.as("month"),
        income:
          sql<number>`SUM(CASE WHEN ${transactions.creditDebitIndicator} = 'credit' THEN ${transactions.amount} ELSE 0 END)`.as(
            "income"
          ),
        expenses:
          sql<number>`SUM(CASE WHEN ${transactions.creditDebitIndicator} = 'debit' THEN ${transactions.amount} ELSE 0 END)`.as(
            "expenses"
          ),
      })
      .from(transactions)
      .where(gte(transactions.date, sixMonthsAgo))
      .groupBy(sql`strftime('%Y-%m', ${transactions.date})`)
      .orderBy(sql`strftime('%Y-%m', ${transactions.date})`)
  );

  const barData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];

    return monthlyData.flatMap((item) => [
      {
        value: (item.income ?? 0) / 100,
        label: formatMonth(item.month),
        frontColor: INCOME_COLOR,
        spacing: 2,
      },
      {
        value: (item.expenses ?? 0) / 100,
        frontColor: EXPENSE_COLOR,
        spacing: 24,
      },
    ]);
  }, [monthlyData]);

  const maxValue = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return 1000;
    const max = Math.max(
      ...monthlyData.map((item) => Math.max(item.income ?? 0, item.expenses ?? 0))
    );
    return Math.ceil((max / 100) / 1000) * 1000;
  }, [monthlyData]);

  const totalIncome = useMemo(() => {
    return monthlyData?.reduce((sum, item) => sum + (item.income ?? 0), 0) ?? 0;
  }, [monthlyData]);

  const totalExpenses = useMemo(() => {
    return monthlyData?.reduce((sum, item) => sum + (item.expenses ?? 0), 0) ?? 0;
  }, [monthlyData]);

  const chartWidth = width - 80;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        <View className="mb-6 flex-row justify-between">
          <View className="flex-1 mr-2 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400">
              Total Income
            </Text>
            <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-200">
              CHF {formatAmount(totalIncome)}
            </Text>
          </View>
          <View className="flex-1 ml-2 rounded-xl bg-rose-50 p-4 dark:bg-rose-900/30">
            <Text className="text-sm text-rose-600 dark:text-rose-400">
              Total Expenses
            </Text>
            <Text className="text-xl font-bold text-rose-700 dark:text-rose-200">
              CHF {formatAmount(totalExpenses)}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            Monthly Overview
          </Text>
          <Text className="text-sm text-zinc-500">Last 6 months</Text>
        </View>

        {barData.length > 0 ? (
          <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
            <BarChart
              data={barData}
              barWidth={16}
              spacing={2}
              roundedTop
              roundedBottom
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{
                color: isDark ? "#a1a1aa" : "#71717a",
                fontSize: 10,
              }}
              xAxisLabelTextStyle={{
                color: isDark ? "#a1a1aa" : "#71717a",
                fontSize: 10,
              }}
              noOfSections={4}
              maxValue={maxValue}
              width={chartWidth}
              isAnimated
              animationDuration={500}
              barBorderRadius={4}
              yAxisLabelPrefix="CHF "
              formatYLabel={(label) => formatAmount(parseFloat(label) * 100)}
            />

            <View className="mt-4 flex-row justify-center gap-6">
              <View className="flex-row items-center">
                <View
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: INCOME_COLOR }}
                />
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Income
                </Text>
              </View>
              <View className="flex-row items-center">
                <View
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{ backgroundColor: EXPENSE_COLOR }}
                />
                <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                  Expenses
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View className="items-center justify-center py-20">
            <Text className="text-zinc-500">No transaction data available</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Import transactions to see your spending analytics
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
