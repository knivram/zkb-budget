import ItemActionMenu from '@/components/ItemActionMenu';
import AmountText from '@/components/ui/amount-text';
import { Badge, EmptyState, ListRow, ListSectionHeader } from '@/components/ui';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions, type Transaction } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Text, View } from 'react-native';
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

const formatCurrency = (amountCents: number): string => {
  const formatted = (amountCents / 100).toLocaleString('de-CH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `CHF ${formatted}`;
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
        className="flex-1 bg-slate-50 dark:bg-slate-950"
        contentInsetAdjustmentBehavior="automatic"
        data={items}
        keyExtractor={(item) => (item.type === 'header' ? item.key : item.data.id)}
        getItemType={(item) => item.type}
        renderItem={({ item, index }) => {
          if (item.type === 'header') {
            return (
              <ListSectionHeader
                title={`${item.month} ${item.year}`}
                value={
                  <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {formatCurrency(item.sum)}
                  </Text>
                }
              />
            );
          }

          const transaction = item.data;
          const name = transaction.displayName ?? transaction.transactionAdditionalDetails;
          const categoryConfig = CATEGORIES[transaction.category];
          const isLast = index === items.length - 1 || items[index + 1]?.type === 'header';

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
              <ListRow
                onPress={() =>
                  router.push({
                    pathname: '/transactions/[id]',
                    params: { id: transaction.id },
                  })
                }
                className={isLast ? 'mb-4' : 'mb-2'}
              >
                <DomainLogo
                  domain={transaction.domain}
                  fallbackIcon={categoryConfig.icon}
                  size={44}
                />

                <View className="flex-1">
                  <Text
                    className="text-base font-semibold text-slate-900 dark:text-white"
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text className="text-sm text-slate-500 dark:text-slate-400">
                    {formatDate(transaction.date)}
                  </Text>

                  <View className="mt-2 flex-row flex-wrap gap-2">
                    <Badge
                      label={categoryConfig.label}
                      icon={
                        <Host matchContents>
                          <SwiftImage systemName={categoryConfig.icon} size={12} />
                        </Host>
                      }
                    />

                    {transaction.subscriptionId && <Badge label="Subscription" variant="accent" />}
                  </View>
                </View>

                <View className="items-end justify-center">
                  <AmountText amountCents={transaction.signedAmount} />
                </View>
              </ListRow>
            </ItemActionMenu>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            title="No transactions yet"
            description="Tap Import to add transactions from your XML export."
            className="py-20"
          />
        }
      />
      <ImportTransactions isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
    </>
  );
}
