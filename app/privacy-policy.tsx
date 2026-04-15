import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, FontSize, FontWeight } from '@/lib/constants';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect information you provide directly:
• Account information: email address and username
• Profile data: age, gender, weight, height, fitness goals
• Workout data: exercises, sets, reps, weights
• Nutrition data: meals and macros you log
• Habit data: habits you track
• Device sensor data: step counts (via device motion sensor)

We do not sell your personal data to third parties.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your data is used to:
• Power your personalized AI coaching experience
• Track your fitness progress over time
• Provide workout and nutrition recommendations
• Enable social features with friends you connect with
• Improve app performance and features`,
  },
  {
    title: '3. Data Storage & Security',
    body: `Your data is stored:
• Locally on your device (offline-first) using SQLite
• Securely in the cloud via Supabase (PostgreSQL)
• Supabase uses industry-standard encryption (AES-256)
• All data transmission uses HTTPS/TLS

We retain your data as long as your account is active. You may delete your account at any time.`,
  },
  {
    title: '4. AI & Third-Party Services',
    body: `We use Anthropic's Claude AI to power the Coach AI feature. When you use AI coaching, your workout and profile data is sent to Anthropic's API. Anthropic does not retain this data for training purposes per their API terms.

We use Supabase for authentication and cloud storage.
We use Open Food Facts (open database) for food search.`,
  },
  {
    title: '5. Health & Sensor Data',
    body: `Voltrep may request access to:
• Motion/accelerometer data: to count steps
• Camera: to scan food barcodes

This data is processed on-device and not shared with third parties. Step data is only used to display your daily activity within the app.`,
  },
  {
    title: '6. Social Features',
    body: `If you use social features:
• Your username, level, and workout activity may be visible to friends you connect with
• You control who you add as friends
• You can remove friends at any time

We do not make your profile public without your consent.`,
  },
  {
    title: '7. Your Rights',
    body: `You have the right to:
• Access your personal data
• Correct inaccurate data
• Delete your account and all associated data
• Export your data
• Opt out of AI features

To exercise these rights, contact us at privacy@voltrep.app`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `Voltrep is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.`,
  },
  {
    title: '9. Changes to This Policy',
    body: `We may update this privacy policy from time to time. We will notify you of significant changes via the app. Continued use of the app after changes constitutes acceptance.`,
  },
  {
    title: '10. Contact Us',
    body: `For privacy inquiries:
Email: privacy@voltrep.app
Website: voltrep.app/privacy

Last updated: April 2026`,
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text variant="title">Privacy Policy</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text variant="heading" style={styles.mainTitle}>Voltrep Privacy Policy</Text>
        <Text variant="caption" style={styles.date}>Effective: April 2026</Text>

        <Text variant="body" style={styles.intro}>
          Your privacy matters to us. This policy explains what data Voltrep collects, how we use it, and your rights.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.bgCardBorder,
  },
  backBtn: { width: 60 },
  backText: { fontSize: FontSize.lg, color: Colors.primary },
  content: { padding: Spacing.xl },
  mainTitle: { marginBottom: Spacing.xs },
  date: { marginBottom: Spacing.lg, color: Colors.textMuted },
  intro: { marginBottom: Spacing.xl, lineHeight: 22, color: Colors.textSecondary },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.heavy, color: Colors.primary, marginBottom: Spacing.sm },
  sectionBody: { fontSize: FontSize.base, color: Colors.textSecondary, lineHeight: 22 },
});
