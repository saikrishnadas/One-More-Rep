import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) { Alert.alert('Error', 'Enter email and password'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Text variant="display" style={styles.logo}>🔥</Text>
        <Text variant="heading" style={styles.title}>GYM BUDDY</Text>
        <Text variant="caption" style={styles.subtitle}>Ignite your potential</Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button label="SIGN IN" onPress={handleLogin} loading={loading} style={styles.btn} />

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
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
});
