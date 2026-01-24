import type { ReactNode } from 'react';

type ItemActionMenuProps = {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
};

export default function ItemActionMenu({ children }: ItemActionMenuProps) {
  // On web, just render the children without the context menu
  return <>{children}</>;
}
