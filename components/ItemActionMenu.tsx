import type { ComponentType, ReactNode } from 'react';
import { Alert, Pressable, type PressableProps } from 'react-native';

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
  // react-native-web supports onContextMenu, but react-native types don't include it.
  const WebPressable = Pressable as ComponentType<PressableProps & { onContextMenu?: () => void }>;

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
    <WebPressable onLongPress={showMenu} onContextMenu={showMenu} delayLongPress={250}>
      {children}
    </WebPressable>
  );
}
