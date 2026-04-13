import React from 'react';
import {
  Target, Dumbbell, Footprints, BookOpen, Droplets, Salad,
  BedDouble, Brain, Bike, Waves, PenLine, Music, Sparkles, Pill, Sunrise,
} from 'lucide-react-native';
import { Text } from '@/components/ui/Text';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  target: Target,
  dumbbell: Dumbbell,
  run: Footprints,
  book: BookOpen,
  water: Droplets,
  salad: Salad,
  sleep: BedDouble,
  mindfulness: Brain,
  bike: Bike,
  swim: Waves,
  write: PenLine,
  music: Music,
  clean: Sparkles,
  medicine: Pill,
  sunrise: Sunrise,
};

interface HabitIconProps {
  name: string;
  size?: number;
  color?: string;
}

export function HabitIcon({ name, size = 18, color }: HabitIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return <Text style={{ fontSize: size * 0.9 }}>{name}</Text>;
  return <Icon size={size} color={color} />;
}
