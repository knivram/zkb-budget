import AmountText from '@/components/ui/amount-text';
import DomainLogo from '@/components/ui/domain-logo';
import { db } from '@/db/client';
import { transactions, type Transaction } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { FlashList } from '@shopify/flash-list';
import { desc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('de-CH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const filterTransactionsBySearch = (
  transactionsList: Transaction[],
  searchQuery: string
): Transaction[] => {
  if (!searchQuery.trim()) {
    return [];
  }

  const query = searchQuery.toLowerCase().trim();
  return transactionsList.filter((transaction) => {
    const displayName = transaction.displayName?.toLowerCase() ?? '';
    const bankDetails = transaction.transactionAdditionalDetails.toLowerCase();
    return displayName.includes(query) || bankDetails.includes(query);
  });
};

export default function Search() {
  const { q } = useLocalSearchParams<{ q?: string }>();
  const searchQuery = q ?? '';

  const { data } = useLiveQuery(db.select().from(transactions).orderBy(desc(transactions.date)));

  const filteredTransactions = useMemo(
    () => filterTransactionsBySearch(data, searchQuery),
    [data, searchQuery]
  );

  return (
    <FlashList
      className="flex-1 bg-white dark:bg-zinc-900"
      contentInsetAdjustmentBehavior="automatic"
      data={filteredTransactions}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        searchQuery.length > 0 ? (
          <View className="bg-white px-4 py-3 dark:bg-zinc-900">
            <Text className="text-sm text-zinc-500">
              {filteredTransactions.length} result{filteredTransactions.length !== 1 ? 's' : ''} for
              &ldquo;{searchQuery}&rdquo;
            </Text>
          </View>
        ) : null
      }
      renderItem={({ item: transaction }) => {
        const name = transaction.displayName ?? transaction.transactionAdditionalDetails;
        const categoryConfig = CATEGORIES[transaction.category];

        return (
          <View className="flex-row border-b border-zinc-100 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <DomainLogo
              domain={transaction.domain}
              fallbackIcon={categoryConfig.icon}
              size={40}
              className="mr-3"
            />

            <View className="flex-1">
              <Text
                className="text-base font-medium text-zinc-900 dark:text-white"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text className="text-sm text-zinc-500">{formatDate(transaction.date)}</Text>

              <View className="mt-1 flex-row flex-wrap gap-1">
                <View className="flex-row items-center rounded-md bg-zinc-100 px-2 py-0.5 dark:bg-zinc-800">
                  <Host matchContents>
                    <SwiftImage systemName={categoryConfig.icon} size={12} />
                  </Host>
                  <Text className="ml-1 text-xs text-zinc-600 dark:text-zinc-400">
                    {categoryConfig.label}
                  </Text>
                </View>

                {transaction.subscriptionId && (
                  <View className="flex-row items-center rounded-md bg-blue-50 px-2 py-0.5 dark:bg-blue-900/30">
                    <Text className="text-xs text-blue-600 dark:text-blue-400">Subscription</Text>
                  </View>
                )}
              </View>
            </View>

            <View className="items-end justify-center">
              <AmountText amountCents={transaction.signedAmount} />
            </View>
          </View>
        );
      }}
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center py-20">
          {searchQuery.length > 0 ? (
            <>
              <Text className="text-zinc-500">No transactions found</Text>
              <Text className="mt-2 text-sm text-zinc-400">Try a different search term</Text>
            </>
          ) : (
            <>
              <Text className="text-zinc-500">Search for transactions</Text>
              <Text className="mt-2 text-sm text-zinc-400">
                Type in the search bar to find transactions
              </Text>
            </>
          )}
        </View>
      }
    />
  );
}
