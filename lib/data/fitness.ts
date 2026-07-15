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

/**
 * 'sets' = the usual sets x reps-range x weight exercise (weight logged per set).
 * 'check' = a single done/not-done item (e.g. "Cardio (30 min)") — no sets to log.
 */
export type ExerciseType = 'sets' | 'check'

export interface Exercise {
  id: string
  name: string
  type: ExerciseType
  /** Target rep range as written on the plan, e.g. "6-8" — display only, not enforced. */
  targetReps?: string
  sets: SetEntry[] // used when type === 'sets'
  done?: boolean // used when type === 'check'
}

export interface DayLog {
  preset?: Preset
  exercises: Exercise[]
  /** Optional supplement checkboxes — available on ANY day, not just Cardio+Abs. */
  supplementCardio?: boolean
  supplementAbs?: boolean
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

type ExerciseTemplate = { name: string; type: ExerciseType; sets: number; targetReps?: string }

/** Build the starting (unlogged) sets for a template — reps/weight fill in as you go. */
function blankSets(count: number): SetEntry[] {
  return Array.from({ length: count }, () => ({ reps: 0, weight: 0 }))
}

/**
 * Your split, as given — set counts + target rep ranges, weight left blank to
 * fill in as you log. Legs and Lower are left blank for now. Applied fresh
 * (new ids) whenever a preset is picked on a day with no exercises yet.
 */
const PRESET_EXERCISES: Record<Preset, ExerciseTemplate[]> = {
  Push: [
    { name: 'Incline Barbell Bench Press', type: 'sets', sets: 3, targetReps: '6-8' },
    { name: 'Pec Dec', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Lateral Raises', type: 'sets', sets: 2, targetReps: '10-12' },
    { name: 'Smith Machine Shoulder Press', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Single Arm Tricep Pushdowns', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Skull Crushers', type: 'sets', sets: 2, targetReps: '6-8' },
  ],
  Pull: [
    { name: 'Lat Pulldowns', type: 'sets', sets: 3, targetReps: '6-8' },
    { name: 'Kelso Rows', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Lat Pullovers', type: 'sets', sets: 3, targetReps: '6-8' },
    { name: 'Standing Bicep Curls', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Cable Preacher Curls', type: 'sets', sets: 2, targetReps: '6-8' },
  ],
  Legs: [],
  'Cardio+Abs': [
    { name: 'Cardio (30 min)', type: 'check', sets: 0 },
    { name: 'Oblique Twists', type: 'sets', sets: 3, targetReps: '10-12' },
    { name: 'Leg Raises', type: 'sets', sets: 3, targetReps: '10-12' },
    { name: 'Cable Crunches', type: 'sets', sets: 3, targetReps: '10-12' },
  ],
  Upper: [
    { name: 'Incline Barbell Bench Press', type: 'sets', sets: 3, targetReps: '6-8' },
    { name: 'Pec Dec', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Weighted Pullups', type: 'sets', sets: 3, targetReps: '6-8' },
    { name: 'Kelso Rows', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Lateral Raises', type: 'sets', sets: 3, targetReps: '10-12' },
    { name: 'Skullcrushers', type: 'sets', sets: 2, targetReps: '6-8' },
    { name: 'Preacher Curls', type: 'sets', sets: 2, targetReps: '6-8' },
  ],
  Lower: [],
  Rest: [],
}

/** Fresh exercises for a preset (new ids each call) — the day's starting log. */
export function presetExercises(preset: Preset): Exercise[] {
  return PRESET_EXERCISES[preset].map((t) => ({
    id: crypto.randomUUID(),
    name: t.name,
    type: t.type,
    targetReps: t.targetReps,
    sets: t.type === 'sets' ? blankSets(t.sets) : [],
    done: t.type === 'check' ? false : undefined,
  }))
}
