/**
 * Today page data — the daily snapshot: to-dos, calendar events, and habits.
 * Persisted through tileStore under the 'today' slot (same dual
 * localStorage/Supabase store every tile uses). Procedures moved to the
 * Finances > Trading tab (see lib/data/trading.ts) — they belong with the
 * pre-market routine, not the general daily snapshot.
 *
 * Todos + events are filed in by the mentor (Claude Code) pulling from the
 * Todoist / Calendar MCP connectors — this app never calls those APIs
 * itself. Habits are edited straight from the UI.
 */
import { tileStore } from '@/lib/tiles/tileStore'

export interface Todo {
  id: string
  text: string
  done: boolean
  /** Set when this todo was pulled in from Todoist rather than typed in the app. */
  source?: 'todoist'
}

export interface CalendarEvent {
  id: string
  time: string // e.g. "9:30 AM" or "All day"
  title: string
}

export interface Habit {
  id: string
  label: string
  done: boolean
  date: string // ISO date the 'done' applies to; reset elsewhere on a new day
}

export interface TodayData {
  todos: Todo[]
  events: CalendarEvent[]
  habits: Habit[]
  /** ISO date this snapshot was last synced for — habits reset when it's stale. */
  syncedDate?: string
}

export const SLOT = 'today'
const USER_ID = 'me'

/** The canonical habit list — id is the stable identity, label is what's shown.
 *  Changing a label here re-labels the habit in place (loadToday matches by id
 *  and keeps today's checked state); adding/removing an id adds/drops a row. */
const CANONICAL_HABITS: { id: string; label: string }[] = [
  { id: 'h-supplements', label: 'Supplements' },
  { id: 'h-water', label: '1 Gallon Water' },
  { id: 'h-reflection', label: 'Daily Reflection' },
  { id: 'h-read', label: 'Read for 30 minutes' },
]

const DEFAULT_DATA: TodayData = {
  todos: [],
  events: [],
  habits: CANONICAL_HABITS.map((c) => ({ ...c, done: false, date: '' })),
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Load today's data. Rolls habit checkmarks over to unchecked on a new day,
 *  and reconciles the stored habit list against CANONICAL_HABITS by id. */
export async function loadToday(): Promise<TodayData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  const data = (raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as TodayData) : null) ?? DEFAULT_DATA

  const merged: TodayData = {
    todos: data.todos ?? [],
    events: data.events ?? [],
    habits: CANONICAL_HABITS.map((c) => {
      const existing = (data.habits ?? []).find((h) => h.id === c.id)
      return { id: c.id, label: c.label, done: existing?.done ?? false, date: existing?.date ?? '' }
    }),
    syncedDate: data.syncedDate,
  }

  const today = todayISO()
  if (merged.syncedDate !== today) {
    merged.habits = merged.habits.map((h) => ({ ...h, done: false, date: today }))
  }
  return merged
}

export async function saveToday(data: TodayData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, { ...data, syncedDate: todayISO() })
}
