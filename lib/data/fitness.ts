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
