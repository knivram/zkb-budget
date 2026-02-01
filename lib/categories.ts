import type { Category } from '@/db/schema';
import type { Image as SwiftImage } from '@expo/ui/swift-ui';

type SFSymbol = NonNullable<Parameters<typeof SwiftImage>[0]['systemName']>;

export type CategoryConfig = {
  label: string;
  icon: SFSymbol;
  color: string;
};

export const CATEGORIES: Record<Category, CategoryConfig> = {
  income: {
    label: 'Income',
    icon: 'dollarsign.circle',
    color: '#0d9488', // accent-600 (teal)
  },
  transfer: {
    label: 'Transfers',
    icon: 'arrow.left.arrow.right',
    color: '#6366f1', // indigo-500
  },
  housing: {
    label: 'Housing',
    icon: 'house.fill',
    color: '#2563eb', // blue-600
  },
  food: {
    label: 'Groceries & Food',
    icon: 'cart.fill',
    color: '#059669', // emerald-600
  },
  utilities: {
    label: 'Utilities',
    icon: 'bolt.fill',
    color: '#7c3aed', // violet-600
  },
  transport: {
    label: 'Transportation',
    icon: 'car.fill',
    color: '#d97706', // amber-600
  },
  healthcare: {
    label: 'Healthcare & Insurance',
    icon: 'cross.case.fill',
    color: '#db2777', // pink-600
  },
  dining: {
    label: 'Restaurants & Dining',
    icon: 'fork.knife',
    color: '#e11d48', // rose-600
  },
  shopping: {
    label: 'Shopping & Retail',
    icon: 'bag.fill',
    color: '#0891b2', // cyan-600
  },
  entertainment: {
    label: 'Entertainment',
    icon: 'tv',
    color: '#9333ea', // purple-600
  },
  personal_care: {
    label: 'Personal Care & Fitness',
    icon: 'figure.run',
    color: '#0d9488', // teal-600
  },
  other: {
    label: 'Other',
    icon: 'questionmark.circle',
    color: '#57534e', // stone-600
  },
};
