import { db } from '@/db/client';
import migrations from '@/drizzle/migrations';
import '@/global.css';
import { registerDevMenuItems } from '@/lib/devMenu';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Text, View } from 'react-native';

export default function RootLayout() {
  registerDevMenuItems();

  // TODO: #2 handle migrations error
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-red-500">Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-surface dark:bg-surface-dark">
        <Text className="text-gray-900 dark:text-gray-100">Loading...</Text>
      </View>
    );
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="transactions">
        <NativeTabs.Trigger.Icon sf="list.bullet" />
        <NativeTabs.Trigger.Label>Transactions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subscriptions">
        <NativeTabs.Trigger.Icon sf="repeat" />
        <NativeTabs.Trigger.Label>Subscriptions</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="analytics">
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" />
        <NativeTabs.Trigger.Label>Analytics</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
