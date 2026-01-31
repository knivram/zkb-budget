import { cn } from '@/lib/utils';
import { Modal, Pressable, Text, View } from 'react-native';

type ActionSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: string;
  description: string;
  actionLabel: string;
  loadingLabel?: string;
  isProcessing?: boolean;
  onAction: () => void;
};

export function ActionSheet({
  isOpen,
  onOpenChange,
  title,
  description,
  actionLabel,
  loadingLabel,
  isProcessing = false,
  onAction,
}: ActionSheetProps) {
  const handleClose = () => {
    if (!isProcessing) {
      onOpenChange(false);
    }
  };

  return (
    <Modal transparent visible={isOpen} animationType="slide" onRequestClose={handleClose}>
      <Pressable className="flex-1 bg-black/50" onPress={handleClose}>
        <Pressable
          className="mt-auto rounded-t-3xl border border-border bg-surface px-6 pb-8 pt-4 dark:border-border-dark dark:bg-surface-dark"
          onPress={() => {}}
        >
          <View className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border dark:bg-border-dark" />
          <Text className="text-lg font-semibold text-ink dark:text-ink-dark">{title}</Text>
          <Text className="mt-2 text-sm text-muted dark:text-muted-dark">{description}</Text>
          <Pressable
            className={cn(
              'mt-6 items-center rounded-full bg-brand px-5 py-3 dark:bg-brand-dark',
              isProcessing && 'opacity-60'
            )}
            onPress={onAction}
            disabled={isProcessing}
          >
            <Text className="text-sm font-semibold text-white">
              {isProcessing ? (loadingLabel ?? actionLabel) : actionLabel}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
