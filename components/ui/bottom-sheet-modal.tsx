import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

type BottomSheetModalProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissable?: boolean;
};

export function BottomSheetModal({
  visible,
  onClose,
  children,
  dismissable = true,
}: BottomSheetModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          className="absolute inset-0 bg-black/40"
          onPress={dismissable ? onClose : undefined}
        />
        <View
          className={cn('rounded-t-3xl bg-white px-6 pb-10 pt-6 dark:bg-zinc-900', 'shadow-xl')}
        >
          <View className="mb-4 items-center">
            <View className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          </View>
          {children}
        </View>
      </View>
    </Modal>
  );
}
