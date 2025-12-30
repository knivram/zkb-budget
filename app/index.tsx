import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { ScrollView, Text, View } from "react-native";
import { db } from "../db/client";
import { Subscription, subscriptions } from "../db/schema";

export default function Index() {
  const { data } = useLiveQuery(db.select().from(subscriptions));

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic">
      {data?.map((subscription: Subscription) => (
        <View key={subscription.id}>
          <Text>{subscription.name}</Text>
          <Text>{subscription.price}</Text>
          <Text>{subscription.billingCycle}</Text>
          <Text>
            {new Date(subscription.subscribedAt).toLocaleDateString()}
          </Text>
          <Text>{subscription.url}</Text>
          <Text>{subscription.icon}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
