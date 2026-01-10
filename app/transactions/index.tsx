import AmountText from "@/components/AmountText";
import DomainLogo from "@/components/DomainLogo";
import { db } from "@/db/client";
import { transactions, type Transaction } from "@/db/schema";
import { CATEGORIES } from "@/lib/categories";
import { Host, Image as SwiftImage } from "@expo/ui/swift-ui";
import { FlashList } from "@shopify/flash-list";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";
import { LineChart } from "react-native-gifted-charts";
import ImportTransactions from "./import-transactions";

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#f43f5e";

type SectionHeader = {
  type: "header";
  month: string;
  year: number;
  key: string;
  sum: number;
};

type TransactionItem = {
  type: "transaction";
  data: Transaction;
};

type ListItem = SectionHeader | TransactionItem;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMonthHeader = (
  dateStr: string,
): { month: string; year: number } => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString("de-CH", { month: "long" });
  const year = date.getFullYear();
  return { month, year };
};

const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const groupTransactionsByMonth = (
  transactionsList: Transaction[],
): { items: ListItem[] } => {
  const items: ListItem[] = [];
  let currentMonthKey = "";
  let currentMonthIndex = 0;

  for (const transaction of transactionsList) {
    const monthKey = getMonthKey(transaction.date);

    if (monthKey !== currentMonthKey) {
      const { month, year } = formatMonthHeader(transaction.date);
      const newLength = items.push({
        type: "header",
        month,
        year,
        key: monthKey,
        sum: 0,
      });
      currentMonthKey = monthKey;
      currentMonthIndex = newLength - 1;
    }

    items.push({
      type: "transaction",
      data: transaction,
    });
    items[currentMonthIndex] = {
      ...items[currentMonthIndex],
      sum:
        (items[currentMonthIndex] as SectionHeader).sum +
        transaction.signedAmount,
    } as SectionHeader;
  }

  return { items };
};

type DailyData = {
  date: string;
  income: number;
  expense: number;
  index: number;
};

const aggregateByDay = (
  transactionsList: Transaction[]
): { dailyData: DailyData[]; dateToIndex: Map<string, number> } => {
  const dailyMap = new Map<string, { income: number; expense: number }>();

  // Group transactions by date
  for (const tx of transactionsList) {
    const dateKey = tx.date.slice(0, 10); // YYYY-MM-DD
    const existing = dailyMap.get(dateKey) ?? { income: 0, expense: 0 };
    if (tx.creditDebitIndicator === "credit") {
      existing.income += tx.amount;
    } else {
      existing.expense += tx.amount;
    }
    dailyMap.set(dateKey, existing);
  }

  // Sort by date ascending for the chart (oldest first)
  const sortedDates = Array.from(dailyMap.keys()).sort();

  const dailyData: DailyData[] = sortedDates.map((date, index) => ({
    date,
    income: dailyMap.get(date)!.income,
    expense: dailyMap.get(date)!.expense,
    index,
  }));

  const dateToIndex = new Map<string, number>();
  dailyData.forEach((d, i) => dateToIndex.set(d.date, i));

  return { dailyData, dateToIndex };
};

const formatDayLabel = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-CH", { day: "numeric", month: "short" });
};

// Constants for chart dimensions
const POINT_WIDTH = 60; // Width per data point in chart
const CHART_HEIGHT = 180;

