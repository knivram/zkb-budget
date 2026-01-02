import { db } from "@/db/client";
import { Category, transactions } from "@/db/schema";
import { Host, Image as SwiftImage } from "@expo/ui/swift-ui";
import {} from "@expo/ui/swift-ui/modifiers";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import ImportTransactions from "./import-transactions";

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

const getLogoUrl = (domain: string | null): string | null => {
  if (!domain) return null;
  return `https://img.logo.dev/${domain}?token=${process.env.EXPO_PUBLIC_LOGO_DEV_KEY}`;
};

export default function Transactions() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data } = useLiveQuery(
    db.select().from(transactions).orderBy(desc(transactions.date))
  );

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
      <FlatList
        className="flex-1 bg-white dark:bg-zinc-900"
        contentInsetAdjustmentBehavior="automatic"
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const name = item.displayName ?? item.transactionAdditionalDetails;
          const logoUrl = getLogoUrl(item.domain);
          const categoryConfig = CATEGORIES[item.category];
          const isCredit = item.creditDebitIndicator === "credit";

          return (
            <View className="flex-row border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <View className="mr-3 h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
                {logoUrl ? (
                  <Image
                    source={{ uri: logoUrl }}
                    style={{ width: 40, height: 40 }}
                    contentFit="cover"
                  />
                ) : (
                  <Text className="text-base font-medium text-zinc-400">
                    {name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              <View className="flex-1">
                <Text
                  className="text-base font-medium text-zinc-900 dark:text-white"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text className="text-sm text-zinc-500">
                  {formatDate(item.date)}
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

                  {item.subscriptionId && (
                    <View className="flex-row items-center rounded-md bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                      <Text className="text-xs text-blue-600 dark:text-blue-400">
                        Subscription
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="items-end justify-center">
                <Text
                  className={`text-base font-semibold ${
                    isCredit
                      ? "text-emerald-700 dark:text-emerald-200"
                      : "text-rose-800 dark:text-rose-200"
                  }`}
                >
                  CHF {item.signedAmount.toFixed(2)}
                </Text>
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
