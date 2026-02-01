import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import EmptyState from '@/components/ui/empty-state';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

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
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-gray-500">Subscription not found</Text>
      </View>
    );
  }

  const sub = subscription[0];
  return (
    <FlatList
      className="flex-1 bg-surface dark:bg-surface-dark"
      contentInsetAdjustmentBehavior="automatic"
      data={relatedTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          {/* Header */}
          <View className="items-center px-4 pb-6 pt-4">
            <DomainLogo domain={sub.domain} name={sub.name} size={80} className="mb-3" />
            <Text className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {sub.name}
            </Text>
            <View className="mt-1 flex-row items-center">
              <Text className="text-base capitalize text-gray-500 dark:text-gray-400">
                {sub.billingCycle}
              </Text>
              <Text className="mx-1.5 text-gray-300 dark:text-gray-600">{'\u00B7'}</Text>
              <AmountText
                amountCents={sub.price}
                className="text-base font-semibold text-gray-900 dark:text-gray-100"
              />
            </View>
            <Text className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.domain && (
              <Text className="mt-1 text-sm text-accent dark:text-accent-dark">{sub.domain}</Text>
            )}
          </View>

          {/* Section header */}
          <View className="bg-surface px-4 py-2 dark:bg-surface-dark">
            <Text className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Transactions ({relatedTransactions.length})
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center justify-between border-b border-separator bg-card px-4 py-3 dark:border-separator-dark dark:bg-card-dark">
          <View className="flex-1">
            <Text className="text-base text-gray-900 dark:text-gray-100">
              {item.displayName ?? item.transactionAdditionalDetails}
            </Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400">{item.date}</Text>
          </View>
          <AmountText amountCents={item.signedAmount} className="text-base font-medium" />
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          title="No transactions linked"
          subtitle="Transactions will appear here when matched"
        />
      }
    />
  );
}
