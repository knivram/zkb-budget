import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function TransactionsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerTintColor = isDark ? '#f5f7fb' : '#17223b';
  const headerLargeTitleStyle = { color: isDark ? '#f5f7fb' : '#17223b' };

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
          title: 'Transactions',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerBackButtonDisplayMode: 'minimal',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="edit-transaction"
        options={{
          presentation: 'modal',
          title: 'Edit Transaction',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
      <Stack.Screen
        name="import-transactions"
        options={{
          presentation: 'modal',
          title: 'Import Transactions',
          headerLargeTitleEnabled: false,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
