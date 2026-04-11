import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from './schema';

const sqliteDb = SQLite.openDatabaseSync('gymbuddy.db');

export const db = drizzle(sqliteDb, { schema });

export async function initDatabase() {
  await sqliteDb.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      avatar_url TEXT,
      bodyweight_kg REAL,
      goal TEXT,
      training_days_per_week INTEGER DEFAULT 4,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      sub_muscles TEXT NOT NULL DEFAULT '[]',
      equipment TEXT NOT NULL,
      instructions TEXT,
      image_url TEXT,
      is_custom INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_seconds INTEGER,
      total_volume_kg REAL DEFAULT 0,
      set_count INTEGER DEFAULT 0,
      notes TEXT,
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      is_pr INTEGER DEFAULT 0,
      completed_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      meal_type TEXT,
      food_name TEXT NOT NULL,
      calories REAL NOT NULL,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      source TEXT DEFAULT 'manual',
      synced_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS nutrition_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      calories INTEGER DEFAULT 2200,
      protein_g INTEGER DEFAULT 180,
      carbs_g INTEGER DEFAULT 250,
      fat_g INTEGER DEFAULT 70
    );

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '🎯',
      habit_type TEXT DEFAULT 'boolean',
      target_count INTEGER DEFAULT 1,
      reminder_time TEXT
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      habit_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      count_value INTEGER DEFAULT 0,
      synced_at INTEGER,
      UNIQUE(habit_id, date)
    );
  `);
}
