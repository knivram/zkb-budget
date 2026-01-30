import { Input, Label } from '@/components/ui';
import { db } from '@/db/client';
import { CATEGORIES as CATEGORY_ENUM, transactions } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Button, Host, Menu, Image as SwiftImage } from '@expo/ui/swift-ui';
import { zodResolver } from '@hookform/resolvers/zod';
import { eq } from 'drizzle-orm';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { z } from 'zod';

const transactionEditSchema = z.object({
  displayName: z.string().optional(),
  categoryIndex: z
    .number()
    .min(0)
    .max(CATEGORY_ENUM.length - 1),
  domain: z
    .string()
    .optional()
    .refine(
      (val) =>
        !val ||
        val.trim() === '' ||
        /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/.test(val.trim()),
      { message: 'Please enter a valid domain (e.g., migros.ch)' }
    ),
});

type TransactionEditFormData = z.infer<typeof transactionEditSchema>;

export default function EditTransaction() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [originalDescription, setOriginalDescription] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    reset,
  } = useForm<TransactionEditFormData>({
    resolver: zodResolver(transactionEditSchema),
    defaultValues: {
      displayName: '',
      categoryIndex: CATEGORY_ENUM.indexOf('other'),
      domain: '',
    },
    mode: 'onBlur',
  });

  useEffect(() => {
    const loadTransaction = async () => {
      try {
        const result = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);

        if (result.length > 0) {
          const tx = result[0];
          setOriginalDescription(tx.transactionAdditionalDetails);
          const categoryIndex = CATEGORY_ENUM.indexOf(tx.category);

          reset({
            displayName: tx.displayName ?? '',
            categoryIndex: categoryIndex >= 0 ? categoryIndex : CATEGORY_ENUM.indexOf('other'),
            domain: tx.domain ?? '',
          });
        }
      } catch (error) {
        console.error('Failed to load transaction:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [id, reset]);

  const onSubmit = async (data: TransactionEditFormData) => {
    try {
      const updateData = {
        displayName: data.displayName?.trim() || null,
        category: CATEGORY_ENUM[data.categoryIndex],
        domain: data.domain?.trim() || null,
      };

      await db.update(transactions).set(updateData).where(eq(transactions.id, id));
      router.back();
    } catch (error) {
      console.error('Failed to update transaction:', error);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Edit Transaction' }} />
        <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-900">
          <Text className="text-zinc-500">Loading transaction...</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Edit Transaction' }} />
      <Stack.Toolbar placement="left">
        <Stack.Toolbar.Button icon="xmark" onPress={() => router.back()}>
          Cancel
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          icon="checkmark"
          variant="prominent"
          onPress={handleSubmit(onSubmit)}
          disabled={!isValid || isSubmitting}
        >
          Save
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white dark:bg-zinc-900"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          className="flex-1 bg-white dark:bg-zinc-900"
          contentContainerClassName="px-4 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Original Description (read-only reference) */}
          {originalDescription && (
            <View className="mb-6 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Original Description
              </Text>
              <Text className="text-sm text-zinc-700 dark:text-zinc-300">
                {originalDescription}
              </Text>
            </View>
          )}

          {/* Display Name */}
          <View className="mb-4">
            <Label>Display Name</Label>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. Groceries at Migros"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="sentences"
                />
              )}
            />
            <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Leave empty to use the original bank description
            </Text>
          </View>

          {/* Category */}
          <View className="mb-4">
            <Label>Category</Label>
            <Controller
              control={control}
              name="categoryIndex"
              render={({ field: { onChange, value } }) => {
                const selectedCategory = CATEGORY_ENUM[value];
                const config = CATEGORIES[selectedCategory];

                return (
                  <Host>
                    <Menu
                      label={
                        <Pressable>
                          <View className="mt-1 flex-row items-center rounded-xl bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                            <View className="mr-3">
                              <Host matchContents>
                                <SwiftImage
                                  systemName={config.icon}
                                  size={20}
                                  color={config.color}
                                />
                              </Host>
                            </View>
                            <Text
                              className="flex-1 text-base font-medium text-zinc-900 dark:text-zinc-100"
                              numberOfLines={1}
                            >
                              {config.label}
                            </Text>
                            <Host matchContents>
                              <SwiftImage systemName="chevron.up.chevron.down" size={14} />
                            </Host>
                          </View>
                        </Pressable>
                      }
                    >
                      {CATEGORY_ENUM.map((cat, index) => {
                        const catConfig = CATEGORIES[cat];
                        return (
                          <Button
                            key={cat}
                            systemImage={catConfig.icon}
                            label={catConfig.label}
                            onPress={() => onChange(index)}
                          />
                        );
                      })}
                    </Menu>
                  </Host>
                );
              }}
            />
          </View>

          {/* Domain */}
          <View className="mb-4">
            <Label>Merchant Domain (optional)</Label>
            <Controller
              control={control}
              name="domain"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="e.g. migros.ch"
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
              <Text className="mt-1 text-xs text-red-500">{errors.domain.message}</Text>
            )}
            <Text className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Used to display the merchant logo
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
