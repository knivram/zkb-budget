import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { DetectedSubscription } from '@/lib/api/ai-schemas';
import { cn } from '@/lib/utils';
import { inArray } from 'drizzle-orm';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const HIGH_CONFIDENCE_THRESHOLD = 0.8;
const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

const getConfidenceColor = (confidence: number): string => {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return '#059669'; // emerald-600
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return '#d97706'; // amber-600
  return '#ea580c'; // orange-600
};

const getConfidenceBadgeText = (confidence: number): string => {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) return 'High';
  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) return 'Medium';
  return 'Low';
};

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
        className="flex-1 bg-stone-50 dark:bg-stone-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="p-4">
          <Text className="mb-4 text-sm text-stone-600 dark:text-stone-400">
            Review these detected subscriptions and select which ones to add to your account.
          </Text>
          <View className="flex-col gap-3">
            {detectedSubscriptions.map((sub, index) => {
              const isSelected = selectedIds.has(index);
              const confidenceColor = getConfidenceColor(sub.confidence);

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => toggleSelection(index)}
                  activeOpacity={0.7}
                  className={cn(
                    'overflow-hidden rounded-2xl border-2 p-4',
                    isSelected
                      ? 'border-accent-500 bg-white dark:border-accent-400 dark:bg-stone-900'
                      : 'border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900'
                  )}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 flex-row">
                      <DomainLogo domain={sub.domain} name={sub.name} size={40} className="mr-3" />
                      <View className="flex-1">
                        <View className="mb-2 flex-row items-center gap-2">
                          <Text className="text-base font-semibold text-stone-900 dark:text-stone-50">
                            {sub.name}
                          </Text>
                          <View
                            className="rounded-lg px-2 py-0.5"
                            style={{ backgroundColor: `${confidenceColor}18` }}
                          >
                            <Text
                              className="text-xs font-medium"
                              style={{ color: confidenceColor }}
                            >
                              {getConfidenceBadgeText(sub.confidence)}{' '}
                              {Math.round(sub.confidence * 100)}%
                            </Text>
                          </View>
                        </View>
                        <View className="mb-1 flex-row flex-wrap items-center">
                          <AmountText
                            amountCents={sub.price}
                            className="text-sm font-medium text-stone-600 dark:text-stone-300"
                          />
                          <Text className="text-sm font-medium text-stone-600 dark:text-stone-300">
                            {' \u2022 '}
                            <Text className="capitalize">{sub.billingCycle}</Text>
                          </Text>
                        </View>
                        {sub.domain && (
                          <Text className="mb-1 text-sm text-stone-400 dark:text-stone-500">
                            {sub.domain}
                          </Text>
                        )}
                        {sub.reasoning && (
                          <Text className="text-xs italic text-stone-500 dark:text-stone-400">
                            &quot;{sub.reasoning}&quot;
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Selection indicator */}
                    <View
                      className={cn(
                        'ml-3 h-6 w-6 items-center justify-center rounded-full border-2',
                        isSelected
                          ? 'border-accent-600 bg-accent-600'
                          : 'border-stone-300 bg-white dark:border-stone-600 dark:bg-stone-800'
                      )}
                    >
                      {isSelected && <Text className="text-xs font-bold text-white">✓</Text>}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
