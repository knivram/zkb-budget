import { Text, View } from 'react-native';

import { Host, Image as SwiftImage } from '@expo/ui/swift-ui';

import { Category } from '@/db/schema';
import { CATEGORIES } from '@/lib/categories';

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
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="mr-2 h-8 w-8 items-center justify-center rounded-xl"
              style={{ backgroundColor: categoryConfig.color }}
            >
              <Host matchContents>
                <SwiftImage systemName={categoryConfig.icon} size={14} color={'#ffffff'} />
              </Host>
            </View>
            <Text className="text-sm text-slate-700 dark:text-slate-300">
              {categoryConfig.label}
            </Text>
          </View>
          <AmountText
            amountCents={item.total}
            roundToDollars={true}
            tone="neutral"
            className="text-sm font-semibold text-slate-900 dark:text-white"
          />
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: categoryConfig.color,
              width: `${relativeWidth}%`,
            }}
          />
        </View>
        <Text className="mt-1 text-xs text-slate-500 dark:text-slate-400">{percentage}%</Text>
      </View>
    );
  });
}
