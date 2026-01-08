import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { eq, gte, sql } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useColorScheme, useWindowDimensions, View } from "react-native";
import { BarChart, PieChart } from "react-native-gifted-charts";

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";

const CATEGORY_COLORS: Record<string, string> = {
  housing: "#3b82f6",
  food: "#10b981",
  transport: "#f59e0b",
  utilities: "#8b5cf6",
  healthcare: "#ec4899",
  dining: "#f43f5e",
  shopping: "#06b6d4",
  entertainment: "#a855f7",
  personal_care: "#14b8a6",
  transfer: "#6366f1",
  other: "#64748b",
};

const CATEGORY_LABELS: Record<string, string> = {
  housing: "Housing",
  food: "Food",
  transport: "Transport",
  utilities: "Utilities",
  healthcare: "Healthcare",
  dining: "Dining",
  shopping: "Shopping",
  entertainment: "Entertainment",
  personal_care: "Personal",
  transfer: "Transfer",
  other: "Other",
};

const formatMonth = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("de-CH", { month: "short" });
};

const formatMonthFull = (monthStr: string): string => {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("de-CH", { month: "long", year: "numeric" });
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

  // Default to current month
  const currentMonth = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

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

  // Query for selected month income/expenses
  const { data: selectedMonthData } = useLiveQuery(
    db
      .select({
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
      .where(sql`strftime('%Y-%m', ${transactions.date}) = ${selectedMonth}`)
  );

  // Query for category breakdown for selected month (expenses only)
  const { data: categoryData } = useLiveQuery(
    db
      .select({
        category: transactions.category,
        total: sql<number>`SUM(${transactions.amount})`.as("total"),
      })
      .from(transactions)
      .where(
        sql`strftime('%Y-%m', ${transactions.date}) = ${selectedMonth} AND ${transactions.creditDebitIndicator} = 'debit'`
      )
      .groupBy(transactions.category)
      .orderBy(sql`SUM(${transactions.amount}) DESC`)
  );

  const barData = useMemo(() => {
    if (!monthlyData || monthlyData.length === 0) return [];

    return monthlyData.flatMap((item, index) => [
      {
        value: (item.income ?? 0) / 100,
        label: formatMonth(item.month),
        frontColor: INCOME_COLOR,
        spacing: 2,
        labelTextStyle: { fontSize: 10 },
      },
      {
        value: (item.expenses ?? 0) / 100,
        label: "",
        frontColor: EXPENSE_COLOR,
        spacing: index === monthlyData.length - 1 ? 0 : 24,
        labelTextStyle: { fontSize: 10 },
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

  const monthIncome = selectedMonthData?.[0]?.income ?? 0;
  const monthExpenses = selectedMonthData?.[0]?.expenses ?? 0;

  const pieData = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [];

    return categoryData
      .filter((item) => item.category !== "income" && item.category !== "transfer")
      .map((item) => ({
        value: (item.total ?? 0) / 100,
        color: CATEGORY_COLORS[item.category ?? "other"] ?? CATEGORY_COLORS.other,
        text: CATEGORY_LABELS[item.category ?? "other"] ?? "Other",
        label: formatAmount(item.total ?? 0),
      }));
  }, [categoryData]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`);
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  const chartWidth = width - 80;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        {/* Month Switcher */}
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable
            onPress={handlePreviousMonth}
            className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800"
          >
            <ChevronLeft size={24} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>
          <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
            {formatMonthFull(selectedMonth)}
          </Text>
          <Pressable
            onPress={handleNextMonth}
            disabled={isCurrentMonth}
            className="rounded-lg bg-zinc-100 p-2 dark:bg-zinc-800"
            style={{ opacity: isCurrentMonth ? 0.5 : 1 }}
          >
            <ChevronRight size={24} color={isDark ? "#a1a1aa" : "#71717a"} />
          </Pressable>
        </View>

        {/* Month-specific Income/Expense Cards */}
        <View className="mb-6 flex-row justify-between">
          <View className="flex-1 mr-2 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400">
              Income
            </Text>
            <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-200">
              CHF {formatAmount(monthIncome)}
            </Text>
          </View>
          <View className="flex-1 ml-2 rounded-xl bg-rose-50 p-4 dark:bg-rose-900/30">
            <Text className="text-sm text-rose-600 dark:text-rose-400">
              Expenses
            </Text>
            <Text className="text-xl font-bold text-rose-700 dark:text-rose-200">
              CHF {formatAmount(monthExpenses)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown Pie Chart */}
        {pieData.length > 0 && (
          <View className="mb-6">
            <View className="mb-4">
              <Text className="text-lg font-semibold text-zinc-900 dark:text-white">
                Spending by Category
              </Text>
              <Text className="text-sm text-zinc-500">
                {formatMonthFull(selectedMonth)}
              </Text>
            </View>
            <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              <View className="items-center">
                <PieChart
                  data={pieData}
                  donut
                  radius={100}
                  innerRadius={60}
                  centerLabelComponent={() => (
                    <View className="items-center">
                      <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                        Total
                      </Text>
                      <Text className="text-base font-semibold text-zinc-900 dark:text-white">
                        CHF {formatAmount(monthExpenses)}
                      </Text>
                    </View>
                  )}
                />
              </View>
              <View className="mt-4 flex-row flex-wrap justify-center gap-x-4 gap-y-2">
                {pieData.map((item, index) => (
                  <View key={index} className="flex-row items-center">
                    <View
                      className="mr-1.5 h-3 w-3 rounded-sm"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                      {item.text}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

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
                width: 50,
                textAlign: "center",
              }}
              noOfSections={4}
              maxValue={maxValue}
              width={chartWidth}
              isAnimated
              animationDuration={500}
              barBorderRadius={4}
              yAxisLabelPrefix="CHF "
              formatYLabel={(label) => formatAmount(parseFloat(label) * 100)}
              hideRules
              xAxisLabelsVerticalShift={2}
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
