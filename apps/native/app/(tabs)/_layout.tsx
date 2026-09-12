import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/src/components/BottomTabBar';
import { colors } from '@/src/theme/tokens';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...(props as React.ComponentProps<typeof BottomTabBar>)} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="invitations" />
      <Tabs.Screen name="my" />
    </Tabs>
  );
}
