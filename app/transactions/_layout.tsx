import { Stack } from "expo-router";

export default function SubscriptionLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Transactions",
          headerLargeTitleEnabled: true,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="import-transactions"
        options={{
          presentation: "modal",
          title: "Import Transactions",
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
