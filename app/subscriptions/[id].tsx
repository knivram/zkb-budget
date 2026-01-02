import { db } from "@/db/client";
import { subscriptions, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { FlatList, Text, View } from "react-native";

const formatPrice = (cents: number): string => {
  return `CHF ${(cents / 100).toFixed(2)}`;
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString("de-CH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function SubscriptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriptionId = parseInt(id, 10);

  const { data: subscription } = useLiveQuery(
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, subscriptionId))
      .limit(1)
  );

  const { data: relatedTransactions } = useLiveQuery(
    db
      .select()
      .from(transactions)
      .where(eq(transactions.subscriptionId, subscriptionId))
  );

  const sub = subscription?.[0];

  if (!sub) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
        <Text className="text-zinc-500">Subscription not found</Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
      data={relatedTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View className="items-center border-b border-zinc-100 px-4 py-6 dark:border-zinc-800">
            <View className="mb-4 h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
              {sub.icon ? (
                <Image
                  source={{ uri: sub.icon }}
                  style={{ width: 80, height: 80 }}
                  contentFit="cover"
                />
              ) : (
                <Text className="text-3xl text-zinc-400">
                  {sub.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <Text className="text-2xl font-semibold text-zinc-900 dark:text-white">
              {sub.name}
            </Text>
            <Text className="mt-1 text-lg text-zinc-500">
              <Text className="capitalize">{sub.billingCycle}</Text>
              {" \u2022 "}
              {formatPrice(sub.price)}
            </Text>
            <Text className="mt-2 text-sm text-zinc-400">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.url && (
              <Text className="mt-1 text-sm text-blue-500">{sub.url}</Text>
            )}
          </View>

          <View className="border-b border-zinc-100 bg-zinc-50 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-800/50">
            <Text className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Transactions ({relatedTransactions?.length ?? 0})
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <View className="flex-1">
            <Text className="text-base text-zinc-900 dark:text-white">
              {item.displayName ?? item.transactionAdditionalDetails}
            </Text>
            <Text className="text-sm text-zinc-500">{item.date}</Text>
          </View>
          <Text className="text-base font-medium">
            {formatPrice(item.signedAmount * 100)}
          </Text>
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center py-12">
          <Text className="text-zinc-500">No transactions linked</Text>
          <Text className="mt-1 text-sm text-zinc-400">
            Transactions will appear here when matched
          </Text>
        </View>
      }
    />
  );
}
