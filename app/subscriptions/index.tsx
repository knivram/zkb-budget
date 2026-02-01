import AmountText from '@/components/ui/amount-text';
import { EmptyState, ListRow, SectionTitle, Surface } from '@/components/ui';
import DomainLogo from '@/components/ui/domain-logo';
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
        className="flex-1 flex-grow bg-slate-50 dark:bg-slate-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="min-h-full bg-slate-50 pb-6 dark:bg-slate-950">
          <Surface className="mx-4 mt-4 items-center">
            <Text className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Monthly spend
            </Text>
            <View className="mt-3 flex-row items-baseline">
              <Text className="text-lg text-slate-400 dark:text-slate-500">CHF</Text>
              <AmountText
                amountCents={monthlyTotal}
                showCurrency={false}
                tone="neutral"
                className="ml-2 text-4xl font-semibold text-slate-900 dark:text-white"
              />
            </View>
            <Text className="mt-2 text-sm text-slate-400">Subscriptions per month</Text>
          </Surface>

          <View className="mt-8">
            <SectionTitle title="Subscriptions" className="px-4" />
            {data.length === 0 ? (
              <EmptyState
                title="No subscriptions yet"
                description="Run detection or add a subscription to get started."
                className="mt-6"
              />
            ) : (
              <View className="gap-2">
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
                          <ListRow
                            onPress={() =>
                              router.push({
                                pathname: '/subscriptions/[id]',
                                params: { id: subscription.id },
                              })
                            }
                          >
                            <DomainLogo
                              domain={subscription.domain}
                              name={subscription.name}
                              size={48}
                            />
                            <View className="flex-1">
                              <Text className="text-base font-semibold text-slate-900 dark:text-white">
                                {subscription.name}
                              </Text>
                              <Text className="text-sm capitalize text-slate-500 dark:text-slate-400">
                                {subscription.billingCycle}
                              </Text>
                            </View>
                            <AmountText
                              amountCents={subscription.price}
                              tone="neutral"
                              className="text-slate-900 dark:text-white"
                            />
                          </ListRow>
                        </ContextMenu.Trigger>
                      </ContextMenu>
                    </Host>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      <DetectSubscriptions isOpen={isDetectOpen} onOpenChange={setIsDetectOpen} />
    </>
  );
}