export default function Transactions() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { width: screenWidth } = useWindowDimensions();

  const chartScrollRef = useRef<ScrollView>(null);
  const isScrollingFromList = useRef(false);
  const isScrollingFromChart = useRef(false);

  const { data } = useLiveQuery(
    db.select().from(transactions).orderBy(desc(transactions.date)),
  );

  const { items } = useMemo(() => groupTransactionsByMonth(data ?? []), [data]);
  const { dailyData, dateToIndex } = useMemo(
    () => aggregateByDay(data ?? []),
    [data]
  );

  // Calculate chart dimensions
  const chartWidth = Math.max(dailyData.length * POINT_WIDTH, screenWidth - 32);

  // Prepare line chart data
  const incomeLineData = useMemo(() => {
    return dailyData.map((d, i) => ({
      value: d.income / 100,
      label: i % 3 === 0 ? formatDayLabel(d.date) : "",
      dataPointText: "",
    }));
  }, [dailyData]);

  const expenseLineData = useMemo(() => {
    return dailyData.map((d) => ({
      value: d.expense / 100,
      dataPointText: "",
    }));
  }, [dailyData]);

  const maxValue = useMemo(() => {
    if (dailyData.length === 0) return 1000;
    const max = Math.max(
      ...dailyData.map((d) => Math.max(d.income, d.expense))
    );
    return Math.ceil((max / 100) / 500) * 500 || 1000;
  }, [dailyData]);

  // Handle list scroll to sync with chart
  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrollingFromChart.current) return;

      const offsetY = event.nativeEvent.contentOffset.y;
      // Estimate which item is visible (rough calculation based on row height)
      const estimatedRowHeight = 80;
      const visibleIndex = Math.floor(offsetY / estimatedRowHeight);

      // Find the date of a visible transaction
      let targetDate: string | undefined;
      for (let i = visibleIndex; i < visibleIndex + 10 && i < items.length; i++) {
        const item = items[i];
        if (item?.type === "transaction") {
          targetDate = item.data.date.slice(0, 10);
          break;
        }
      }

      if (targetDate && chartScrollRef.current) {
        const chartIndex = dateToIndex.get(targetDate);
        if (chartIndex !== undefined) {
          isScrollingFromList.current = true;
          // Scroll chart to show this date (from right side since chart is oldest-first)
          const totalDays = dailyData.length;
          // Since list is newest-first and chart is oldest-first, invert position
          const targetX = Math.max(
            0,
            (totalDays - chartIndex - 1) * POINT_WIDTH - screenWidth / 2
          );
          chartScrollRef.current.scrollTo({ x: targetX, animated: false });
          setTimeout(() => {
            isScrollingFromList.current = false;
          }, 100);
        }
      }
    },
    [items, dateToIndex, dailyData.length, screenWidth]
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: "Transactions",
          headerLargeTitle: false,
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Import",
              icon: {
                name: "square.and.arrow.down",
                type: "sfSymbol",
              },
              variant: "prominent",
              onPress: () => setIsImportOpen(true),
            },
          ],
        }}
      />
      <FlashList
        className="flex-1 bg-white dark:bg-zinc-900"
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) =>
          item.type === "header" ? item.key : item.data.id
        }
        getItemType={(item) => item.type}
        onScroll={handleListScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          dailyData.length > 0 ? (
            <View className="bg-white dark:bg-zinc-900">
              <View className="mx-4 mt-2 mb-4 overflow-hidden rounded-xl bg-zinc-50 dark:bg-zinc-800">
                <ScrollView
                  ref={chartScrollRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 8 }}
                >
                  <LineChart
                    data={incomeLineData}
                    data2={expenseLineData}
                    height={CHART_HEIGHT}
                    width={chartWidth}
                    spacing={POINT_WIDTH}
                    initialSpacing={20}
                    endSpacing={20}
                    color1={INCOME_COLOR}
                    color2={EXPENSE_COLOR}
                    dataPointsColor1={INCOME_COLOR}
                    dataPointsColor2={EXPENSE_COLOR}
                    dataPointsRadius={4}
                    thickness={2}
                    hideRules
                    hideYAxisText
                    hideAxesAndRules
                    curved
                    curvature={0.2}
                    areaChart
                    startFillColor1={INCOME_COLOR}
                    endFillColor1={INCOME_COLOR}
                    startOpacity1={0.3}
                    endOpacity1={0.05}
                    startFillColor2={EXPENSE_COLOR}
                    endFillColor2={EXPENSE_COLOR}
                    startOpacity2={0.3}
                    endOpacity2={0.05}
                    xAxisLabelTextStyle={{
                      color: isDark ? "#a1a1aa" : "#71717a",
                      fontSize: 10,
                    }}
                    maxValue={maxValue}
                    noOfSections={4}
                    isAnimated
                    animationDuration={500}
                  />
                </ScrollView>
                {/* Legend */}
                <View className="flex-row justify-center gap-6 pb-3">
                  <View className="flex-row items-center">
                    <View
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: INCOME_COLOR }}
                    />
                    <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                      Income
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className="mr-2 h-3 w-3 rounded-full"
                      style={{ backgroundColor: EXPENSE_COLOR }}
                    />
                    <Text className="text-xs text-zinc-600 dark:text-zinc-400">
                      Expenses
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View className="flex-row justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <Text className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {item.month} {item.year}
                </Text>
                <AmountText amountCents={item.sum} className="text-sm" />
              </View>
            );
          }

          const transaction = item.data;
          const name =
            transaction.displayName ?? transaction.transactionAdditionalDetails;
          const categoryConfig = CATEGORIES[transaction.category];

          return (
            <View className="flex-row border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <DomainLogo
                domain={transaction.domain}
                fallbackIcon={categoryConfig.icon}
                size={40}
                className="mr-3"
              />

              <View className="flex-1">
                <Text
                  className="text-base font-medium text-zinc-900 dark:text-white"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text className="text-sm text-zinc-500">
                  {formatDate(transaction.date)}
                </Text>

                <View className="mt-1 flex-row flex-wrap gap-1">
                  <View className="flex-row items-center rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                    <Host matchContents>
                      <SwiftImage systemName={categoryConfig.icon} size={12} />
                    </Host>
                    <Text className="ml-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {categoryConfig.label}
                    </Text>
                  </View>

                  {transaction.subscriptionId && (
                    <View className="flex-row items-center rounded-md bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                      <Text className="text-xs text-blue-600 dark:text-blue-400">
                        Subscription
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="items-end justify-center">
                <AmountText amountCents={transaction.signedAmount} />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-zinc-500">No transactions imported yet</Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Tap Import to add transactions from XML
            </Text>
          </View>
        }
      />
      <ImportTransactions
        isOpen={isImportOpen}
        onOpenChange={setIsImportOpen}
      />
    </>
  );
}
