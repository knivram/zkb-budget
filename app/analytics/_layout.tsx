import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AnalyticsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerTintColor = isDark ? '#7d7aff' : '#5856d6';
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
          title: 'Analytics',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
        }}
      />
    </Stack>
  );
}
