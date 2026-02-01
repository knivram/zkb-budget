import type { ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  dismissible?: boolean;
};

export default function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  dismissible = true,
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 justify-end bg-black/40"
        onPress={dismissible ? onClose : undefined}
      >
        <Pressable
          className="rounded-t-3xl bg-card px-6 pb-10 pt-6 dark:bg-card-dark"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="mb-1 items-center">
            <View className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          </View>
          <Text className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </Text>
          {subtitle && (
            <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text>
          )}
          <View className="mt-5">{children}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
