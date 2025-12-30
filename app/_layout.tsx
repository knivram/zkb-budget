import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { router, Stack } from "expo-router";
import { StyleSheet, Text, useColorScheme, View } from "react-native";
import { db } from "../db/client";
import migrations from "../drizzle/migrations";
import "../global.css";

export default function RootLayout() {
  const rawTheme = useColorScheme();
  const theme = rawTheme === "dark" ? "dark" : "light";
  const isGlassAvailable = isLiquidGlassAvailable();
  const blurEffect =
    theme === "dark" ? "systemMaterialDark" : "systemMaterialLight";

  // TOOD: #2 handle migrations error
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Migration error: {error.message}</Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          headerTintColor: theme === "dark" ? "white" : "black",
          headerLargeStyle: { backgroundColor: "transparent" },
          headerBlurEffect: isGlassAvailable ? undefined : blurEffect,
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
          headerLargeTitle: false,
          headerTransparent: true,
          headerTintColor: theme === "dark" ? "white" : "black",
          headerBlurEffect: isGlassAvailable ? undefined : blurEffect,
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "red",
  },
});
