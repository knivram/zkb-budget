import { router, Stack } from "expo-router";

export default function SubscriptionLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Subscriptions",
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          unstable_headerRightItems: () => [
            {
              type: "button",
              label: "Add",
              icon: {
                name: "plus",
                type: "sfSymbol",
              },
              variant: "prominent",
              onPress: () => router.push("/subscriptions/add-subscription"),
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
      <Stack.Screen
        name="[id]"
        options={{
          title: "Subscription",
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
