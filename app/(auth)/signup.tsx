import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Link, router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize } from '@/lib/constants';
import { signInWithGoogle } from '@/lib/google-auth';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: '8+ characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p), label: 'One special character' },
];

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const allRulesPassed = PASSWORD_RULES.every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  async function handleSignup() {
    if (!email || !username || !password) {
      Alert.alert('Error', 'All fields required');
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
      Alert.alert('Error', 'Username: 3-20 chars, lowercase letters, numbers, underscores only');
      return;
    }
    if (!allRulesPassed) {
      Alert.alert('Error', 'Password does not meet all requirements');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    setLoading(false);
    if (error) { Alert.alert('Signup failed', error.message); return; }
    router.replace('/(auth)/onboarding');
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
        <Text variant="heading" style={styles.title}>Create Account</Text>
        <Text variant="caption" style={styles.subtitle}>Start your transformation</Text>

        <TextInput style={styles.input} placeholder="Username" placeholderTextColor={Colors.textMuted}
          autoCapitalize="none" value={username} onChangeText={setUsername} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={Colors.textMuted}
          keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={Colors.textMuted}
          secureTextEntry value={password} onChangeText={setPassword} />

        {/* Password rules */}
        {password.length > 0 && (
          <View style={styles.rulesContainer}>
            {PASSWORD_RULES.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <Text style={[styles.ruleIcon, rule.test(password) && styles.rulePass]}>
                  {rule.test(password) ? '✓' : '○'}
                </Text>
                <Text style={[styles.ruleText, rule.test(password) && styles.ruleTextPass]}>
                  {rule.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        <TextInput style={[
          styles.input,
          confirmPassword.length > 0 && (passwordsMatch ? styles.inputValid : styles.inputError),
        ]}
          placeholder="Confirm Password" placeholderTextColor={Colors.textMuted}
          secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />

        <Button label="CREATE ACCOUNT" onPress={handleSignup} loading={loading}
          style={[styles.btn, (!allRulesPassed || !passwordsMatch) && styles.btnDisabled]}
        />

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
  inputValid: { borderColor: '#22c55e' },
  inputError: { borderColor: '#ef4444' },
  rulesContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: 4,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ruleIcon: {
    fontSize: 12,
    color: Colors.textMuted,
    width: 14,
  },
  rulePass: { color: '#22c55e' },
  ruleText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  ruleTextPass: { color: '#22c55e' },
  btn: { marginTop: Spacing.md },
  btnDisabled: { opacity: 0.5 },
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
