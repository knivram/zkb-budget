import AmountText from '@/components/ui/amount-text';
import { Badge } from '@/components/ui/badge';
import { DetailRow } from '@/components/ui/detail-row';
import DomainLogo from '@/components/ui/domain-logo';
import { SectionGroup } from '@/components/ui/section-group';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

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
        <View className="flex-1 items-center justify-center bg-stone-50 dark:bg-stone-950">
          <Text className="text-stone-500">Transaction not found</Text>
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
        className="flex-1 bg-stone-50 dark:bg-stone-950"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header */}
        <View className="items-center px-4 pb-4 pt-6">
          <DomainLogo
            domain={transaction.domain}
            fallbackIcon={categoryConfig.icon}
            size={72}
            className="mb-3"
          />
          <Text
            className="text-center text-xl font-semibold text-stone-900 dark:text-stone-50"
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <AmountText amountCents={transaction.signedAmount} className="mt-2 text-3xl font-bold" />
          <Text className="mt-1 text-sm text-stone-500 dark:text-stone-400">
            {formatDate(transaction.date)}
          </Text>
          <View className="mt-4 flex-row flex-wrap justify-center gap-2">
            <Badge icon={categoryConfig.icon} color={categoryConfig.color}>
              {categoryConfig.label}
            </Badge>
            {subscriptionData.length > 0 && (
              <Badge icon="repeat" color="#7c3aed">
                {subscriptionData[0].name}
              </Badge>
            )}
          </View>
        </View>

        {/* Transaction Details */}
        <SectionGroup header="Transaction Details">
          <DetailRow
            label="Type"
            value={transaction.creditDebitIndicator === 'credit' ? 'Income' : 'Expense'}
          />
          <DetailRow label="Payment Method" value={formatSubtype(transaction.transactionSubtype)} />
          <DetailRow label="Currency" value={transaction.currency} />
          {transaction.domain && (
            <DetailRow label="Domain" value={transaction.domain} showDivider={false} />
          )}
          {!transaction.domain && (
            <DetailRow label="Currency" value={transaction.currency} showDivider={false} />
          )}
        </SectionGroup>

        {/* Bank Data */}
        <SectionGroup header="Bank Data">
          <DetailRow label="Account" value={transaction.accountIBAN} />
          <DetailRow label="Statement Type" value={transaction.statementType} />
          <View className="border-b border-stone-100 px-5 py-3 dark:border-stone-800">
            <Text className="mb-1 text-sm text-stone-500 dark:text-stone-400">
              Original Description
            </Text>
            <Text className="text-sm font-medium text-stone-900 dark:text-stone-100">
              {transaction.transactionAdditionalDetails}
            </Text>
          </View>
          <View className="px-5 py-3">
            <Text className="mb-1 text-sm text-stone-500 dark:text-stone-400">Transaction ID</Text>
            <Text className="font-mono text-xs text-stone-500 dark:text-stone-400">
              {transaction.id}
            </Text>
          </View>
        </SectionGroup>

        <View className="h-8" />
      </ScrollView>
    </>
  );
}
