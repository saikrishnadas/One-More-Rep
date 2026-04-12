import React, { useState, useRef, useEffect } from 'react';
import {
  View, ScrollView, StyleSheet, TouchableOpacity, TextInput,
  Dimensions, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { Text } from '@/components/ui/Text';
import { Colors, Spacing, Radius, FontSize, FontWeight } from '@/lib/constants';
import type { Goal, Gender, FitnessLevel, DietType } from '@/stores/onboarding';

const { width: SCREEN_W } = Dimensions.get('window');

const MUSCLES = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'glutes', 'core', 'calves', 'forearms', 'traps', 'lats',
];

const MUSCLE_ICONS: Record<string, string> = {
  chest: '🫁', back: '🔙', shoulders: '🤷', biceps: '💪', triceps: '💪',
  legs: '🦵', glutes: '🍑', core: '🎯', calves: '🦵', forearms: '🤜', traps: '🏔️', lats: '🦅',
};

const EQUIPMENT_OPTIONS = [
  { id: 'barbell', label: 'Barbell', icon: '🏋️' },
  { id: 'dumbbells', label: 'Dumbbells', icon: '🏋️' },
  { id: 'cables', label: 'Cables', icon: '〰️' },
  { id: 'machines', label: 'Machines', icon: '⚙️' },
  { id: 'kettlebell', label: 'Kettlebell', icon: '🔔' },
  { id: 'pull_up_bar', label: 'Pull-up Bar', icon: '🔝' },
  { id: 'resistance_bands', label: 'Bands', icon: '🎗️' },
  { id: 'bodyweight', label: 'Bodyweight', icon: '🙆' },
];

const GOALS: { key: Goal; label: string; icon: string; desc: string }[] = [
  { key: 'lose_weight',     label: 'Lose Weight',      icon: '🔥', desc: 'Burn fat, get lean' },
  { key: 'build_muscle',    label: 'Build Muscle',     icon: '💪', desc: 'Get bigger & stronger' },
  { key: 'improve_fitness', label: 'Get Fit',          icon: '🏃', desc: 'Cardio & endurance' },
  { key: 'powerlifting',    label: 'Powerlifting',     icon: '🏋️', desc: 'Max strength' },
  { key: 'stay_active',     label: 'Stay Active',      icon: '🌿', desc: 'Healthy lifestyle' },
];

const TOTAL_STEPS = 11;

// ─── Animated step container (fade + slide from right on mount) ────────────────
function StepContainer({ children, style }: { children: React.ReactNode; style: object }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      {children}
    </Animated.View>
  );
}

