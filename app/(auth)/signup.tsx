import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email || !username || !password) { Alert.alert('Error', 'All fields required'); return; }
    if (password.length < 8) { Alert.alert('Error', 'Password must be at least 8 characters'); return; }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      Alert.alert('Error', 'Username: 3-20 chars, lowercase letters, numbers, underscores only');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { Alert.alert('Signup failed', error.message); setLoading(false); return; }

    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username });
      if (profileError) { Alert.alert('Profile error', profileError.message); setLoading(false); return; }
    }
    setLoading(false);
    router.replace('/(auth)/onboarding');
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.inner}>
        <Text variant="heading" style={styles.title}>Create Account</Text>
        <Text variant="caption" style={styles.subtitle}>Start your transformation</Text>

        <TextInput style={styles.input} placeholder="Username" placeholderTextColor={Colors.textMuted}
          autoCapitalize="none" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted}
          keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password (8+ chars)" placeholderTextColor={Colors.textMuted}
          secureTextEntry value={password} onChangeText={setPassword} />

        <Button label="CREATE ACCOUNT" onPress={handleSignup} loading={loading} style={styles.btn} />

        <View style={styles.row}>
          <Text variant="caption">Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity><Text variant="caption" color={Colors.primary}>Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'center', padding: Spacing.xxl },
  title: { textAlign: 'center', marginBottom: Spacing.sm },
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
