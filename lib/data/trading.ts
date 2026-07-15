/**
 * Trading page data — daily P&L, long/short, projected/realized RR, rules
 * discipline (clean/broke), and the pre-market procedure checklist. One
 * P&L entry per day; the page's hero is today's entry form, with history +
 * stats computed from `days[]` below it. Procedures reset daily like the
 * old Today-page ones did (moved here since they belong with the trading
 * routine, not the general daily snapshot).
 */
import { tileStore } from '@/lib/tiles/tileStore'

export type Direction = 'long' | 'short' | 'mixed'
export type RulesStatus = 'clean' | 'broke'

export interface TradingDay {
  date: string // ISO date, one entry per day
  pnl: number
  direction: Direction
  projectedRR: number
  realizedRR: number
  rules: RulesStatus
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

export interface TradingData {
  days: TradingDay[]
  procedures: Procedure[]
  /** ISO date the procedure checklist was last synced for — steps reset when stale. */
  proceduresSyncedDate?: string
}

export const SLOT = 'trading'
const USER_ID = 'me'

const DEFAULT_PROCEDURES: Procedure[] = [
  {
    id: 'p-premarket',
    title: 'Pre-market prep',
    steps: [
      { id: 's1', text: 'Mark key levels', done: false },
      { id: 's2', text: 'Check bias (HTF trend)', done: false },
      { id: 's3', text: 'Review overnight news', done: false },
    ],
  },
]

const DEFAULT_DATA: TradingData = { days: [], procedures: DEFAULT_PROCEDURES }

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function loadTrading(): Promise<TradingData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  const data =
    raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as TradingData).days)
      ? (raw as TradingData)
      : DEFAULT_DATA

  const merged: TradingData = {
    days: data.days ?? [],
    procedures: data.procedures ?? DEFAULT_PROCEDURES,
    proceduresSyncedDate: data.proceduresSyncedDate,
  }

  const today = todayISO()
  if (merged.proceduresSyncedDate !== today) {
    merged.procedures = merged.procedures.map((p) => ({
      ...p,
      steps: p.steps.map((s) => ({ ...s, done: false })),
    }))
  }
  return merged
}

export async function saveTrading(data: TradingData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, { ...data, proceduresSyncedDate: todayISO() })
}

export interface TradingStats {
  netPnl: number
  winRate: number // % of days with pnl > 0
  cleanStreak: number // consecutive most-recent clean days
  adherence30: number // % of last 30 entries that were clean
}

export function computeStats(days: TradingDay[]): TradingStats {
  if (days.length === 0) return { netPnl: 0, winRate: 0, cleanStreak: 0, adherence30: 0 }

  const sorted = [...days].sort((a, b) => a.date.localeCompare(b.date))
  const netPnl = sorted.reduce((sum, d) => sum + d.pnl, 0)
  const wins = sorted.filter((d) => d.pnl > 0).length
  const winRate = Math.round((wins / sorted.length) * 100)

  let cleanStreak = 0
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].rules === 'clean') cleanStreak++
    else break
  }

  const last30 = sorted.slice(-30)
  const clean30 = last30.filter((d) => d.rules === 'clean').length
  const adherence30 = Math.round((clean30 / last30.length) * 100)

  return { netPnl, winRate, cleanStreak, adherence30 }
}
