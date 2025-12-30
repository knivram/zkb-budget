import { TextInput, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className = "", ...props }: InputProps) {
  return (
    <TextInput
      className={`text-base text-zinc-900 dark:text-white ${className}`}
      textAlignVertical="center"
      placeholderTextColor="#a1a1aa"
      {...props}
    />
  );
}
