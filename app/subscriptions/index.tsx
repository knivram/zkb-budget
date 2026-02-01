import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { BillingCycle, Subscription, subscriptions } from '@/db/schema';
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
        className="flex-1 flex-grow bg-canvas dark:bg-canvas-dark"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="min-h-full bg-canvas dark:bg-canvas-dark">
          <View className="items-center py-8">
            <Text className="text-xs font-semibold uppercase tracking-wide text-subtle dark:text-subtle-dark">
              CHF
            </Text>
            <AmountText
              amountCents={monthlyTotal}
              showCurrency={false}
              className="text-5xl font-semibold text-ink dark:text-ink-dark"
            />
            <Text className="mt-1 text-sm text-muted dark:text-muted-dark">per month</Text>
          </View>
          {data.map((subscription: Subscription) => {
            return (
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
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/subscriptions/[id]',
                          params: { id: subscription.id },
                        })
                      }
                    >
                      <View className="flex-row items-center border-b border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
                        <DomainLogo
                          domain={subscription.domain}
                          name={subscription.name}
                          size={48}
                          className="mr-3"
                        />
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-ink dark:text-ink-dark">
                            {subscription.name}
                          </Text>
                          <Text className="text-sm capitalize text-muted dark:text-muted-dark">
                            {subscription.billingCycle}
                          </Text>
                        </View>
                        <AmountText
                          amountCents={subscription.price}
                          className="text-ink dark:text-ink-dark"
                        />
                      </View>
                    </Pressable>
                  </ContextMenu.Trigger>
                </ContextMenu>
              </Host>
            );
          })}
        </View>
      </ScrollView>
      <DetectSubscriptions isOpen={isDetectOpen} onOpenChange={setIsDetectOpen} />
    </>
  );
}
