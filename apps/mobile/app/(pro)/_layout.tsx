import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ProLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: '#2563eb' }}>
      <Tabs.Screen name="clients" options={{ title: 'Clients', tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} /> }} />
      <Tabs.Screen name="codes" options={{ title: 'Codes', tabBarIcon: ({ color, size }) => <Ionicons name="key" size={size} color={color} /> }} />
    </Tabs>
  );
}
