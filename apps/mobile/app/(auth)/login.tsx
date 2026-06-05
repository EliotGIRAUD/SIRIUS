import { useState } from 'react';

import { View, Text, StyleSheet, Alert, Pressable, ScrollView, Linking } from 'react-native';

import { useRouter, Link } from 'expo-router';

import { api, clearToken, setToken } from '../../lib/api';

import { getApiUrl, getWebProUrl } from '../../lib/config';

import { useAuthStore } from '../../stores/useAppStore';

import { Button } from '../../components/ui/Button';

import { Input } from '../../components/ui/Input';

import { colors } from '../../lib/theme';



export default function LoginScreen() {

  const router = useRouter();

  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('adopter@demo.fr');

  const [password, setPassword] = useState('adopter123');

  const [loading, setLoading] = useState(false);



  async function onLogin() {

    setLoading(true);

    try {

      const data = await api<{ token: string; user: Parameters<typeof setAuth>[1] }>('/auth/login', {

        method: 'POST',

        body: JSON.stringify({ email, password }),

      });



      if (data.user.role !== 'adopter') {

        await clearToken();

        Alert.alert(

          'Portail partenaire',

          'Les refuges, éleveurs et annonceurs utilisent SIRIUS Pro sur le web.',

          [

            { text: 'Ouvrir le portail', onPress: () => Linking.openURL(getWebProUrl()) },

            { text: 'OK' },

          ],

        );

        return;

      }



      await setToken(data.token);

      setAuth(data.token, data.user);

      if (!data.user.emailVerified) router.replace('/(auth)/verify-email');

      else if (!data.user.onboardingCompleted) router.replace('/(onboarding)/slides');

      else router.replace('/(adopter)/home');

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connexion impossible';
      const hint =
        msg.includes('Network request failed') || msg.includes('Failed to fetch')
          ? `\n\nTestez dans le navigateur du téléphone : ${getApiUrl()}/health\n(Même Wi-Fi que le PC, ou partage de connexion 4G)`
          : '';
      Alert.alert('Erreur', msg + hint);
    } finally {

      setLoading(false);

    }

  }



  return (

    <ScrollView contentContainerStyle={styles.container}>

      <Text style={styles.title}>SIRIUS</Text>

      <Text style={styles.sub}>Connexion adoptant</Text>

      <Text style={styles.api}>API : {getApiUrl()}</Text>



      <Pressable style={styles.oauth} disabled>

        <Text>Continuer avec Apple</Text>

        <Text style={styles.badge}>Bientôt</Text>

      </Pressable>

      <Pressable style={styles.oauth} disabled>

        <Text>Continuer avec Google</Text>

        <Text style={styles.badge}>Bientôt</Text>

      </Pressable>



      <Input label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />

      <Input label="Mot de passe" value={password} onChangeText={setPassword} secureTextEntry />



      <Button label={loading ? 'Connexion…' : 'Se connecter'} onPress={onLogin} loading={loading} />



      <Pressable style={styles.partnerLink} onPress={() => Linking.openURL(getWebProUrl())}>

        <Text style={styles.partnerLinkText}>Vous êtes un refuge ou partenaire ? Portail web SIRIUS Pro</Text>

      </Pressable>



      <Link href="/(auth)/spa-code" style={styles.link}>Créer un compte avec code SPA</Link>

    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: colors.bg },

  title: { fontSize: 36, fontWeight: '900', color: colors.text },

  sub: { color: colors.muted, marginBottom: 4 },

  api: { color: colors.muted, fontSize: 11, marginBottom: 20 },

  oauth: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',

    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    padding: 14,

    borderRadius: 12,

    marginBottom: 10,

    opacity: 0.6,

  },

  badge: { fontSize: 11, color: colors.muted },

  partnerLink: { marginTop: 16, padding: 10, alignItems: 'center' },

  partnerLinkText: { color: colors.primary, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  link: { marginTop: 12, color: colors.primary, textAlign: 'center', fontWeight: '600' },

});


