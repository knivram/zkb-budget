import ItemActionMenu from '@/components/ItemActionMenu';
import AmountText from '@/components/ui/amount-text';
import { Badge } from '@/components/ui/badge';
import DomainLogo from '@/components/ui/domain-logo';
import { EmptyState } from '@/components/ui/empty-state';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { db } from '@/db/client';
import { transactions, type Transaction } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import ImportTransactions from './import-transactions';

type SectionHeaderItem = {
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

type ListItemData = SectionHeaderItem | TransactionItem;

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

const groupTransactionsByMonth = (transactionsList: Transaction[]): { items: ListItemData[] } => {
  const items: ListItemData[] = [];
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
      sum: (items[currentMonthIndex] as SectionHeaderItem).sum + transaction.signedAmount,
    } as SectionHeaderItem;
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
        className="flex-1 bg-stone-50 dark:bg-stone-950"
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) => (item.type === 'header' ? item.key : item.data.id)}
        getItemType={(item) => item.type}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return (
              <SectionHeader
                title={`${item.month} ${item.year}`}
                trailing={<AmountText amountCents={item.sum} className="text-sm" />}
              />
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
              <ListItem
                onPress={() =>
                  router.push({
                    pathname: '/transactions/[id]',
                    params: { id: transaction.id },
                  })
                }
                leading={
                  <DomainLogo
                    domain={transaction.domain}
                    fallbackIcon={categoryConfig.icon}
                    size={40}
                  />
                }
                trailing={<AmountText amountCents={transaction.signedAmount} />}
                className="bg-white dark:bg-stone-900"
              >
                <Text
                  className="text-base font-medium text-stone-900 dark:text-stone-50"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text className="text-sm text-stone-500 dark:text-stone-400">
                  {formatDate(transaction.date)}
                </Text>
                <View className="mt-1.5 flex-row flex-wrap gap-1">
                  <Badge icon={categoryConfig.icon} color={categoryConfig.color}>
                    {categoryConfig.label}
                  </Badge>
                  {transaction.subscriptionId && (
                    <Badge icon="repeat" color="#7c3aed">
                      Subscription
                    </Badge>
                  )}
                </View>
              </ListItem>
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
