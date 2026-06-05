import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export default function AdopterLayout() {
  return (
    <Tabs screenOptions={{ headerShown: true, tabBarActiveTintColor: colors.primary }}>
      <Tabs.Screen name="home" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="paw" size={size} color={color} /> }} />
      <Tabs.Screen name="map" options={{ title: 'Sorties', tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} /> }} />
      <Tabs.Screen name="constellation" options={{ title: 'Étoiles', tabBarIcon: ({ color, size }) => <Ionicons name="star" size={size} color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: 'Boutique', tabBarIcon: ({ color, size }) => <Ionicons name="cart" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      <Tabs.Screen name="dashboard" options={{ href: null }} />
      <Tabs.Screen name="actions" options={{ href: null }} />
      <Tabs.Screen name="report" options={{ href: null }} />
      <Tabs.Screen name="profile/settings" options={{ href: null }} />
      <Tabs.Screen name="profile/certifications" options={{ href: null }} />
      <Tabs.Screen name="profile/subscription" options={{ href: null }} />
      <Tabs.Screen name="profile/dogs" options={{ href: null }} />
    </Tabs>
  );
}
