import ItemActionMenu from '@/components/ItemActionMenu';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { BillingCycle, Subscription, subscriptions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import DetectSubscriptions from './detect-subscriptions';

const toMonthlyCents = (price: number, billingCycle: BillingCycle): number => {
  switch (billingCycle) {
    case 'weekly':
      return price * (52 / 12);
    case 'monthly':
      return price;
    case 'yearly':
      return price / 12;
  }
};

export default function Subscriptions() {
  const [isDetectOpen, setIsDetectOpen] = useState(false);
  const { data } = useLiveQuery(db.select().from(subscriptions));
  const monthlyTotal = data.reduce(
    (sum, sub) => sum + toMonthlyCents(sub.price, sub.billingCycle),
    0
  );

  const handleDelete = (subscription: Subscription) => {
    Alert.alert('Delete Subscription', `Are you sure you want to delete ${subscription.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(subscriptions).where(eq(subscriptions.id, subscription.id));
          } catch (error) {
            console.error('Failed to delete subscription:', error);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: 'Detect',
              icon: {
                name: 'sparkles',
                type: 'sfSymbol',
              },
              onPress: () => setIsDetectOpen(true),
            },
            {
              type: 'button',
              label: 'Add',
              icon: {
                name: 'plus',
                type: 'sfSymbol',
              },
              variant: 'prominent',
              onPress: () => router.push('/subscriptions/add-subscription'),
            },
          ],
        }}
      />
      <ScrollView
        className="flex-1 flex-grow bg-white dark:bg-zinc-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="min-h-full bg-white dark:bg-zinc-950">
          <View className="items-center py-8">
            <Text className="text-lg text-zinc-400 dark:text-zinc-500">CHF</Text>
            <AmountText
              amountCents={monthlyTotal}
              showCurrency={false}
              className="text-5xl font-semibold text-zinc-900 dark:text-zinc-50"
            />
            <Text className="mt-1 text-sm text-zinc-400">per month</Text>
          </View>
          {data.map((subscription: Subscription) => {
            return (
              <ItemActionMenu
                key={subscription.id}
                onEdit={() =>
                  router.push({
                    pathname: '/subscriptions/add-subscription',
                    params: { id: subscription.id },
                  })
                }
                onDelete={() => handleDelete(subscription)}
              >
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/subscriptions/[id]',
                      params: { id: subscription.id },
                    })
                  }
                >
                  <View className="flex-row items-center border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                    <DomainLogo
                      domain={subscription.domain}
                      name={subscription.name}
                      size={48}
                      className="mr-3"
                    />
                    <View className="flex-1">
                      <Text className="text-base font-medium text-zinc-900 dark:text-zinc-50">
                        {subscription.name}
                      </Text>
                      <Text className="text-sm capitalize text-zinc-500 dark:text-zinc-400">
                        {subscription.billingCycle}
                      </Text>
                    </View>
                    <AmountText
                      amountCents={subscription.price}
                      className="text-zinc-900 dark:text-zinc-50"
                    />
                  </View>
                </Pressable>
              </ItemActionMenu>
            );
          })}
        </View>
      </ScrollView>
      <DetectSubscriptions isOpen={isDetectOpen} onOpenChange={setIsDetectOpen} />
    </>
  );
}
