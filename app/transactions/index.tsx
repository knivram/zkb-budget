import ItemActionMenu from '@/components/ItemActionMenu';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import EmptyState from '@/components/ui/empty-state';
import { db } from '@/db/client';
import { transactions, type Transaction } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import ImportTransactions from './import-transactions';

type SectionHeader = {
  type: 'header';
  month: string;
  year: number;
  key: string;
  sum: number;
};

type TransactionItem = {
  type: 'transaction';
  data: Transaction;
};

type ListItem = SectionHeader | TransactionItem;

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatMonthHeader = (dateStr: string): { month: string; year: number } => {
  const date = new Date(dateStr);
  const month = date.toLocaleDateString('de-CH', { month: 'long' });
  const year = date.getFullYear();
  return { month, year };
};

const getMonthKey = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const groupTransactionsByMonth = (transactionsList: Transaction[]): { items: ListItem[] } => {
  const items: ListItem[] = [];
  let currentMonthKey = '';
  let currentMonthIndex = 0;

  for (const transaction of transactionsList) {
    const monthKey = getMonthKey(transaction.date);

    if (monthKey !== currentMonthKey) {
      const { month, year } = formatMonthHeader(transaction.date);
      const newLength = items.push({
        type: 'header',
        month,
        year,
        key: monthKey,
        sum: 0,
      });
      currentMonthKey = monthKey;
      currentMonthIndex = newLength - 1;
    }

    items.push({
      type: 'transaction',
      data: transaction,
    });
    items[currentMonthIndex] = {
      ...items[currentMonthIndex],
      sum: (items[currentMonthIndex] as SectionHeader).sum + transaction.signedAmount,
    } as SectionHeader;
  }

  return { items };
};

export default function Transactions() {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const { data } = useLiveQuery(db.select().from(transactions).orderBy(desc(transactions.date)));

  const { items } = useMemo(() => groupTransactionsByMonth(data), [data]);

  const handleDelete = (transaction: Transaction) => {
    const name = transaction.displayName ?? transaction.transactionAdditionalDetails;
    Alert.alert('Delete Transaction', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.delete(transactions).where(eq(transactions.id, transaction.id));
          } catch (error) {
            console.error('Failed to delete transaction:', error);
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
              label: 'Import',
              icon: {
                name: 'square.and.arrow.down',
                type: 'sfSymbol',
              },
              variant: 'prominent',
              onPress: () => setIsImportOpen(true),
            },
          ],
        }}
      />
      <FlashList
        className="flex-1 bg-surface dark:bg-surface-dark"
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) => (item.type === 'header' ? item.key : item.data.id)}
        getItemType={(item) => item.type}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View className="flex-row justify-between bg-surface px-4 py-2.5 dark:bg-surface-dark">
                <Text className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  {item.month} {item.year}
                </Text>
                <AmountText amountCents={item.sum} className="text-sm" />
              </View>
            );
          }

          const transaction = item.data;
          const name = transaction.displayName ?? transaction.transactionAdditionalDetails;
          const categoryConfig = CATEGORIES[transaction.category];

          return (
            <ItemActionMenu
              onEdit={() =>
                router.push({
                  pathname: '/transactions/edit-transaction',
                  params: { id: transaction.id },
                })
              }
              onDelete={() => handleDelete(transaction)}
            >
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/transactions/[id]',
                    params: { id: transaction.id },
                  })
                }
              >
                <View className="flex-row border-b border-separator bg-card px-4 py-3 dark:border-separator-dark dark:bg-card-dark">
                  <DomainLogo
                    domain={transaction.domain}
                    fallbackIcon={categoryConfig.icon}
                    size={44}
                    className="mr-3"
                  />

                  <View className="flex-1 justify-center">
                    <Text
                      className="text-base font-medium text-gray-900 dark:text-gray-100"
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <View className="mt-0.5 flex-row items-center">
                      <Text className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </Text>
                      <Text className="mx-1.5 text-gray-300 dark:text-gray-600">{'\u00B7'}</Text>
                      <Host matchContents>
                        <SwiftImage
                          systemName={categoryConfig.icon}
                          size={11}
                          color={categoryConfig.color}
                        />
                      </Host>
                      <Text className="ml-1 text-xs text-gray-500 dark:text-gray-400">
                        {categoryConfig.label}
                      </Text>
                    </View>
                  </View>

                  <View className="items-end justify-center">
                    <AmountText amountCents={transaction.signedAmount} />
                    {transaction.subscriptionId && (
                      <View className="mt-0.5 rounded-full bg-accent/10 px-2 py-0.5 dark:bg-accent-dark/15">
                        <Text className="text-xs font-medium text-accent dark:text-accent-dark">
                          Recurring
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Pressable>
            </ItemActionMenu>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No transactions imported yet"
            subtitle="Tap Import to add transactions from XML"
          />
        }
      />
      <ImportTransactions isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
    </>
  );
}
