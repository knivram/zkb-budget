import type { Category } from "@/db/schema";
import type { Image as SwiftImage } from "@expo/ui/swift-ui";

type SFSymbol = NonNullable<Parameters<typeof SwiftImage>[0]["systemName"]>;

export type CategoryConfig = {
  label: string;
  icon: SFSymbol;
  color: string;
};

export const CATEGORIES: Record<Category, CategoryConfig> = {
  income: {
    label: "Income",
    icon: "dollarsign.circle",
    color: "#10b981",
  },
  transfer: {
    label: "Transfers",
    icon: "arrow.left.arrow.right",
    color: "#6366f1",
  },
  housing: {
    label: "Housing",
    icon: "house.fill",
    color: "#3b82f6",
  },
  food: {
    label: "Groceries & Food",
    icon: "cart.fill",
    color: "#10b981",
  },
  utilities: {
    label: "Utilities",
    icon: "bolt.fill",
    color: "#8b5cf6",
  },
  transport: {
    label: "Transportation",
    icon: "car.fill",
    color: "#f59e0b",
  },
  healthcare: {
    label: "Healthcare & Insurance",
    icon: "cross.case.fill",
    color: "#ec4899",
  },
  dining: {
    label: "Restaurants & Dining",
    icon: "fork.knife",
    color: "#f43f5e",
  },
  shopping: {
    label: "Shopping & Retail",
    icon: "bag.fill",
    color: "#06b6d4",
  },
  entertainment: {
    label: "Entertainment",
    icon: "tv",
    color: "#a855f7",
  },
  personal_care: {
    label: "Personal Care & Fitness",
    icon: "figure.run",
    color: "#14b8a6",
  },
  other: {
    label: "Other",
    icon: "questionmark.circle",
    color: "#64748b",
  },
};
