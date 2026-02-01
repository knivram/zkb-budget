import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function AnalyticsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const headerTintColor = isDark ? '#fafaf9' : '#0c0a09';
  const headerLargeTitleStyle = { color: isDark ? '#fafaf9' : '#0c0a09' };

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
