import { Text, View } from 'react-native';

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
    const Icon = categoryConfig.icon;

    return (
      <View key={item.category} className={index < categories.length - 1 ? 'mb-4' : ''}>
        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="mr-2 h-9 w-9 items-center justify-center rounded-xl"
              style={{ backgroundColor: categoryConfig.color }}
            >
              <Icon size={16} color="#ffffff" />
            </View>
            <Text className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {categoryConfig.label}
            </Text>
          </View>
          <AmountText
            amountCents={item.total}
            roundToDollars={true}
            className="text-sm font-semibold text-slate-900 dark:text-white"
          />
        </View>
        <View className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: categoryConfig.color,
              width: `${relativeWidth}%`,
            }}
          />
        </View>
        <Text className="mt-1 text-xs text-slate-500">{percentage}%</Text>
      </View>
    );
  });
}
