import AmountText from '@/components/ui/amount-text';
import { Card, CardHeader } from '@/components/ui/card';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { subscriptions, transactions } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
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

type DetailRowProps = {
  label: string;
  value: string;
  isLast?: boolean;
};

function DetailRow({ label, value, isLast = false }: DetailRowProps) {
  return (
    <View
      className={`flex-row items-center justify-between py-3 ${!isLast ? 'border-b border-separator dark:border-separator-dark' : ''}`}
    >
      <Text className="text-sm text-gray-500 dark:text-gray-400">{label}</Text>
      <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</Text>
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
        <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
          <Text className="text-gray-500">Transaction not found</Text>
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
        className="flex-1 bg-surface dark:bg-surface-dark"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header Section */}
        <View className="items-center px-4 pb-6 pt-4">
          <DomainLogo
            domain={transaction.domain}
            fallbackIcon={categoryConfig.icon}
            size={80}
            className="mb-4"
          />
          <Text
            className="text-center text-xl font-semibold text-gray-900 dark:text-gray-100"
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <AmountText amountCents={transaction.signedAmount} className="mt-2 text-3xl font-bold" />
          <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {formatDate(transaction.date)}
          </Text>

          <View className="mt-4 flex-row items-center gap-2">
            {/* Category Badge */}
            <View
              className="flex-row items-center rounded-full px-3.5 py-1.5"
              style={{ backgroundColor: `${categoryConfig.color}18` }}
            >
              <Host matchContents>
                <SwiftImage
                  systemName={categoryConfig.icon}
                  size={14}
                  color={categoryConfig.color}
                />
              </Host>
              <Text className="ml-1.5 text-sm font-medium" style={{ color: categoryConfig.color }}>
                {categoryConfig.label}
              </Text>
            </View>

            {/* Subscription Badge */}
            {subscriptionData.length > 0 && (
              <View className="flex-row items-center rounded-full bg-accent/10 px-3.5 py-1.5 dark:bg-accent-dark/15">
                <Host matchContents>
                  <SwiftImage systemName="repeat" size={12} color="#5856d6" />
                </Host>
                <Text className="ml-1.5 text-sm font-medium text-accent dark:text-accent-dark">
                  {subscriptionData[0].name}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Transaction Details */}
        <View className="px-4 pb-4">
          <CardHeader title="Transaction Details" />
          <Card className="px-4">
            <DetailRow
              label="Type"
              value={transaction.creditDebitIndicator === 'credit' ? 'Income' : 'Expense'}
            />
            <DetailRow
              label="Payment Method"
              value={formatSubtype(transaction.transactionSubtype)}
            />
            <DetailRow label="Currency" value={transaction.currency} isLast={!transaction.domain} />
            {transaction.domain && <DetailRow label="Domain" value={transaction.domain} isLast />}
          </Card>
        </View>

        {/* Bank Native Data */}
        <View className="px-4 pb-8">
          <CardHeader title="Bank Data" />
          <Card className="px-4">
            <DetailRow label="Account" value={transaction.accountIBAN} />
            <DetailRow label="Statement Type" value={transaction.statementType} />
            <View className="border-b border-separator py-3 dark:border-separator-dark">
              <Text className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                Original Description
              </Text>
              <Text className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {transaction.transactionAdditionalDetails}
              </Text>
            </View>
            <View className="py-3">
              <Text className="mb-1 text-sm text-gray-500 dark:text-gray-400">Transaction ID</Text>
              <Text className="font-mono text-xs text-gray-600 dark:text-gray-400">
                {transaction.id}
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </>
  );
}
