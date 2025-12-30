import { db } from "@/db/client";
import { BillingCycle, Subscription, subscriptions } from "@/db/schema";
import { Button, ContextMenu, Host } from "@expo/ui/swift-ui";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Image } from "expo-image";
import { Alert, ScrollView, Text, View } from "react-native";

const formatPrice = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

const toMonthlyCents = (price: number, billingCycle: BillingCycle): number => {
  switch (billingCycle) {
    case "weekly":
      return price * (52 / 12);
    case "monthly":
      return price;
    case "yearly":
      return price / 12;
  }
};

export default function Index() {
  const { data } = useLiveQuery(db.select().from(subscriptions));
  const monthlyTotal =
    data?.reduce(
      (sum, sub) => sum + toMonthlyCents(sub.price, sub.billingCycle),
      0
    ) ?? 0;

  const handleDelete = (subscription: Subscription) => {
    Alert.alert(
      "Delete Subscription",
      `Are you sure you want to delete ${subscription.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await db
              .delete(subscriptions)
              .where(eq(subscriptions.id, subscription.id));
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 flex-grow bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
    >
      <View className="min-h-full bg-white dark:bg-zinc-900">
        <View className="items-center py-8">
          <Text className="text-lg text-zinc-400 dark:text-zinc-500">CHF</Text>
          <Text className="text-5xl font-semibold text-zinc-900 dark:text-white">
            {formatPrice(monthlyTotal)}
          </Text>
          <Text className="mt-1 text-sm text-zinc-400">per month</Text>
        </View>
        {data?.map((subscription: Subscription) => {
          return (
            <Host key={subscription.id}>
              <ContextMenu activationMethod="longPress">
                <ContextMenu.Items>
                  <Button systemImage="pencil" disabled>
                    Edit
                  </Button>
                  <Button
                    systemImage="trash"
                    onPress={() => handleDelete(subscription)}
                    role="destructive"
                  >
                    Delete
                  </Button>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <View className="flex-row items-center border-b border-zinc-100 px-4 py-3 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <View className="mr-3 h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
                      {subscription.icon ? (
                        <Image
                          source={{ uri: subscription.icon }}
                          style={{ width: 48, height: 48 }}
                          contentFit="cover"
                        />
                      ) : (
                        <Text className="text-lg text-zinc-400">
                          {subscription.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-medium text-zinc-900 dark:text-white">
                        {subscription.name}
                      </Text>
                      <Text className="text-sm capitalize text-zinc-500">
                        {subscription.billingCycle}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-zinc-900 dark:text-white">
                      CHF {formatPrice(subscription.price)}
                    </Text>
                  </View>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          );
        })}
      </View>
    </ScrollView>
  );
}
