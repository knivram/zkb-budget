import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Repeat } from 'lucide-react-native';

import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatSubtype = (subtype: string): string => {
  switch (subtype) {
    case 'inflowOutflowDigital':
      return 'Digital';
    case 'inflowOutflowPhysical':
      return 'Physical';
    default:
      return subtype;
  }
};

type DetailRowProps = {
  label: string;
  value: string;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <View className="flex-row items-center justify-between border-b border-slate-200 py-3 dark:border-slate-800">
      <Text className="text-sm text-slate-500 dark:text-slate-400">{label}</Text>
      <Text className="text-sm font-medium text-slate-900 dark:text-white">{value}</Text>
    </View>
  );
}

export default function TransactionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: transactionData } = useLiveQuery(
    db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
  );

  const { data: subscriptionData } = useLiveQuery(
    db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, transactionData[0]?.subscriptionId ?? -1))
      .limit(1),
    [transactionData[0]?.subscriptionId]
  );

  if (transactionData.length === 0) {
    return (
      <>
        <Stack.Screen options={{ title: 'Transaction' }} />
        <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
          <Text className="text-slate-500">Transaction not found</Text>
        </View>
      </>
    );
  }

  const transaction = transactionData[0];

  const handleDelete = () => {
    const name = transaction.displayName ?? transaction.transactionAdditionalDetails;
    Alert.alert('Delete Transaction', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(transactions).where(eq(transactions.id, transaction.id));
            router.back();
          } catch (error) {
            console.error('Failed to delete transaction:', error);
          }
        },
      },
    ]);
  };

  const displayName = transaction.displayName ?? transaction.transactionAdditionalDetails;
  const categoryConfig = CATEGORIES[transaction.category];
  const CategoryIcon = categoryConfig.icon;

  return (
    <>
      <Stack.Screen options={{ title: displayName }} />
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Menu icon="ellipsis">
          <Stack.Toolbar.MenuAction
            icon="pencil"
            onPress={() =>
              router.push({
                pathname: '/transactions/edit-transaction',
                params: { id: transaction.id },
              })
            }
          >
            Edit
          </Stack.Toolbar.MenuAction>
          <Stack.Toolbar.MenuAction icon="trash" destructive onPress={handleDelete}>
            Delete
          </Stack.Toolbar.MenuAction>
        </Stack.Toolbar.Menu>
      </Stack.Toolbar>
      <ScrollView
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header Section */}
        <View className="items-center border-b border-slate-200 px-4 py-6 dark:border-slate-800">
          <DomainLogo
            domain={transaction.domain}
            fallbackIcon={categoryConfig.icon}
            size={80}
            className="mb-3"
          />
          <Text
            className="text-center text-xl font-semibold text-slate-900 dark:text-white"
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <AmountText amountCents={transaction.signedAmount} className="mt-2 text-3xl font-bold" />
          <Text className="mt-1 text-sm text-slate-500">{formatDate(transaction.date)}</Text>

          {/* Category Badge */}
          <View
            className="mt-4 flex-row items-center rounded-full border border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900"
            style={{ backgroundColor: `${categoryConfig.color}20` }}
          >
            <CategoryIcon size={16} color={categoryConfig.color} />
            <Text className="ml-2 text-sm font-medium" style={{ color: categoryConfig.color }}>
              {categoryConfig.label}
            </Text>
          </View>

          {/* Subscription Badge */}
          {subscriptionData.length > 0 && (
            <View className="mt-2 flex-row items-center rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 dark:border-indigo-700 dark:bg-indigo-950">
              <Repeat size={14} color="#4f46e5" />
              <Text className="ml-2 text-sm font-medium text-indigo-600 dark:text-indigo-300">
                {subscriptionData[0].name}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction Details */}
        <View className="px-4 py-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Transaction Details
          </Text>
          <View className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <DetailRow
              label="Type"
              value={transaction.creditDebitIndicator === 'credit' ? 'Income' : 'Expense'}
            />
            <DetailRow
              label="Payment Method"
              value={formatSubtype(transaction.transactionSubtype)}
            />
            <DetailRow label="Currency" value={transaction.currency} />
            {transaction.domain && <DetailRow label="Domain" value={transaction.domain} />}
          </View>
        </View>

        {/* Bank Native Data */}
        <View className="px-4 pb-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Bank Data
          </Text>
          <View className="rounded-2xl border border-slate-200 bg-white px-4 dark:border-slate-800 dark:bg-slate-900">
            <DetailRow label="Account" value={transaction.accountIBAN} />
            <DetailRow label="Statement Type" value={transaction.statementType} />
            <View className="border-b border-slate-200 py-3 dark:border-slate-800">
              <Text className="mb-1 text-sm text-slate-500 dark:text-slate-400">
                Original Description
              </Text>
              <Text className="text-sm font-medium text-slate-900 dark:text-white">
                {transaction.transactionAdditionalDetails}
              </Text>
            </View>
            <View className="py-3">
              <Text className="mb-1 text-sm text-slate-500 dark:text-slate-400">Transaction ID</Text>
              <Text className="font-mono text-xs text-slate-600 dark:text-slate-400">
                {transaction.id}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
