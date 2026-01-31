import { Category } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';
import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';
import { Text, View } from 'react-native';
import AmountText from './ui/amount-text';

export type CategoryItem = {
  category: Category;
  total: number;
};

type SpendingByCategoryProps = {
  categories: CategoryItem[];
  monthExpenses: number;
};

export default function SpendingByCategory({ categories, monthExpenses }: SpendingByCategoryProps) {
  const maxTotal = Math.max(...categories.map((item) => item.total));

  return categories.map((item, index) => {
    const percentage = monthExpenses > 0 ? Math.round((item.total / monthExpenses) * 100) : 0;
    const relativeWidth = maxTotal > 0 ? Math.round((item.total / maxTotal) * 90) : 0;
    const categoryConfig = CATEGORIES[item.category];

    return (
      <View key={item.category} className={index < categories.length - 1 ? 'mb-4' : ''}>
        <View className="mb-1.5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="mr-2 h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: categoryConfig.color }}
            >
              <Host matchContents>
                <SwiftImage systemName={categoryConfig.icon} size={14} color={'#ffffff'} />
              </Host>
            </View>
            <Text className="text-sm text-ink dark:text-ink-dark">{categoryConfig.label}</Text>
          </View>
          <AmountText
            amountCents={item.total}
            roundToDollars={true}
            className="text-sm font-semibold text-ink dark:text-ink-dark"
          />
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-border dark:bg-border-dark">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: categoryConfig.color,
              width: `${relativeWidth}%`,
            }}
          />
        </View>
        <Text className="mt-1 text-xs text-subtle dark:text-subtle-dark">{percentage}%</Text>
      </View>
    );
  });
}
