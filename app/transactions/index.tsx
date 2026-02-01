import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router, Stack } from 'expo-router';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import ItemActionMenu from '@/components/ItemActionMenu';
import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions, type Transaction } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
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
        className="flex-1 bg-canvas dark:bg-canvas-dark"
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) => (item.type === 'header' ? item.key : item.data.id)}
        getItemType={(item) => item.type}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <View className="flex-row justify-between border-b border-border bg-surface-muted px-4 py-2 dark:border-border-dark dark:bg-surface-muted-dark">
                <Text className="text-sm font-semibold text-muted dark:text-muted-dark">
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
                <View className="flex-row border-b border-border bg-surface px-4 py-4 dark:border-border-dark dark:bg-surface-dark">
                  <DomainLogo
                    domain={transaction.domain}
                    fallbackIcon={categoryConfig.icon}
                    size={40}
                    className="mr-3"
                  />

                  <View className="flex-1">
                    <Text
                      className="text-base font-semibold text-ink dark:text-ink-dark"
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text className="text-sm text-subtle dark:text-subtle-dark">
                      {formatDate(transaction.date)}
                    </Text>

                    <View className="mt-1 flex-row flex-wrap gap-1">
                      <View className="flex-row items-center rounded-full border border-border bg-surface-muted px-2 py-0.5 dark:border-border-dark dark:bg-surface-muted-dark">
                        <Host matchContents>
                          <SwiftImage systemName={categoryConfig.icon} size={12} />
                        </Host>
                        <Text className="ml-1 text-xs text-muted dark:text-muted-dark">
                          {categoryConfig.label}
                        </Text>
                      </View>

                      {transaction.subscriptionId && (
                        <View className="flex-row items-center rounded-full bg-brand/10 px-2 py-0.5 dark:bg-brand-dark/20">
                          <Text className="text-xs font-medium text-brand dark:text-brand-dark">
                            Subscription
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View className="items-end justify-center">
                    <AmountText amountCents={transaction.signedAmount} />
                  </View>
                </View>
              </Pressable>
            </ItemActionMenu>
          );
        }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted dark:text-muted-dark">No transactions imported yet</Text>
            <Text className="mt-2 text-sm text-subtle dark:text-subtle-dark">
              Tap Import to add transactions from XML
            </Text>
          </View>
        }
      />
      <ImportTransactions isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
    </>
  );
}
