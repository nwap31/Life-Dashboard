/**
 * Trading page data — daily P&L, long/short, projected/realized RR, and
 * rules discipline (clean/broke). One entry per day; the page's hero is
 * today's entry form, with history + stats computed from `days[]` below it.
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

export interface TradingData {
  days: TradingDay[]
}

export const SLOT = 'trading'
const USER_ID = 'me'

const DEFAULT_DATA: TradingData = { days: [] }

export async function loadTrading(): Promise<TradingData> {
  const raw = await tileStore.loadData(USER_ID, SLOT)
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && Array.isArray((raw as TradingData).days)) {
    return raw as TradingData
  }
  return DEFAULT_DATA
}

export async function saveTrading(data: TradingData): Promise<boolean> {
  return tileStore.saveData(USER_ID, SLOT, data)
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
