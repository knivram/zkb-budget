import { cn } from "@/lib/utils";
import { TextInput, TextInputProps } from "react-native";

export function Input({ className, ...props }: TextInputProps) {
  return (
    <TextInput
      className={cn(
        "text-base text-zinc-900 dark:text-white rounded-xl bg-zinc-100 px-4 dark:bg-zinc-800",
        className
      )}
      style={[
        {
          height: 44,
          lineHeight: 20,
          paddingVertical: 0,
          paddingBottom: 4,
        },
      ]}
      placeholderTextColor="#a1a1aa"
      multiline={false}
      {...props}
    />
  );
}
