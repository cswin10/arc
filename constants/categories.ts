import type { YearlyGoalCategory } from '../types/database';
import { Ionicons } from '@expo/vector-icons';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CategoryConfig {
  id: YearlyGoalCategory;
  label: string;
  emoji: string;
  icon: IconName;
  color: string;
}

export const YEARLY_GOAL_CATEGORIES: CategoryConfig[] = [
  {
    id: 'business',
    label: 'Business & Finance',
    emoji: '💼',
    icon: 'briefcase-outline',
    color: '#7C4DFF', // Purple
  },
  {
    id: 'brand',
    label: 'Brand & Content',
    emoji: '🌐',
    icon: 'globe-outline',
    color: '#E040FB', // Pink
  },
  {
    id: 'health',
    label: 'Health & Fitness',
    emoji: '💪',
    icon: 'fitness-outline',
    color: '#00E676', // Green
  },
  {
    id: 'personal',
    label: 'Personal Growth',
    emoji: '🌱',
    icon: 'leaf-outline',
    color: '#FFAB00', // Amber
  },
  {
    id: 'travel',
    label: 'Travel',
    emoji: '🌍',
    icon: 'airplane-outline',
    color: '#00B0FF', // Light blue
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle & Environment',
    emoji: '🏙',
    icon: 'home-outline',
    color: '#FF6D00', // Orange
  },
  {
    id: 'other',
    label: 'Other',
    emoji: '📌',
    icon: 'bookmark-outline',
    color: '#78909C', // Blue grey
  },
];

export const getCategoryConfig = (categoryId: YearlyGoalCategory): CategoryConfig => {
  return YEARLY_GOAL_CATEGORIES.find((c) => c.id === categoryId) || YEARLY_GOAL_CATEGORIES[6];
};
