import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { inArray } from 'drizzle-orm';

import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import type { DetectedSubscription } from '@/lib/api/ai-schemas';
import { cn } from '@/lib/utils';

const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

export default function ReviewDetectedSubscriptions() {
  const params = useLocalSearchParams();
  const detectedSubscriptions: DetectedSubscription[] = JSON.parse(
    params.detectedSubscriptions as string
  );

  const [selectedIds, setSelectedIds] = useState<Set<number>>(
    new Set(detectedSubscriptions.map((_, i) => i))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelection = (index: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      const selected = detectedSubscriptions.filter((_, i) => selectedIds.has(i));

      if (selected.length === 0) {
        router.back();
        return;
      }

      // Insert subscriptions and link transactions
      await db.transaction(async (tx) => {
        for (const sub of selected) {
          const [inserted] = await tx
            .insert(subscriptions)
            .values({
              name: sub.name,
              price: sub.price,
              billingCycle: sub.billingCycle,
              subscribedAt: new Date(sub.subscribedAt),
              domain: sub.domain || null,
            })
            .returning({ id: subscriptions.id });

          // Link transactions to this subscription
          if (sub.transactionIds.length > 0) {
            await tx
              .update(transactions)
              .set({ subscriptionId: inserted.id })
              .where(inArray(transactions.id, sub.transactionIds));
          }
        }
      });

      router.dismissTo('/subscriptions');
    } catch (error) {
      console.error('Failed to add subscriptions:', error);
      Alert.alert('Error', 'Failed to add subscriptions.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'bg-green-500';
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getConfidenceBadgeText = (confidence: number): string => {
    if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'High';
    if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'Medium';
    return 'Low';
  };

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: 'Save',
              icon: {
                name: 'checkmark',
                type: 'sfSymbol',
              },
              variant: 'prominent',
              onPress: handleConfirm,
              disabled: isSubmitting,
            },
          ],
          unstable_headerLeftItems: () => [
            {
              type: 'button',
              label: 'Cancel',
              icon: {
                name: 'xmark',
                type: 'sfSymbol',
              },
              onPress: () => router.back(),
            },
          ],
        }}
      />
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-4">
          <Text className="mb-2 text-sm text-slate-600 dark:text-slate-400">
            Review these detected subscriptions and select which ones to add to your account.
          </Text>
          <View className="mt-4 flex-col gap-2">
            {detectedSubscriptions.map((sub, index) => (
              <Pressable
                key={index}
                onPress={() => toggleSelection(index)}
                className={`rounded-2xl border-2 p-4 ${
                  selectedIds.has(index)
                    ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-950'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 flex-row">
                    <DomainLogo domain={sub.domain} name={sub.name} size={40} className="mr-3" />
                    <View className="flex-1">
                      <View className="mb-2 flex-row items-center gap-2">
                        <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                          {sub.name}
                        </Text>
                        <View
                          className={`rounded-full px-2 py-0.5 ${getConfidenceColor(sub.confidence)}`}
                        >
                          <Text className="text-xs font-medium text-white">
                            {getConfidenceBadgeText(sub.confidence)} (
                            {Math.round(sub.confidence * 100)}%)
                          </Text>
                        </View>
                      </View>
                      <View className="mb-1 flex-row flex-wrap items-center">
                        <AmountText
                          amountCents={sub.price}
                          className="text-base font-medium text-slate-700 dark:text-slate-300"
                        />
                        <Text className="text-base font-medium text-slate-700 dark:text-slate-300">
                          {' \u2022 '}
                          <Text className="capitalize">{sub.billingCycle}</Text>
                        </Text>
                      </View>
                      {sub.domain && (
                        <Text className="mb-2 text-sm text-slate-500 dark:text-slate-400">
                          {sub.domain}
                        </Text>
                      )}
                      {sub.reasoning && (
                        <Text className="text-sm italic text-slate-600 dark:text-slate-400">
                          &quot;{sub.reasoning}&quot;
                        </Text>
                      )}
                    </View>
                  </View>
                  <View
                    className={cn(
                      'ml-3 h-6 w-6 items-center justify-center rounded-full border-2',
                      selectedIds.has(index)
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-700'
                    )}
                  >
                    {selectedIds.has(index) && (
                      <Text className="text-sm font-bold text-white">✓</Text>
                    )}
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
