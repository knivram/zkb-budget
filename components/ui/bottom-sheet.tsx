import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { cn } from '@/lib/utils';

type BottomSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  children: ReactNode;
  dismissible?: boolean;
  className?: string;
};

export function BottomSheet({
  isOpen,
  onOpenChange,
  children,
  dismissible = true,
  className,
}: BottomSheetProps) {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="slide"
      onRequestClose={() => {
        if (dismissible) {
          onOpenChange(false);
        }
      }}
    >
      <View className="flex-1 justify-end">
        <Pressable
          className="flex-1 bg-slate-900/40"
          onPress={() => {
            if (dismissible) {
              onOpenChange(false);
            }
          }}
        />
        <View
          className={cn(
            'rounded-t-3xl border border-slate-200 bg-white px-6 pb-8 pt-6 dark:border-slate-800 dark:bg-slate-950',
            className
          )}
        >
          {children}
        </View>
      </View>
    </Modal>
  );
}
