import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/navigation/TabBar';
import { colors } from '@/theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg.base },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      <Tabs.Screen name="add" options={{ title: 'Ajouter' }} />
      <Tabs.Screen name="history" options={{ title: 'Historique' }} />
      <Tabs.Screen name="leaderboard" options={{ title: 'Classement' }} />
    </Tabs>
  );
}
