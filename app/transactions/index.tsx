import AmountText from "@/components/AmountText";
import DomainLogo from "@/components/DomainLogo";
import { db } from "@/db/client";
import { Category, transactions, type Transaction } from "@/db/schema";
import { Host, Image as SwiftImage } from "@expo/ui/swift-ui";
import { FlashList } from "@shopify/flash-list";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import ImportTransactions from "./import-transactions";

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

const CATEGORIES: Record<
  Category,
  { label: string; icon: Parameters<typeof SwiftImage>[0]["systemName"] }
> = {
  income: {
    label: "Income",
    icon: "dollarsign.circle",
  },
  transfer: {
    label: "Transfers",
    icon: "arrow.left.arrow.right",
  },
  housing: {
    label: "Housing",
    icon: "house.fill",
  },
  food: {
    label: "Groceries & Food",
    icon: "cart.fill",
  },
  utilities: {
    label: "Utilities",
    icon: "bolt.fill",
  },
  transport: {
    label: "Transportation",
    icon: "car.fill",
  },
  healthcare: {
    label: "Healthcare & Insurance",
    icon: "cross.case.fill",
  },
  dining: {
    label: "Restaurants & Dining",
    icon: "fork.knife",
  },
  shopping: {
    label: "Shopping & Retail",
    icon: "bag.fill",
  },
  entertainment: {
    label: "Entertainment",
    icon: "tv",
  },
  personal_care: {
    label: "Personal Care & Fitness",
    icon: "figure.run",
  },
  other: {
    label: "Other",
    icon: "questionmark.circle",
  },
};

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

export default function Transactions() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data } = useLiveQuery(
    db.select().from(transactions).orderBy(desc(transactions.date)),
  );

  const { items } = useMemo(() => groupTransactionsByMonth(data ?? []), [data]);

  return (
    <>
      <Stack.Screen
        options={{
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
        renderItem={({ item }) => {
          if (item.type === "header") {
            return (
              <View className="flex-row justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
                <Text className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                  {item.month} {item.year}
                </Text>
                <AmountText
                  amountCents={item.sum}
                  className="text-sm font-semibold text-zinc-600 dark:text-zinc-300"
                />
              </View>
            );
          }

          const transaction = item.data;
          const name =
            transaction.displayName ?? transaction.transactionAdditionalDetails;
          const categoryConfig = CATEGORIES[transaction.category];
          const isCredit = transaction.creditDebitIndicator === "credit";

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
                <AmountText
                  amountCents={transaction.signedAmount}
                  className={`text-base font-semibold ${
                    isCredit
                      ? "text-emerald-700 dark:text-emerald-200"
                      : "text-rose-800 dark:text-rose-200"
                  }`}
                />
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
