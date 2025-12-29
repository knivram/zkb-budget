import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { db } from "../db/client";
import migrations from "../drizzle/migrations";

export default function RootLayout() {
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

  return <Stack />;
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
