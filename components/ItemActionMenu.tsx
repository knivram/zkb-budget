import type { ReactNode } from 'react';
import { Alert, Pressable } from 'react-native';

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
  const showMenu = () => {
    if (!onEdit && !onDelete) return;
    const buttons = [];
    if (onEdit) {
      buttons.push({ text: editLabel, onPress: onEdit });
    }
    if (onDelete) {
      buttons.push({ text: deleteLabel, onPress: onDelete, style: 'destructive' as const });
    }
    buttons.push({ text: 'Cancel', style: 'cancel' as const });

    Alert.alert('Actions', undefined, buttons);
  };

  return (
    <Pressable onLongPress={showMenu} onContextMenu={showMenu} delayLongPress={250}>
      {children}
    </Pressable>
  );
}
