/**
 * Self Growth — currently just the habit-tracker log: a daily snapshot of
 * how many of Today's habits got checked off, written every time the Today
 * page's habits change (see lib/data/today.ts callers). Streak/percent are
 * computed from this log, not stored.
 */
import { tileStore } from '@/lib/tiles/tileStore'

export interface HabitLogEntry {
  date: string // ISO date
  total: number
  completed: number
  pct: number // 0-100, rounded
}

export interface SelfGrowthData {
  habitLog: Record<string, HabitLogEntry> // key = ISO date
}

export const SLOT = 'selfGrowth'
const USER_ID = 'me'

const DEFAULT_DATA: SelfGrowthData = { habitLog: {} }

export async function loadSelfGrowth(): Promise<SelfGrowthData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && typeof (raw as SelfGrowthData).habitLog === 'object') {
    return raw as SelfGrowthData
  }
  return DEFAULT_DATA
}

export async function saveSelfGrowth(data: SelfGrowthData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
}

/** Record a day's habit completion. Called by the Today page on every habit toggle. */
export async function logHabits(date: string, total: number, completed: number): Promise<void> {
  const data = await loadSelfGrowth()
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  await saveSelfGrowth({ habitLog: { ...data.habitLog, [date]: { date, total, completed, pct } } })
}

export interface HabitStats {
  currentStreak: number // consecutive most-recent days at 100%
  avgPct: number
  daysLogged: number
}

export function computeHabitStats(habitLog: Record<string, HabitLogEntry>): HabitStats {
  const entries = Object.values(habitLog).sort((a, b) => b.date.localeCompare(a.date)) // newest first
  if (entries.length === 0) return { currentStreak: 0, avgPct: 0, daysLogged: 0 }

  let currentStreak = 0
  for (const e of entries) {
    if (e.pct === 100) currentStreak++
    else break
  }

  const avgPct = Math.round(entries.reduce((sum, e) => sum + e.pct, 0) / entries.length)

  return { currentStreak, avgPct, daysLogged: entries.length }
}
