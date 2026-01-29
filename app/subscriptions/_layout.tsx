import { router, Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function SubscriptionLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerTintColor = isDark ? '#ffffff' : '#000000';
  const headerLargeTitleStyle = { color: isDark ? '#ffffff' : '#000000' };

  return (
    <Stack
      screenOptions={{
        headerTintColor,
        headerLargeTitleStyle,
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Subscriptions',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          unstable_headerRightItems: () => [
            {
              type: 'button',
              label: 'Add',
              icon: {
                name: 'plus',
                type: 'sfSymbol',
              },
              variant: 'prominent',
              onPress: () => router.push('/subscriptions/add-subscription'),
            },
          ],
        }}
      />
      <Stack.Screen
        name="add-subscription"
        options={{
          presentation: 'modal',
          title: 'Add Subscription',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Subscription',
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="review-detected"
        options={{
          presentation: 'modal',
          title: 'Review Subscriptions',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
