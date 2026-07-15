/**
 * Fitness page data — a calendar keyed by date. Click a day, pick a split
 * preset, log exercises (name/sets) and calories vs the profile target.
 */
import { tileStore } from '@/lib/tiles/tileStore'

export const PRESETS = ['Push', 'Pull', 'Legs', 'Cardio+Abs', 'Upper', 'Lower', 'Rest'] as const
export type Preset = (typeof PRESETS)[number]

export interface SetEntry {
  reps: number
  weight: number
}

export interface Exercise {
  id: string
  name: string
  sets: SetEntry[]
}

export interface DayLog {
  preset?: Preset
  exercises: Exercise[]
  calories?: number
}

export interface FitnessData {
  log: Record<string, DayLog> // key = ISO date
}

export const SLOT = 'fitness'
const USER_ID = 'me'

const DEFAULT_DATA: FitnessData = { log: {} }

export async function loadFitness(): Promise<FitnessData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as FitnessData).log === 'object') {
    return raw as FitnessData
  }
  return DEFAULT_DATA
}

export async function saveFitness(data: FitnessData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
}

export function emptyDayLog(): DayLog {
  return { exercises: [] }
}

/** name + per-set {reps, weight} — weight in lb, matches profile().units. */
type ExerciseTemplate = { name: string; sets: SetEntry[] }

function reps(count: number, reps: number, weight: number): SetEntry[] {
  return Array.from({ length: count }, () => ({ reps, weight }))
}

/**
 * Real numbers carried over from the old Train tile (Push/Pull/Legs), converted
 * kg -> lb. Upper/Lower/Cardio+Abs are reasonable starting templates (weight 0 —
 * fill in your own working weight the first time you log them). Rest is empty.
 * Applied fresh (new ids) whenever a preset is picked on a day with no exercises yet.
 */
const PRESET_EXERCISES: Record<Preset, ExerciseTemplate[]> = {
  Push: [
    { name: 'Barbell bench', sets: reps(4, 6, 185) },
    { name: 'Standing barbell OHP', sets: reps(3, 8, 110) },
    { name: 'Incline DB press', sets: reps(3, 10, 70) },
    { name: 'Cable chest fly', sets: reps(3, 12, 40) },
    { name: 'Cable lateral raise', sets: reps(4, 12, 20) },
    { name: 'Tricep rope pushdown', sets: reps(3, 12, 60) },
    { name: 'Overhead cable tri ext', sets: reps(3, 12, 50) },
  ],
  Pull: [
    { name: 'Conventional deadlift', sets: reps(3, 5, 310) },
    { name: 'Weighted pull-ups', sets: reps(4, 8, 35) },
    { name: 'Barbell row', sets: reps(3, 8, 175) },
    { name: 'Lat pulldown', sets: reps(3, 10, 140) },
    { name: 'Cable face pull', sets: reps(3, 15, 50) },
    { name: 'Barbell curl', sets: reps(3, 10, 75) },
    { name: 'Hammer curl', sets: reps(3, 12, 35) },
  ],
  Legs: [
    { name: 'Barbell back squat', sets: reps(4, 6, 265) },
    { name: 'Romanian deadlift', sets: reps(3, 8, 220) },
    { name: 'Leg press', sets: reps(3, 10, 440) },
    { name: 'Lying leg curl', sets: reps(3, 12, 110) },
    { name: 'Leg extension', sets: reps(3, 12, 130) },
    { name: 'Calf raise', sets: reps(4, 12, 200) },
    { name: 'Hanging leg raise', sets: reps(3, 12, 0) },
  ],
  Upper: [
    { name: 'Incline DB press', sets: reps(3, 10, 0) },
    { name: 'Seated cable row', sets: reps(3, 10, 0) },
    { name: 'Cable lateral raise', sets: reps(3, 12, 0) },
    { name: 'Cable face pull', sets: reps(3, 15, 0) },
    { name: 'EZ bar curl', sets: reps(3, 10, 0) },
    { name: 'Skull crushers', sets: reps(3, 12, 0) },
  ],
  Lower: [
    { name: 'Goblet squat', sets: reps(3, 12, 0) },
    { name: 'Walking lunges', sets: reps(3, 12, 0) },
    { name: 'Lying leg curl', sets: reps(3, 12, 0) },
    { name: 'Calf raise', sets: reps(4, 12, 0) },
    { name: 'Hip thrust', sets: reps(3, 10, 0) },
  ],
  'Cardio+Abs': [
    { name: 'Incline treadmill (min)', sets: reps(1, 20, 0) },
    { name: 'Hanging leg raise', sets: reps(3, 12, 0) },
    { name: 'Cable crunch', sets: reps(3, 15, 0) },
    { name: 'Plank (sec)', sets: reps(3, 45, 0) },
  ],
  Rest: [],
}

/** Fresh exercises for a preset (new ids each call) — the day's starting log. */
export function presetExercises(preset: Preset): Exercise[] {
  return PRESET_EXERCISES[preset].map((t) => ({ id: crypto.randomUUID(), name: t.name, sets: t.sets.map((s) => ({ ...s })) }))
}
