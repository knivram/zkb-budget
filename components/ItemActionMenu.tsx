import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import type { ReactNode } from 'react';

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
  return (
    <Host>
      <ContextMenu activationMethod="longPress">
        <ContextMenu.Items>
          {onEdit && (
            <Button systemImage="pencil" onPress={onEdit}>
              {editLabel}
            </Button>
          )}
          {onDelete && (
            <Button systemImage="trash" onPress={onDelete} role="destructive">
              {deleteLabel}
            </Button>
          )}
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
