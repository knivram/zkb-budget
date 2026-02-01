import { Pencil, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

type ItemActionMenuProps = {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export default function ItemActionMenu({
  children,
  onEdit,
  onDelete,
  editLabel = 'Edit',
  deleteLabel = 'Delete',
}: ItemActionMenuProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable onLongPress={() => setVisible(true)}>{children}</Pressable>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center bg-black/40"
          onPress={() => setVisible(false)}
        >
          <View className="mx-8 w-64 overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-zinc-800">
            {onEdit && (
              <Pressable
                className="flex-row items-center border-b border-zinc-100 px-4 py-3.5 active:bg-zinc-50 dark:border-zinc-700 dark:active:bg-zinc-700"
                onPress={() => {
                  setVisible(false);
                  onEdit();
                }}
              >
                <Pencil size={18} color="#3b82f6" strokeWidth={2} />
                <Text className="ml-3 text-base text-zinc-900 dark:text-zinc-100">{editLabel}</Text>
              </Pressable>
            )}
            {onDelete && (
              <Pressable
                className="flex-row items-center px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-700"
                onPress={() => {
                  setVisible(false);
                  onDelete();
                }}
              >
                <Trash2 size={18} color="#ef4444" strokeWidth={2} />
                <Text className="ml-3 text-base text-red-600 dark:text-red-400">{deleteLabel}</Text>
              </Pressable>
            )}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
