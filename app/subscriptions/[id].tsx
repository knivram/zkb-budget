import { FlatList, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export default function SubscriptionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const subscriptionId = parseInt(id, 10);

  const { data: subscription } = useLiveQuery(
    db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1)
  );

  const { data: relatedTransactions } = useLiveQuery(
    db.select().from(transactions).where(eq(transactions.subscriptionId, subscriptionId))
  );

  if (subscription.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Text className="text-slate-500">Subscription not found</Text>
      </View>
    );
  }

  const sub = subscription[0];
  return (
    <FlatList
      className="flex-1 bg-slate-50 dark:bg-slate-950"
      contentInsetAdjustmentBehavior="automatic"
      data={relatedTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View className="items-center border-b border-slate-200 px-4 py-6 dark:border-slate-800">
            <DomainLogo domain={sub.domain} name={sub.name} size={80} />
            <Text className="text-2xl font-semibold text-slate-900 dark:text-white">
              {sub.name}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Text className="text-lg text-slate-500">
                <Text className="capitalize">{sub.billingCycle}</Text>
                {' \u2022 '}
                <AmountText
                  amountCents={sub.price}
                  className="text-lg font-semibold text-slate-500 dark:text-slate-400"
                />
              </Text>
            </View>
            <Text className="mt-2 text-sm text-slate-400">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.domain && <Text className="mt-1 text-sm text-indigo-500">{sub.domain}</Text>}
          </View>

          <View className="border-b border-slate-200 bg-slate-100 px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
            <Text className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Transactions ({relatedTransactions.length})
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <View className="flex-1">
            <Text className="text-base text-slate-900 dark:text-white">
              {item.displayName ?? item.transactionAdditionalDetails}
            </Text>
            <Text className="text-sm text-slate-500">{item.date}</Text>
          </View>
          <AmountText
            amountCents={item.signedAmount}
            className="text-base font-medium text-slate-900 dark:text-slate-100"
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center py-12">
          <Text className="text-slate-500">No transactions linked</Text>
          <Text className="mt-1 text-sm text-slate-400">
            Transactions will appear here when matched
          </Text>
        </View>
      }
    />
  );
}
