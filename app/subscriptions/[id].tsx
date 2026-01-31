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
      <View className="flex-1 items-center justify-center bg-canvas dark:bg-canvas-dark">
        <Text className="text-muted dark:text-muted-dark">Subscription not found</Text>
      </View>
    );
  }

  const sub = subscription[0];
  return (
    <FlatList
      className="flex-1 bg-canvas dark:bg-canvas-dark"
      contentInsetAdjustmentBehavior="automatic"
      data={relatedTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <View className="items-center border-b border-border px-4 py-6 dark:border-border-dark">
            <DomainLogo domain={sub.domain} name={sub.name} size={80} />
            <Text className="text-2xl font-semibold text-ink dark:text-ink-dark">{sub.name}</Text>
            <View className="mt-1 flex-row items-center">
              <Text className="text-lg text-muted dark:text-muted-dark">
                <Text className="capitalize">{sub.billingCycle}</Text>
                {' \u2022 '}
                <AmountText
                  amountCents={sub.price}
                  className="text-lg font-semibold text-muted dark:text-muted-dark"
                />
              </Text>
            </View>
            <Text className="mt-2 text-sm text-subtle dark:text-subtle-dark">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.domain && (
              <Text className="mt-1 text-sm text-brand dark:text-brand-dark">{sub.domain}</Text>
            )}
          </View>

          <View className="border-b border-border bg-surface-muted px-4 py-2 dark:border-border-dark dark:bg-surface-muted-dark">
            <Text className="text-sm font-semibold text-muted dark:text-muted-dark">
              Transactions ({relatedTransactions.length})
            </Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View className="flex-row items-center justify-between border-b border-border px-4 py-4 dark:border-border-dark">
          <View className="flex-1">
            <Text className="text-base font-semibold text-ink dark:text-ink-dark">
              {item.displayName ?? item.transactionAdditionalDetails}
            </Text>
            <Text className="text-sm text-muted dark:text-muted-dark">{item.date}</Text>
          </View>
          <AmountText
            amountCents={item.signedAmount}
            className="text-base font-semibold text-ink dark:text-ink-dark"
          />
        </View>
      )}
      ListEmptyComponent={
        <View className="items-center py-12">
          <Text className="text-muted dark:text-muted-dark">No transactions linked</Text>
          <Text className="mt-1 text-sm text-subtle dark:text-subtle-dark">
            Transactions will appear here when matched
          </Text>
        </View>
      }
    />
  );
}
