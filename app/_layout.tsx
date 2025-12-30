import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { router, Stack } from "expo-router";
import { Text, View } from "react-native";
import { db } from "../db/client";
import migrations from "../drizzle/migrations";
import "../global.css";

export default function RootLayout() {
  // TOOD: #2 handle migrations error
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
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerLargeTitleEnabled: true,
          title: "Home",
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Add",
              icon: {
                name: "plus",
                type: "sfSymbol",
              },
              onPress: () => router.push("/add-subscription"),
            },
          ],
        }}
      />
      <Stack.Screen
        name="add-subscription"
        options={{
          presentation: "modal",
          title: "Add Subscription",
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
