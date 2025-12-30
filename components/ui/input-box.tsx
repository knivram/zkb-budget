import { View } from "react-native";

export function InputBox({ children }: { children: React.ReactNode }) {
  return (
    <View className="min-h-[48px] justify-center rounded-xl bg-zinc-100 px-4 py-3.5 dark:bg-zinc-800">
      {children}
    </View>
  );
}
