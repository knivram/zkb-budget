import type { LucideIcon } from 'lucide-react-native';
import {
  ArrowLeftRight,
  Car,
  Cross,
  DollarSign,
  Dumbbell,
  HelpCircle,
  Home,
  ShoppingBag,
  ShoppingCart,
  Tv,
  Utensils,
  Zap,
} from 'lucide-react-native';

import type { Category } from '@/db/schema';

export type CategoryConfig = {
  label: string;
  icon: LucideIcon;
  color: string;
};

export const CATEGORIES: Record<Category, CategoryConfig> = {
  income: {
    label: 'Income',
    icon: DollarSign,
    color: '#16a34a',
  },
  transfer: {
    label: 'Transfers',
    icon: ArrowLeftRight,
    color: '#6366f1',
  },
  housing: {
    label: 'Housing',
    icon: Home,
    color: '#2563eb',
  },
  food: {
    label: 'Groceries & Food',
    icon: ShoppingCart,
    color: '#0d9488',
  },
  utilities: {
    label: 'Utilities',
    icon: Zap,
    color: '#8b5cf6',
  },
  transport: {
    label: 'Transportation',
    icon: Car,
    color: '#f59e0b',
  },
  healthcare: {
    label: 'Healthcare & Insurance',
    icon: Cross,
    color: '#ec4899',
  },
  dining: {
    label: 'Restaurants & Dining',
    icon: Utensils,
    color: '#f43f5e',
  },
  shopping: {
    label: 'Shopping & Retail',
    icon: ShoppingBag,
    color: '#06b6d4',
  },
  entertainment: {
    label: 'Entertainment',
    icon: Tv,
    color: '#a855f7',
  },
  personal_care: {
    label: 'Personal Care & Fitness',
    icon: Dumbbell,
    color: '#14b8a6',
  },
  other: {
    label: 'Other',
    icon: HelpCircle,
    color: '#64748b',
  },
};
