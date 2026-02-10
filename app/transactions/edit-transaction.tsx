import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { eq } from 'drizzle-orm';
import { Check, ChevronsUpDown } from 'lucide-react-native';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { BottomSheet, Input, Label } from '@/components/ui';
import { db } from '@/db/client';
import { CATEGORIES as CATEGORY_ENUM, transactions } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { cn } from '@/lib/utils';

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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

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
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Text className="text-slate-500">Loading transaction...</Text>
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
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          className="flex-1 bg-slate-50 dark:bg-slate-950"
          contentContainerClassName="px-4 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Original Description (read-only reference) */}
          {originalDescription && (
            <View className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Original Description
              </Text>
              <Text className="text-sm text-slate-700 dark:text-slate-300">
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
            <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
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
                const CategoryIcon = config.icon;

                return (
                  <>
                    <Pressable onPress={() => setIsCategoryOpen(true)}>
                      <View className="mt-1 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                        <View className="mr-3 h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                          <CategoryIcon size={18} color={config.color} />
                        </View>
                        <Text
                          className="flex-1 text-base font-medium text-slate-900 dark:text-slate-100"
                          numberOfLines={1}
                        >
                          {config.label}
                        </Text>
                        <ChevronsUpDown size={16} color="#94a3b8" />
                      </View>
                    </Pressable>
                    <BottomSheet isOpen={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
                      <View className="gap-3">
                        <View>
                          <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                            Choose a category
                          </Text>
                          <Text className="mt-1 text-sm text-slate-500">
                            Pick the best match for this transaction.
                          </Text>
                        </View>
                        <View className="gap-2">
                          {CATEGORY_ENUM.map((cat, index) => {
                            const catConfig = CATEGORIES[cat];
                            const Icon = catConfig.icon;
                            const isSelected = index === value;
                            return (
                              <Pressable
                                key={cat}
                                onPress={() => {
                                  onChange(index);
                                  setIsCategoryOpen(false);
                                }}
                                className={cn(
                                  'flex-row items-center rounded-2xl border px-3 py-2.5',
                                  isSelected
                                    ? 'border-indigo-200 bg-indigo-50 dark:border-indigo-700 dark:bg-indigo-950'
                                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                                )}
                              >
                                <View className="mr-3 h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                                  <Icon size={18} color={catConfig.color} />
                                </View>
                                <Text className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
                                  {catConfig.label}
                                </Text>
                                {isSelected && <Check size={16} color="#4f46e5" />}
                              </Pressable>
                            );
                          })}
                        </View>
                      </View>
                    </BottomSheet>
                  </>
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
            <Text className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Used to display the merchant logo
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
