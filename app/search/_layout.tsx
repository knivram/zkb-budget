import { Stack, useRouter } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function SearchLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

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
          title: 'Search',
          headerLargeTitleEnabled: true,
          headerTransparent: true,
          headerSearchBarOptions: {
            placeholder: 'Search transactions...',
            autoCapitalize: 'none',
            inputType: 'text',
            onChangeText: (event) => {
              const text = event.nativeEvent.text;
              router.setParams({ q: text });
            },
          },
        }}
      />
    </Stack>
  );
}