// ─── Chip component ────────────────────────────────────────────────────────────
function Chip({ label, icon, selected, onPress }: { label: string; icon?: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {icon && <Text style={styles.chipIcon}>{icon}</Text>}
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text variant="heading" style={styles.stepTitle}>{title}</Text>
      {subtitle && <Text variant="caption" style={styles.stepSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Number input ──────────────────────────────────────────────────────────────
function NumInput({ label, value, onChange, placeholder, unit }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; unit: string;
}) {
  return (
    <View style={styles.numInputGroup}>
      <Text variant="label" style={styles.numInputLabel}>{label}</Text>
      <View style={styles.numInputRow}>
        <TextInput
          style={styles.numInput}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          value={value}
          onChangeText={onChange}
        />
        <Text style={styles.numUnit}>{unit}</Text>
      </View>
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { user, fetchProfile } = useAuthStore();
  const { data, update, toggleMuscle, toggleEquipment, save } = useOnboardingStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  function goNext() {
    const next = step + 1;
    setStep(next);
    Animated.timing(progressAnim, {
      toValue: next / (TOTAL_STEPS - 1),
      duration: 400,
      useNativeDriver: false,
    }).start();
  }

  function goBack() {
    if (step === 0) return;
    const prev = step - 1;
    setStep(prev);
    Animated.timing(progressAnim, {
      toValue: prev / (TOTAL_STEPS - 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }

  function skip() { goNext(); }

  async function finish() {
    if (!user) return;
    setSaving(true);
    try {
      await save(user.id);
      await fetchProfile();
      router.replace('/(tabs)');
    } catch {
      router.replace('/(tabs)');
    } finally {
      setSaving(false);
    }
  }

  async function skipAll() {
    if (!user) return;
    // Save whatever we have so far
    try {
      await save(user.id);
      await fetchProfile();
    } catch {}
    router.replace('/(tabs)');
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ── Step renderers ─────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderBasics();
      case 2: return renderBody();
      case 3: return renderFitnessLevel();
      case 4: return renderGoal();
      case 5: return renderSchedule();
      case 6: return renderStrongMuscles();
      case 7: return renderWeakMuscles();
      case 8: return renderEquipment();
      case 9: return renderInjuries();
      case 10: return renderDiet();
      default: return null;
    }
  }

  function renderWelcome() {
    return (
      <View style={styles.welcomeContainer}>
        <LinearGradient
          colors={[Colors.gradientStart, Colors.gradientEnd]}
          style={styles.welcomeIconBg}
        >
          <Text style={styles.welcomeIcon}>⚡</Text>
        </LinearGradient>
        <Text variant="display" style={styles.welcomeTitle}>Meet Your{'\n'}AI Coach</Text>
        <Text variant="body" style={styles.welcomeBody}>
          To build your perfect personalized program, Coach needs to learn about you first.
        </Text>
        <View style={styles.coachBubble}>
          <Text style={styles.coachBubbleText}>
            "The more I know about you, the better I can guide your training, nutrition, and recovery. This takes about 2 minutes."
          </Text>
          <Text style={styles.coachSig}>— Coach AI 🤖</Text>
        </View>
        <TouchableOpacity onPress={skipAll} style={styles.laterBtn}>
          <Text style={styles.laterText}>Skip for now →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  function renderBasics() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="The Basics" subtitle="Tell us a little about yourself" />

        <Text variant="label" style={styles.fieldLabel}>How old are you?</Text>
        <View style={styles.numInputRow}>
          <TextInput
            style={[styles.numInput, { flex: 1 }]}
            keyboardType="number-pad"
            placeholder="25"
            placeholderTextColor={Colors.textMuted}
            value={data.age}
            onChangeText={v => update({ age: v })}
          />
          <Text style={styles.numUnit}>years</Text>
        </View>

        <Text variant="label" style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>Gender</Text>
        <View style={styles.chipRow}>
          {(['male', 'female', 'other'] as Gender[]).map(g => (
            <Chip
              key={g}
              label={g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
              selected={data.gender === g}
              onPress={() => update({ gender: g })}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderBody() {
    const w = parseFloat(data.weightKg) || 0;
    const h = parseFloat(data.heightCm) || 0;
    const bmi = w && h ? (w / ((h / 100) ** 2)).toFixed(1) : null;
    const bmiLabel = bmi
      ? parseFloat(bmi) < 18.5 ? 'Underweight' : parseFloat(bmi) < 25 ? 'Normal' : parseFloat(bmi) < 30 ? 'Overweight' : 'Obese'
      : null;
    const bmiColor = bmi
      ? parseFloat(bmi) < 18.5 ? Colors.info : parseFloat(bmi) < 25 ? Colors.success : parseFloat(bmi) < 30 ? Colors.warning : Colors.secondary
      : Colors.textMuted;

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="Body Metrics" subtitle="Used to calculate your calorie needs & BMI" />

        <View style={styles.twoCol}>
          <NumInput label="Weight" value={data.weightKg} onChange={v => update({ weightKg: v })} placeholder="70" unit="kg" />
          <NumInput label="Height" value={data.heightCm} onChange={v => update({ heightCm: v })} placeholder="175" unit="cm" />
        </View>

        {bmi && (
          <View style={[styles.bmiCard, { borderColor: bmiColor }]}>
            <Text style={[styles.bmiValue, { color: bmiColor }]}>{bmi}</Text>
            <Text style={[styles.bmiLabel, { color: bmiColor }]}>BMI · {bmiLabel}</Text>
          </View>
        )}

        <View style={styles.twoCol}>
          <NumInput label="Body Fat % (opt.)" value={data.bodyFatPct} onChange={v => update({ bodyFatPct: v })} placeholder="18" unit="%" />
          <NumInput label="Target Weight" value={data.targetWeightKg} onChange={v => update({ targetWeightKg: v })} placeholder="65" unit="kg" />
        </View>

        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>Skip body metrics →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderFitnessLevel() {
    const levels: { key: FitnessLevel; label: string; icon: string; desc: string }[] = [
      { key: 'beginner',     label: 'Beginner',     icon: '🌱', desc: 'Less than 1 year of training' },
      { key: 'intermediate', label: 'Intermediate', icon: '⚡', desc: '1–3 years of consistent training' },
      { key: 'advanced',     label: 'Advanced',     icon: '🦁', desc: '3+ years, know your lifts well' },
    ];

    return (
      <View>
        <SectionTitle title="Your Level" subtitle="Coach adjusts intensity based on this" />
        {levels.map(l => (
          <TouchableOpacity
            key={l.key}
            style={[styles.levelCard, data.fitnessLevel === l.key && styles.levelCardActive]}
            onPress={() => update({ fitnessLevel: l.key })}
            activeOpacity={0.8}
          >
            <Text style={styles.levelIcon}>{l.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.levelLabel}>{l.label}</Text>
              <Text variant="caption">{l.desc}</Text>
            </View>
            {data.fitnessLevel === l.key && <Text style={styles.checkMark}>✓</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function renderGoal() {
    return (
      <View>
        <SectionTitle title="Your Goal" subtitle="This shapes your entire program" />
        <View style={styles.goalGrid}>
          {GOALS.map(g => (
            <TouchableOpacity
              key={g.key}
              style={[styles.goalCard, data.goal === g.key && styles.goalCardActive]}
              onPress={() => update({ goal: g.key })}
              activeOpacity={0.8}
            >
              <Text style={styles.goalIcon}>{g.icon}</Text>
              <Text style={[styles.goalLabel, data.goal === g.key && { color: Colors.primary }]}>{g.label}</Text>
              <Text variant="caption">{g.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  function renderSchedule() {
    const days = [3, 4, 5, 6];
    const durations = [30, 45, 60, 90];

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="Your Schedule" subtitle="How often can you train?" />

        <Text variant="label" style={styles.fieldLabel}>Days per week</Text>
        <View style={styles.chipRow}>
          {days.map(d => (
            <Chip
              key={d}
              label={`${d}x`}
              selected={data.trainingDaysPerWeek === d}
              onPress={() => update({ trainingDaysPerWeek: d })}
            />
          ))}
        </View>

        <Text variant="label" style={[styles.fieldLabel, { marginTop: Spacing.xl }]}>Session length</Text>
        <View style={styles.chipRow}>
          {durations.map(d => (
            <Chip
              key={d}
              label={`${d} min`}
              selected={data.sessionDurationMins === d}
              onPress={() => update({ sessionDurationMins: d })}
            />
          ))}
        </View>
      </ScrollView>
    );
  }

  function renderStrongMuscles() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle
          title="Strong Points 💪"
          subtitle="Which muscles are your strongest? Coach will still train them, but focus less."
        />
        <View style={styles.muscleGrid}>
          {MUSCLES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.muscleCard, data.strongMuscles.includes(m) && styles.muscleCardStrong]}
              onPress={() => toggleMuscle('strongMuscles', m)}
              activeOpacity={0.8}
            >
              <Text style={styles.muscleIcon}>{MUSCLE_ICONS[m]}</Text>
              <Text style={[styles.muscleName, data.strongMuscles.includes(m) && { color: Colors.primary }]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>Skip this step →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderWeakMuscles() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle
          title="Weak Points 🎯"
          subtitle="Which muscles need the most work? Coach will prioritize these."
        />
        <View style={styles.muscleGrid}>
          {MUSCLES.map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.muscleCard, data.weakMuscles.includes(m) && styles.muscleCardWeak]}
              onPress={() => toggleMuscle('weakMuscles', m)}
              activeOpacity={0.8}
            >
              <Text style={styles.muscleIcon}>{MUSCLE_ICONS[m]}</Text>
              <Text style={[styles.muscleName, data.weakMuscles.includes(m) && { color: Colors.secondary }]}>
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>Skip this step →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderEquipment() {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        <SectionTitle title="Your Equipment" subtitle="Coach only suggests exercises you can do" />
        <View style={styles.equipGrid}>
          {EQUIPMENT_OPTIONS.map(e => (
            <TouchableOpacity
              key={e.id}
              style={[styles.equipCard, data.availableEquipment.includes(e.id) && styles.equipCardActive]}
              onPress={() => toggleEquipment(e.id)}
              activeOpacity={0.8}
            >
              <Text style={styles.equipIcon}>{e.icon}</Text>
              <Text style={[styles.equipLabel, data.availableEquipment.includes(e.id) && { color: Colors.primary }]}>
                {e.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>Skip this step →</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  function renderInjuries() {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <SectionTitle
          title="Any Injuries?"
          subtitle="Coach will avoid exercises that could hurt you"
        />
        <TextInput
          style={styles.textArea}
          placeholder="e.g. Lower back pain, left knee discomfort, shoulder impingement..."
          placeholderTextColor={Colors.textMuted}
          value={data.injuries}
          onChangeText={v => update({ injuries: v })}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>No injuries, skip →</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  }

  function renderDiet() {
    const diets: { key: DietType; label: string; icon: string }[] = [
      { key: 'any',     label: 'No Preference', icon: '🍽️' },
      { key: 'non_veg', label: 'Non-Veg',        icon: '🥩' },
      { key: 'veg',     label: 'Vegetarian',     icon: '🥗' },
      { key: 'vegan',   label: 'Vegan',          icon: '🌱' },
      { key: 'keto',    label: 'Keto',           icon: '🥑' },
    ];

    return (
      <View>
        <SectionTitle title="Diet Preference" subtitle="Coach tailors nutrition advice to your diet" />
        <View style={styles.chipRow}>
          {diets.map(d => (
            <Chip
              key={d.key}
              icon={d.icon}
              label={d.label}
              selected={data.dietType === d.key}
              onPress={() => update({ dietType: d.key })}
            />
          ))}
        </View>
        <TouchableOpacity onPress={skip} style={styles.skipInline}>
          <Text style={styles.skipText}>Skip →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLastStep = step === TOTAL_STEPS - 1;
  const isFirstStep = step === 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress bar */}
      {!isFirstStep && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>
      )}

      {/* Header row */}
      {!isFirstStep && (
        <View style={styles.header}>
          <TouchableOpacity onPress={goBack} style={styles.backBtn}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <Text variant="caption">{step} / {TOTAL_STEPS - 1}</Text>
          <TouchableOpacity onPress={skipAll} style={styles.laterBtnSmall}>
            <Text style={styles.laterTextSmall}>Later</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step content with slide-in animation */}
      <StepContainer key={step} style={styles.stepContainer}>
        {renderStep()}
      </StepContainer>

      {/* Bottom button */}
      <View style={styles.footer}>
        {isFirstStep ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>LET'S BUILD YOUR PROGRAM 🔥</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : isLastStep ? (
          <TouchableOpacity style={styles.primaryBtn} onPress={finish} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>{saving ? 'SAVING...' : 'START TRAINING 🚀'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.primaryBtn} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.gradientStart, Colors.gradientEnd]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtnGrad}
            >
              <Text style={styles.primaryBtnText}>NEXT →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // Progress
  progressTrack: { height: 3, backgroundColor: Colors.bgCardBorder, marginHorizontal: 0 },
  progressFill: { height: '100%', backgroundColor: Colors.primary },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
  },
  backBtn: { width: 70 },
  backText: { fontSize: FontSize.lg, color: Colors.primary },
  laterBtnSmall: { width: 70, alignItems: 'flex-end' },
  laterTextSmall: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Step container
  stepContainer: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },

  // Footer
  footer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl, paddingTop: Spacing.md },
  primaryBtn: { borderRadius: Radius.lg, overflow: 'hidden' },
  primaryBtnGrad: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.heavy, letterSpacing: 1 },

  // Welcome
  welcomeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.xxxl },
  welcomeIconBg: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  welcomeIcon: { fontSize: 52 },
  welcomeTitle: { fontSize: 36, fontWeight: FontWeight.heavy, color: Colors.textPrimary, textAlign: 'center', lineHeight: 44 },
  welcomeBody: { textAlign: 'center', marginTop: Spacing.md, color: Colors.textSecondary, lineHeight: 22, paddingHorizontal: Spacing.md },
  coachBubble: {
    marginTop: Spacing.xl, backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.bgCardBorder, padding: Spacing.lg,
    borderTopLeftRadius: Radius.sm,
  },
  coachBubbleText: { fontSize: FontSize.base, color: Colors.textPrimary, lineHeight: 22, fontStyle: 'italic' },
  coachSig: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold, marginTop: Spacing.sm },
  laterBtn: { marginTop: Spacing.xl },
  laterText: { fontSize: FontSize.sm, color: Colors.textMuted },

  // Section
  sectionTitle: { marginBottom: Spacing.xl },
  stepTitle: { color: Colors.textPrimary },
  stepSubtitle: { marginTop: Spacing.xs, color: Colors.textSecondary },

  // Field
  fieldLabel: { marginBottom: Spacing.sm },

  // Num input
  numInputGroup: { flex: 1 },
  numInputLabel: { marginBottom: Spacing.xs, fontSize: FontSize.xs },
  numInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  numInput: {
    flex: 1, backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.base,
  },
  numUnit: { fontSize: FontSize.sm, color: Colors.textMuted, width: 30 },

  // Two column
  twoCol: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },

  // BMI
  bmiCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderRadius: Radius.md,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  bmiValue: { fontSize: FontSize.xxl, fontWeight: FontWeight.heavy },
  bmiLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  // Chip
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.full,
  },
  chipSelected: { backgroundColor: Colors.bgHighlight, borderColor: Colors.primary },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary },

  // Fitness level cards
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md,
  },
  levelCardActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  levelIcon: { fontSize: 28 },
  levelLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: 2 },
  checkMark: { fontSize: FontSize.lg, color: Colors.primary, fontWeight: FontWeight.heavy },

  // Goal grid
  goalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  goalCard: {
    width: '47%', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.lg, padding: Spacing.lg, alignItems: 'center', gap: Spacing.xs,
  },
  goalCardActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  goalIcon: { fontSize: 28 },
  goalLabel: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  // Muscle grid
  muscleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  muscleCard: {
    width: '30%', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs,
  },
  muscleCardStrong: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  muscleCardWeak: { borderColor: Colors.secondary, backgroundColor: '#3f0a0a' },
  muscleIcon: { fontSize: 22 },
  muscleName: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textTransform: 'capitalize' },

  // Equipment grid
  equipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  equipCard: {
    width: '22%', backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.sm, alignItems: 'center', gap: Spacing.xs,
  },
  equipCardActive: { borderColor: Colors.primary, backgroundColor: Colors.bgHighlight },
  equipIcon: { fontSize: 22 },
  equipLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary, textAlign: 'center' },

  // Text area
  textArea: {
    backgroundColor: Colors.bgCard, borderWidth: 1, borderColor: Colors.bgCardBorder,
    borderRadius: Radius.md, padding: Spacing.md, color: Colors.textPrimary,
    fontSize: FontSize.base, minHeight: 120, lineHeight: 22,
  },

  // Skip
  skipInline: { alignItems: 'center', marginTop: Spacing.xl },
  skipText: { fontSize: FontSize.sm, color: Colors.textMuted },
});
