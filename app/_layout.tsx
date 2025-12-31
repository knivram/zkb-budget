import { db } from "@/db/client";
import migrations from "@/drizzle/migrations";
import "@/global.css";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Text, View } from "react-native";

export default function RootLayout() {
  // TODO: #2 handle migrations error
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="transactions">
        <Icon sf="list.bullet" />
        <Label>Transactions</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="subscriptions">
        <Icon sf="repeat" />
        <Label>Subscriptions</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
