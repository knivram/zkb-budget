import { db } from "@/db/client";
import { transactions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { Stack } from "expo-router";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import ImportTransactions from "./import-transactions";

export default function Transactions() {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { data } = useLiveQuery(
    db.select().from(transactions).orderBy(desc(transactions.date))
  );

  return (
    <>
      <Stack.Screen
        options={{
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Import",
              icon: {
                name: "square.and.arrow.down",
                type: "sfSymbol",
              },
              variant: "prominent",
              onPress: () => setIsImportOpen(true),
            },
          ],
        }}
      />
      <FlatList
        className="flex-1 bg-white dark:bg-zinc-900"
        contentInsetAdjustmentBehavior="automatic"
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <Text className="text-base text-zinc-900 dark:text-white">
              {item.transactionAdditionalDetails}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-zinc-500">No transactions imported yet</Text>
            <Text className="text-sm text-zinc-400 mt-2">
              Tap Import to add transactions from XML
            </Text>
          </View>
        }
      />
      <ImportTransactions isOpen={isImportOpen} onOpenChange={setIsImportOpen} />
    </>
  );
}
