/**
 * Water log — daily ounces logged, keyed by date. Independent of the
 * "1 Gallon Water" habit checkbox on Today (that's a yes/no; this is the
 * actual running total).
 */
import { tileStore } from '@/lib/tiles/tileStore'

export interface WaterData {
  log: Record<string, number> // key = ISO date, value = total oz logged that day
}

export const SLOT = 'water'
const USER_ID = 'me'
export const DAILY_TARGET_OZ = 128 // 1 gallon

const DEFAULT_DATA: WaterData = { log: {} }

export async function loadWater(): Promise<WaterData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as WaterData).log === 'object') {
    return raw as WaterData
  }
  return DEFAULT_DATA
}

export async function saveWater(data: WaterData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
}
