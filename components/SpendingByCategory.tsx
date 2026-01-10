import { Category } from "@/db/schema";
import { CATEGORIES } from "@/lib/categories";
import { Host, Image as SwiftImage } from "@expo/ui/swift-ui";
import { Text, View } from "react-native";

export type CategoryItem = {
  category: Category;
  total: number;
};

type SpendingByCategoryProps = {
  categories: CategoryItem[];
  monthExpenses: number;
  formatAmount: (amountCents: number) => string;
};

export default function SpendingByCategory({
  categories,
  monthExpenses,
  formatAmount,
}: SpendingByCategoryProps) {
  const maxTotal = Math.max(...categories.map((item) => item.total));

  return categories.map((item, index) => {
    const percentage =
      monthExpenses > 0 ? Math.round((item.total / monthExpenses) * 100) : 0;
    const relativeWidth =
      maxTotal > 0 ? Math.round((item.total / maxTotal) * 90) : 0;
    const categoryKey = item.category;
    const categoryConfig = CATEGORIES[categoryKey] ?? CATEGORIES.other;

    return (
      <View
        key={item.category}
        className={index < categories.length - 1 ? "mb-4" : ""}
      >
        <View className="mb-1.5 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View
              className="mr-2 h-8 w-8 items-center justify-center rounded"
              style={{ backgroundColor: categoryConfig.color }}
            >
              <Host matchContents>
                <SwiftImage systemName={categoryConfig.icon} size={14} />
              </Host>
            </View>
            <Text className="text-sm text-zinc-700 dark:text-zinc-300">
              {categoryConfig.label}
            </Text>
          </View>
          <Text className="text-sm font-medium text-zinc-900 dark:text-white">
            CHF {formatAmount(item.total)}
          </Text>
        </View>
        <View className="h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <View
            className="h-full rounded-full"
            style={{
              backgroundColor: categoryConfig.color,
              width: `${relativeWidth}%`,
            }}
          />
        </View>
        <Text className="mt-1 text-xs text-zinc-500">{percentage}%</Text>
      </View>
    );
  });
}
