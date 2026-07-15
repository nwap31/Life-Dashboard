/**
 * Nutrition/macro tracker — split out from the workout split calendar so
 * calorie logging isn't tied to whether you trained that day. Keyed by date,
 * independent of lib/data/fitness.ts.
 */
import { tileStore } from '@/lib/tiles/tileStore'

export interface NutritionDay {
  calories?: number
}

export interface NutritionData {
  log: Record<string, NutritionDay> // key = ISO date
}

export const SLOT = 'nutrition'
const USER_ID = 'me'

const DEFAULT_DATA: NutritionData = { log: {} }

export async function loadNutrition(): Promise<NutritionData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as NutritionData).log === 'object') {
    return raw as NutritionData
  }
  return DEFAULT_DATA
}

export async function saveNutrition(data: NutritionData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
}
