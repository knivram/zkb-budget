import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
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
      <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-950">
        <Text className="text-stone-500">Subscription not found</Text>
      </View>
    );
  }

  const sub = subscription[0];
  return (
    <FlatList
      className="flex-1 bg-stone-50 dark:bg-stone-950"
      contentInsetAdjustmentBehavior="automatic"
      data={relatedTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          {/* Subscription header */}
          <View className="items-center px-4 py-6">
            <DomainLogo domain={sub.domain} name={sub.name} size={72} className="mb-3" />
            <Text className="text-2xl font-semibold text-stone-900 dark:text-stone-50">
              {sub.name}
            </Text>
            <View className="mt-1 flex-row items-center">
              <AmountText
                amountCents={sub.price}
                className="text-lg font-semibold text-stone-500 dark:text-stone-400"
              />
              <Text className="text-lg text-stone-500 dark:text-stone-400">
                {' \u2022 '}
                <Text className="capitalize">{sub.billingCycle}</Text>
              </Text>
            </View>
            <Text className="mt-2 text-sm text-stone-400 dark:text-stone-500">
              Since {formatDate(sub.subscribedAt)}
            </Text>
            {sub.domain && (
              <Text className="mt-1 text-sm text-accent-600 dark:text-accent-400">
                {sub.domain}
              </Text>
            )}
          </View>

          <SectionHeader title={`Transactions (${relatedTransactions.length})`} />
        </View>
      }
      renderItem={({ item, index }) => (
        <ListItem
          trailing={<AmountText amountCents={item.signedAmount} />}
          showDivider={index < relatedTransactions.length - 1}
          className="bg-white dark:bg-stone-900"
        >
          <Text className="text-base text-stone-900 dark:text-stone-50">
            {item.displayName ?? item.transactionAdditionalDetails}
          </Text>
          <Text className="text-sm text-stone-500 dark:text-stone-400">{item.date}</Text>
        </ListItem>
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
