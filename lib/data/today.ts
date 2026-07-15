/**
 * Today page data — the daily snapshot: to-dos, calendar events, habits, and
 * reusable procedure checklists. Persisted through tileStore under the
 * 'today' slot (same dual localStorage/Supabase store every tile uses).
 *
 * Todos + events are filed in by the mentor (Claude Code) pulling from the
 * Todoist / Calendar MCP connectors — this app never calls those APIs
 * itself. Habits + procedures are edited straight from the UI.
 */
import { tileStore } from '@/lib/tiles/tileStore'

export interface Todo {
  id: string
  text: string
  done: boolean
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

export interface ProcedureStep {
  id: string
  text: string
  done: boolean
}

export interface Procedure {
  id: string
  title: string
  steps: ProcedureStep[]
}

export interface TodayData {
  todos: Todo[]
  events: CalendarEvent[]
  habits: Habit[]
  procedures: Procedure[]
  /** ISO date this snapshot was last synced for — habits/steps reset when it's stale. */
  syncedDate?: string
}

export const SLOT = 'today'
const USER_ID = 'me'

const DEFAULT_DATA: TodayData = {
  todos: [],
  events: [],
  habits: [
    { id: 'h-water', label: 'Hit water target', done: false, date: '' },
    { id: 'h-read', label: '25 min reading', done: false, date: '' },
  ],
  procedures: [
    {
      id: 'p-premarket',
      title: 'Pre-market prep',
      steps: [
        { id: 's1', text: 'Mark key levels', done: false },
        { id: 's2', text: 'Check bias (HTF trend)', done: false },
        { id: 's3', text: 'Review overnight news', done: false },
      ],
    },
  ],
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Load today's data. Rolls habit/procedure-step checkmarks over to unchecked on a new day. */
export async function loadToday(): Promise<TodayData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  const data = (raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as TodayData) : null) ?? DEFAULT_DATA

  const merged: TodayData = {
    todos: data.todos ?? [],
    events: data.events ?? [],
    habits: data.habits ?? DEFAULT_DATA.habits,
    procedures: data.procedures ?? DEFAULT_DATA.procedures,
    syncedDate: data.syncedDate,
  }

  const today = todayISO()
  if (merged.syncedDate !== today) {
    merged.habits = merged.habits.map((h) => ({ ...h, done: false, date: today }))
    merged.procedures = merged.procedures.map((p) => ({
      ...p,
      steps: p.steps.map((s) => ({ ...s, done: false })),
    }))
  }
  return merged
}

export async function saveToday(data: TodayData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, { ...data, syncedDate: todayISO() })
}
