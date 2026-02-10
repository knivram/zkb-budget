import AmountText from '@/components/ui/amount-text';
import { EmptyState, ListRow, SectionTitle, Surface } from '@/components/ui';
import DomainLogo from '@/components/ui/domain-logo';
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
        <View className="pb-6">
          <Surface className="mx-4 mt-4 items-center">
            <DomainLogo domain={sub.domain} name={sub.name} size={84} />
            <Text className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">
              {sub.name}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Text className="text-base text-slate-500 dark:text-slate-400">
                <Text className="capitalize">{sub.billingCycle}</Text>
                {' \u2022 '}
              </Text>
              <AmountText
                amountCents={sub.price}
                tone="neutral"
                className="text-base font-semibold text-slate-700 dark:text-slate-300"
              />
            </View>
            <Text className="mt-2 text-sm text-slate-400">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.domain && (
              <Text className="mt-2 text-sm font-medium text-indigo-500">{sub.domain}</Text>
            )}
          </Surface>

          <SectionTitle
            title={`Transactions (${relatedTransactions.length})`}
            className="mt-8 px-4"
          />
        </View>
      }
      renderItem={({ item }) => (
        <ListRow inset={false} className="mx-4 mb-2">
          <View className="flex-1">
            <Text className="text-base font-semibold text-slate-900 dark:text-white">
              {item.displayName ?? item.transactionAdditionalDetails}
            </Text>
            <Text className="text-sm text-slate-500 dark:text-slate-400">{item.date}</Text>
          </View>
          <AmountText amountCents={item.signedAmount} className="text-base font-semibold" />
        </ListRow>
      )}
      ListEmptyComponent={
        <EmptyState
          title="No transactions linked"
          description="Transactions will appear here when matched."
          className="px-4"
        />
      }
    />
  );
}
