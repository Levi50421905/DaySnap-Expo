import { Tabs } from 'expo-router'
import { Text } from 'react-native'

const ICONS: Record<string, string> = {
  daily: '📅', gallery: '🖼️', collection: '✦', memories: '☀', stats: '📊', settings: '⚙️',
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#6B6A66',
        tabBarStyle: { backgroundColor: '#141416', borderTopColor: 'rgba(255,255,255,0.07)' },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tabs.Screen name="daily" options={{ title: 'Daily' }} />
      <Tabs.Screen name="gallery" options={{ title: 'Gallery' }} />
      <Tabs.Screen name="collection" options={{ title: 'Collection' }} />
      <Tabs.Screen name="memories" options={{ title: 'Memories' }} />
      <Tabs.Screen name="stats" options={{ title: 'Stats' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}