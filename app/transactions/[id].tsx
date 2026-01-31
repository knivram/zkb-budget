import { Alert, ScrollView, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
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
    <View className="flex-row items-center justify-between border-b border-border py-3 dark:border-border-dark">
      <Text className="text-sm text-muted dark:text-muted-dark">{label}</Text>
      <Text className="text-sm font-semibold text-ink dark:text-ink-dark">{value}</Text>
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
        <View className="flex-1 items-center justify-center bg-canvas dark:bg-canvas-dark">
          <Text className="text-muted dark:text-muted-dark">Transaction not found</Text>
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
        className="flex-1 bg-canvas dark:bg-canvas-dark"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Header Section */}
        <View className="items-center border-b border-border px-4 py-6 dark:border-border-dark">
          <DomainLogo
            domain={transaction.domain}
            fallbackIcon={categoryConfig.icon}
            size={80}
            className="mb-3"
          />
          <Text
            className="text-center text-xl font-semibold text-ink dark:text-ink-dark"
            numberOfLines={2}
          >
            {displayName}
          </Text>
          <AmountText amountCents={transaction.signedAmount} className="mt-2 text-3xl font-bold" />
          <Text className="mt-1 text-sm text-muted dark:text-muted-dark">
            {formatDate(transaction.date)}
          </Text>

          {/* Category Badge */}
          <View
            className="mt-4 flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: `${categoryConfig.color}20` }}
          >
            <Host matchContents>
              <SwiftImage systemName={categoryConfig.icon} size={16} color={categoryConfig.color} />
            </Host>
            <Text className="ml-2 text-sm font-medium" style={{ color: categoryConfig.color }}>
              {categoryConfig.label}
            </Text>
          </View>

          {/* Subscription Badge */}
          {subscriptionData.length > 0 && (
            <View className="mt-2 flex-row items-center rounded-full bg-brand/10 px-4 py-2 dark:bg-brand-dark/20">
              <Host matchContents>
                <SwiftImage systemName="repeat" size={14} />
              </Host>
              <Text className="ml-2 text-sm font-semibold text-brand dark:text-brand-dark">
                {subscriptionData[0].name}
              </Text>
            </View>
          )}
        </View>

        {/* Transaction Details */}
        <View className="px-4 py-4">
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle dark:text-subtle-dark">
            Transaction Details
          </Text>
          <View className="rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
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
          <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-subtle dark:text-subtle-dark">
            Bank Data
          </Text>
          <View className="rounded-2xl border border-border bg-surface px-4 dark:border-border-dark dark:bg-surface-dark">
            <DetailRow label="Account" value={transaction.accountIBAN} />
            <DetailRow label="Statement Type" value={transaction.statementType} />
            <View className="border-b border-border py-3 dark:border-border-dark">
              <Text className="mb-1 text-sm text-muted dark:text-muted-dark">
                Original Description
              </Text>
              <Text className="text-sm font-semibold text-ink dark:text-ink-dark">
                {transaction.transactionAdditionalDetails}
              </Text>
            </View>
            <View className="py-3">
              <Text className="mb-1 text-sm text-muted dark:text-muted-dark">Transaction ID</Text>
              <Text className="font-mono text-xs text-subtle dark:text-subtle-dark">
                {transaction.id}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
