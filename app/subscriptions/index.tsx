import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { db } from '@/db/client';
import { BillingCycle, Subscription, subscriptions } from '@/db/schema';
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
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
        className="flex-1 bg-stone-50 dark:bg-stone-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="min-h-full">
          {/* Monthly total header */}
          <View className="items-center py-8">
            <Text className="text-lg text-stone-400 dark:text-stone-500">CHF</Text>
            <AmountText
              amountCents={monthlyTotal}
              showCurrency={false}
              className="text-5xl font-semibold text-stone-900 dark:text-stone-50"
            />
            <Text className="mt-1 text-sm text-stone-400 dark:text-stone-500">per month</Text>
          </View>

          {/* Subscription list - unified ListItem */}
          {data.map((subscription: Subscription, index) => (
            <Host key={subscription.id}>
              <ContextMenu>
                <ContextMenu.Items>
                  <Button
                    systemImage="pencil"
                    label="Edit"
                    onPress={() =>
                      router.push({
                        pathname: '/subscriptions/add-subscription',
                        params: { id: subscription.id },
                      })
                    }
                  />
                  <Button
                    systemImage="trash"
                    label="Delete"
                    onPress={() => handleDelete(subscription)}
                    role="destructive"
                  />
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                  <ListItem
                    onPress={() =>
                      router.push({
                        pathname: '/subscriptions/[id]',
                        params: { id: subscription.id },
                      })
                    }
                    leading={
                      <DomainLogo domain={subscription.domain} name={subscription.name} size={44} />
                    }
                    trailing={<AmountText amountCents={subscription.price} />}
                    showDivider={index < data.length - 1}
                    className="bg-white dark:bg-stone-900"
                  >
                    <Text className="text-base font-medium text-stone-900 dark:text-stone-50">
                      {subscription.name}
                    </Text>
                    <Text className="text-sm capitalize text-stone-500 dark:text-stone-400">
                      {subscription.billingCycle}
                    </Text>
                  </ListItem>
                </ContextMenu.Trigger>
              </ContextMenu>
            </Host>
          ))}

          {data.length === 0 && (
            <EmptyState
              title="No subscriptions yet"
              subtitle="Add one manually or detect from transactions"
            />
          )}
        </View>
      </ScrollView>
      <DetectSubscriptions isOpen={isDetectOpen} onOpenChange={setIsDetectOpen} />
    </>
  );
}
