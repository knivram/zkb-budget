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
      <ContextMenu>
        <ContextMenu.Items>
          {onEdit && <Button systemImage="pencil" label={editLabel} onPress={onEdit} />}
          {onDelete && (
            <Button systemImage="trash" label={deleteLabel} onPress={onDelete} role="destructive" />
          )}
        </ContextMenu.Items>
        <ContextMenu.Trigger>{children}</ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}
