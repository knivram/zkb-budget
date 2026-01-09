import DomainLogo from "@/components/DomainLogo";
import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { CATEGORIES } from "@/lib/categories";
import { Button, Host, Image as SwiftImage } from "@expo/ui/swift-ui";
import { scaleEffect } from "@expo/ui/swift-ui/modifiers";
import { sql } from "drizzle-orm";
import { TrendingDown, TrendingUp } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";

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
  // Current month (for limiting forward navigation)
  const currentMonth = useMemo(() => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // Default to previous month (more likely to have complete data)
  const defaultMonth = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);

  // Calculate previous month for comparison
  const previousMonth = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 2);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }, [selectedMonth]);

  // State for query results
  const [selectedMonthData, setSelectedMonthData] = useState<
    { income: number | null; expenses: number | null }[]
  >([]);
  const [previousMonthData, setPreviousMonthData] = useState<
    { expenses: number | null }[]
  >([]);
  const [categoryData, setCategoryData] = useState<
    { category: string | null; total: number | null }[]
  >([]);
  const [merchantData, setMerchantData] = useState<
    {
      displayName: string | null;
      domain: string | null;
      total: number | null;
      count: number | null;
    }[]
  >([]);

  // Fetch selected month income/expenses
  useEffect(() => {
    const fetchData = async () => {
      const result = await db
        .select({
          income:
            sql<number>`SUM(CASE WHEN ${transactions.creditDebitIndicator} = 'credit' THEN ${transactions.amount} ELSE 0 END)`.as(
              "income",
            ),
          expenses:
            sql<number>`SUM(CASE WHEN ${transactions.creditDebitIndicator} = 'debit' THEN ${transactions.amount} ELSE 0 END)`.as(
              "expenses",
            ),
        })
        .from(transactions)
        .where(sql`strftime('%Y-%m', ${transactions.date}) = ${selectedMonth}`);
      setSelectedMonthData(result);
    };
    fetchData();
  }, [selectedMonth]);

  // Fetch previous month expenses (for comparison)
  useEffect(() => {
    const fetchData = async () => {
      const result = await db
        .select({
          expenses:
            sql<number>`SUM(CASE WHEN ${transactions.creditDebitIndicator} = 'debit' THEN ${transactions.amount} ELSE 0 END)`.as(
              "expenses",
            ),
        })
        .from(transactions)
        .where(sql`strftime('%Y-%m', ${transactions.date}) = ${previousMonth}`);
      setPreviousMonthData(result);
    };
    fetchData();
  }, [previousMonth]);

  // Fetch category breakdown for selected month (expenses only)
  useEffect(() => {
    const fetchData = async () => {
      const result = await db
        .select({
          category: transactions.category,
          total: sql<number>`SUM(${transactions.amount})`.as("total"),
        })
        .from(transactions)
        .where(
          sql`strftime('%Y-%m', ${transactions.date}) = ${selectedMonth} AND ${transactions.creditDebitIndicator} = 'debit'`,
        )
        .groupBy(transactions.category)
        .orderBy(sql`SUM(${transactions.amount}) DESC`);
      setCategoryData(result);
    };
    fetchData();
  }, [selectedMonth]);

  // Fetch top merchants
  useEffect(() => {
    const fetchData = async () => {
      const result = await db
        .select({
          displayName: transactions.displayName,
          domain: transactions.domain,
          total: sql<number>`SUM(${transactions.amount})`.as("total"),
          count: sql<number>`COUNT(*)`.as("count"),
        })
        .from(transactions)
        .where(
          sql`strftime('%Y-%m', ${transactions.date}) = ${selectedMonth} AND ${transactions.creditDebitIndicator} = 'debit' AND ${transactions.displayName} IS NOT NULL`,
        )
        .groupBy(transactions.displayName, transactions.domain)
        .orderBy(sql`SUM(${transactions.amount}) DESC`)
        .limit(6);
      setMerchantData(result);
    };
    fetchData();
  }, [selectedMonth]);

  const monthIncome = selectedMonthData?.[0]?.income ?? 0;
  const monthExpenses = selectedMonthData?.[0]?.expenses ?? 0;
  const prevMonthExpenses = previousMonthData?.[0]?.expenses ?? 0;

  // Calculate month-over-month change
  const expenseChange = useMemo(() => {
    if (prevMonthExpenses === 0) return null;
    const change =
      ((monthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100;
    return Math.round(change);
  }, [monthExpenses, prevMonthExpenses]);

  // Filter and process category data for display
  const displayCategories = useMemo(() => {
    if (!categoryData || categoryData.length === 0) return [];

    return categoryData.filter(
      (item) => item.category !== "income" && item.category !== "transfer",
    );
  }, [categoryData]);

  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    setSelectedMonth(
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    );
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="p-4">
        {/* Month Switcher */}
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

        {/* Month-specific Income/Expense Cards */}
        <View className="mb-4 flex-row justify-between">
          <View className="mr-2 flex-1 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/30">
            <Text className="text-sm text-emerald-600 dark:text-emerald-400">
              Income
            </Text>
            <Text className="text-xl font-bold text-emerald-700 dark:text-emerald-200">
              CHF {formatAmount(monthIncome)}
            </Text>
          </View>
          <View className="ml-2 flex-1 rounded-xl bg-rose-50 p-4 dark:bg-rose-900/30">
            <Text className="text-sm text-rose-600 dark:text-rose-400">
              Expenses
            </Text>
            <Text className="text-xl font-bold text-rose-700 dark:text-rose-200">
              CHF {formatAmount(monthExpenses)}
            </Text>
          </View>
        </View>

        {/* Month-over-Month Comparison */}
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
                  ? "text-rose-600 dark:text-rose-400"
                  : expenseChange < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {expenseChange === 0
                ? "Same as last month"
                : `${Math.abs(expenseChange)}% ${expenseChange > 0 ? "more" : "less"} than last month`}
            </Text>
          </View>
        )}

        {/* Category Breakdown */}
        {displayCategories.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Spending by Category
            </Text>
            <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              {(() => {
                // Find max value for relative bar widths
                const maxTotal = Math.max(
                  ...displayCategories.map((item) => item.total ?? 0),
                );

                return displayCategories.map((item, index) => {
                  const percentage =
                    monthExpenses > 0
                      ? Math.round(((item.total ?? 0) / monthExpenses) * 100)
                      : 0;
                  // Bar width relative to max category (highest = ~90%)
                  const relativeWidth =
                    maxTotal > 0
                      ? Math.round(((item.total ?? 0) / maxTotal) * 90)
                      : 0;
                  const categoryKey = (item.category ??
                    "other") as keyof typeof CATEGORIES;
                  const categoryConfig =
                    CATEGORIES[categoryKey] ?? CATEGORIES.other;

                  return (
                    <View
                      key={item.category ?? index}
                      className={
                        index < displayCategories.length - 1 ? "mb-4" : ""
                      }
                    >
                      <View className="mb-1.5 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <View
                            className="mr-2 h-8 w-8 items-center justify-center rounded"
                            style={{ backgroundColor: categoryConfig.color }}
                          >
                            <Host matchContents>
                              <SwiftImage
                                systemName={categoryConfig.icon}
                                size={14}
                              />
                            </Host>
                          </View>
                          <Text className="text-sm text-zinc-700 dark:text-zinc-300">
                            {categoryConfig.label}
                          </Text>
                        </View>
                        <Text className="text-sm font-medium text-zinc-900 dark:text-white">
                          CHF {formatAmount(item.total ?? 0)}
                        </Text>
                      </View>
                      <View className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <View
                          className="h-full rounded-full"
                          style={{
                            backgroundColor: categoryConfig.color,
                            width: `${relativeWidth}%`,
                          }}
                        />
                      </View>
                      <Text className="mt-1 text-xs text-zinc-500">
                        {percentage}%
                      </Text>
                    </View>
                  );
                });
              })()}
            </View>
          </View>
        )}

        {/* Top Merchants */}
        {merchantData && merchantData.length > 0 && (
          <View className="mb-6">
            <Text className="mb-4 text-lg font-semibold text-zinc-900 dark:text-white">
              Top Merchants
            </Text>
            <View className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
              {merchantData.map((merchant, index) => (
                <View
                  key={merchant.displayName ?? index}
                  className={`flex-row items-center ${index < merchantData.length - 1 ? "mb-3 border-b border-zinc-200 pb-3 dark:border-zinc-700" : ""}`}
                >
                  <DomainLogo
                    domain={merchant.domain ?? undefined}
                    name={merchant.displayName ?? ""}
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
                      {(merchant.count ?? 0) !== 1 ? "s" : ""}
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

        {/* Empty State */}
        {(!displayCategories || displayCategories.length === 0) &&
          (!merchantData || merchantData.length === 0) && (
            <View className="items-center justify-center py-20">
              <Text className="text-zinc-500">
                No transaction data available
              </Text>
              <Text className="mt-2 text-sm text-zinc-400">
                Import transactions to see your spending analytics
              </Text>
            </View>
          )}
      </View>
    </ScrollView>
  );
}
