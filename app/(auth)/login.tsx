import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';
import { signInWithGoogle } from '@/lib/google-auth';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) Alert.alert('Google Sign-In failed', error);
    } catch (e: any) {
      Alert.alert('Google Sign-In failed', e.message ?? 'Unknown error');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Text variant="display" style={styles.logo}>🔥</Text>
        <Text variant="heading" style={styles.title}>VOLTREP</Text>
        <Text variant="caption" style={styles.subtitle}>Ignite your potential</Text>

        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted}
          keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textMuted}
          secureTextEntry value={password} onChangeText={setPassword} />

        <Button label="SIGN IN" onPress={handleLogin} loading={loading} style={styles.btn} />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleSignIn} activeOpacity={0.8} disabled={googleLoading}>
          <Text style={styles.googleIcon}>G</Text>
          <Text style={styles.googleText}>{googleLoading ? 'Signing in...' : 'Continue with Google'}</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          <Text variant="caption">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity><Text variant="caption" color={Colors.primary}>Sign up</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: Spacing.xxl },
  logo: { textAlign: 'center', fontSize: 64, marginBottom: Spacing.sm },
  title: { textAlign: 'center', color: Colors.primary, letterSpacing: 4 },
  subtitle: { textAlign: 'center', marginBottom: Spacing.xxxl },
  input: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    color: Colors.textPrimary,
    fontSize: FontSize.base,
    marginBottom: Spacing.md,
  },
  btn: { marginTop: Spacing.md },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.bgCardBorder,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginHorizontal: Spacing.md,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleText: {
    fontSize: FontSize.base,
    fontWeight: '600',
    color: '#1f1f1f',
  },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
});
