import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AnalyticsLayout() {
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
          title: 'Analytics',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
