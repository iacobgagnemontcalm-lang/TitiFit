import { useLocalSearchParams } from 'expo-router';

import { ComingSoon } from '@/components/ui';
import { CATEGORIES } from '@/data/categories';
import type { CategoryId } from '@/types';

export default function CategoryScreen() {
  const { id } = useLocalSearchParams<{ id: CategoryId }>();
  const category = id ? CATEGORIES[id] : undefined;

  return (
    <ComingSoon
      title={category?.name ?? 'Catégorie'}
      phase="Phase 2"
      description={category?.description ?? 'Le détail de cette catégorie arrive en Phase 2.'}
      icon="stats-chart-outline"
    />
  );
}
