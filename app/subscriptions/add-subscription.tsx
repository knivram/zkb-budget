import { Input, Label, SegmentedControl } from '@/components/ui';
import { db } from '@/db/client';
import { BILLING_CYCLES, BillingCycle, subscriptions } from '@/db/schema';
import { parsePriceToCents } from '@/lib/price';
import { zodResolver } from '@hookform/resolvers/zod';
import { eq } from 'drizzle-orm';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { z } from 'zod';

const subscriptionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z
    .string()
    .min(1, 'Price is required')
    .refine(
      (val) => {
        const cents = parsePriceToCents(val);
        return cents !== null && cents > 0;
      },
      {
        message: 'Price must be at least 0.01',
      }
    ),
  billingCycle: z.enum(['weekly', 'monthly', 'yearly'] as const),
  subscribedAt: z.date(),
  domain: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val.trim() === '' ||
        /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(val.trim()),
      { message: 'Please enter a valid domain (e.g., netflix.com)' }
    ),
});

type SubscriptionFormData = z.infer<typeof subscriptionSchema>;

const billingCycleLabels: Record<BillingCycle, string> = {
  weekly: 'per week',
  monthly: 'per month',
  yearly: 'per year',
};

const segmentedLabels: Record<BillingCycle, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export default function AddSubscription() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const subscriptionId = id ? parseInt(id, 10) : null;
  const [isLoading, setIsLoading] = useState(isEditing);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    watch,
    reset,
  } = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: '',
      price: '',
      billingCycle: 'monthly',
      subscribedAt: new Date(),
      domain: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    if (isEditing && subscriptionId) {
      const loadSubscription = async () => {
        try {
          const result = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, subscriptionId))
            .limit(1);

          if (result.length > 0) {
            const sub = result[0];
            const priceString = (sub.price / 100).toFixed(2);

            reset({
              name: sub.name,
              price: priceString,
              billingCycle: sub.billingCycle,
              subscribedAt: new Date(sub.subscribedAt),
              domain: sub.domain ?? '',
            });
          }
        } catch (error) {
          console.error('Failed to load subscription:', error);
        } finally {
          setIsLoading(false);
        }
      };

      loadSubscription();
    }
  }, [isEditing, subscriptionId, reset]);

  const billingCycle = watch('billingCycle');
  const billingCycleLabel = billingCycleLabels[billingCycle];

  const onSubmit = async (data: SubscriptionFormData) => {
    try {
      const priceInCents = parsePriceToCents(data.price);
      if (priceInCents === null) {
        throw new Error('Invalid price');
      }

      const subscriptionData = {
        name: data.name.trim(),
        price: priceInCents,
        billingCycle: data.billingCycle,
        subscribedAt: data.subscribedAt,
        domain: data.domain?.trim() || null,
      };

      if (isEditing && subscriptionId) {
        await db
          .update(subscriptions)
          .set(subscriptionData)
          .where(eq(subscriptions.id, subscriptionId));
      } else {
        await db.insert(subscriptions).values(subscriptionData);
      }

      router.back();
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Subscription' }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
          <Text className="text-zinc-500">Loading subscription...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: isEditing ? 'Edit Subscription' : 'Add Subscription',
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: 'Save',
              icon: {
                name: 'checkmark',
                type: 'sfSymbol',
              },
              variant: 'prominent',
              onPress: handleSubmit(onSubmit),
              disabled: !isValid || isSubmitting,
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-zinc-950"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          className="flex-1 bg-white dark:bg-zinc-950"
          contentContainerClassName="px-4 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View className="mb-8 items-center">
            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className="flex items-center">
                  <View className="flex-row items-baseline">
                    <Text className="text-4xl font-light leading-tight text-zinc-400 dark:text-zinc-500">
                      CHF
                    </Text>
                    <TextInput
                      placeholder="0.00"
                      placeholderTextColor="#d4d4d8"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      keyboardType="decimal-pad"
                      className="ml-2 min-w-[120px] text-5xl font-semibold leading-tight text-zinc-900 dark:text-zinc-50"
                      textAlign="left"
                      textAlignVertical="center"
                    />
                  </View>
                  <Text className="mt-1 text-sm leading-5 text-zinc-400">{billingCycleLabel}</Text>
                  {errors.price && (
                    <Text className="mt-2 text-xs leading-4 text-red-500">
                      {errors.price.message}
                    </Text>
                  )}
                </View>
              )}
            />
          </View>

          <View className="mb-4">
            <Label>Name</Label>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. Netflix"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.name && (
              <Text className="mt-1 text-xs leading-4 text-red-500">{errors.name.message}</Text>
            )}
          </View>

          <View className="mb-4">
            <Label>Billing Cycle</Label>
            <Controller
              control={control}
              name="billingCycle"
              render={({ field: { onChange, value } }) => (
                <SegmentedControl
                  options={BILLING_CYCLES}
                  labels={segmentedLabels}
                  selected={value}
                  onSelect={onChange}
                />
              )}
            />
          </View>

          <View className="mb-4">
            <Label>Subscribed Since</Label>
            <Controller
              control={control}
              name="subscribedAt"
              render={({ field: { value } }) => (
                <Pressable>
                  <View className="rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                    <Text className="text-base text-zinc-900 dark:text-zinc-100">
                      {formatDate(value)}
                    </Text>
                  </View>
                </Pressable>
              )}
            />
          </View>

          <View className="mb-4">
            <Label>Provider Domain (optional)</Label>
            <Controller
              control={control}
              name="domain"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. netflix.com"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              )}
            />
            {errors.domain && (
              <Text className="mt-1 text-xs leading-4 text-red-500">{errors.domain.message}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
