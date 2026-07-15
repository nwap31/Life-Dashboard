'use client'

import { useEffect, useState } from 'react'
import s from '../section.module.css'
import { loadSelfGrowth, computeHabitStats, type SelfGrowthData } from '@/lib/data/selfGrowth'
import Heatmap from '@/components/Heatmap'

function habitHeatColor(v: number | null): string {
  if (v === null) return 'var(--border)'
  if (v <= 0) return 'var(--card)'
  if (v < 0.34) return 'rgba(156, 90, 44, 0.28)'
  if (v < 0.67) return 'rgba(156, 90, 44, 0.55)'
  if (v < 1) return 'rgba(156, 90, 44, 0.8)'
  return 'var(--mint)'
}

// Only one sub-section for now (Habits) — room for a reading/journal log etc. later.
const TABS = ['Habits'] as const
type Tab = (typeof TABS)[number]

export default function SelfGrowthPage() {
  const [tab, setTab] = useState<Tab>('Habits')
  const [data, setData] = useState<SelfGrowthData | null>(null)

  useEffect(() => {
    loadSelfGrowth().then(setData)
  }, [])

  const stats = data ? computeHabitStats(data.habitLog) : null
  const entries = data ? Object.values(data.habitLog).sort((a, b) => b.date.localeCompare(a.date)) : []

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>Self Growth</div>
        <h1 className={s.title}>Habit log</h1>
      </header>

      <div className={s.tabRow}>
        {TABS.map((t) => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Habits' && stats && (
        <>
          <div className={s.statRow} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className={s.stat}>
              <div className={s.statLabel}>Current streak</div>
              <div className={s.statValue}>{stats.currentStreak}d</div>
            </div>
            <div className={s.stat}>
              <div className={s.statLabel}>Average completion</div>
              <div className={s.statValue}>{stats.avgPct}%</div>
            </div>
            <div className={s.stat}>
              <div className={s.statLabel}>Days logged</div>
              <div className={s.statValue}>{stats.daysLogged}</div>
            </div>
          </div>

          <section className={s.section}>
            <div className={s.sectionTitle}>Streak Map</div>
            <div className={s.card}>
              <Heatmap
                getValue={(iso) => {
                  const e = data?.habitLog[iso]
                  return e ? e.pct / 100 : null
                }}
                colorFor={habitHeatColor}
                getTitle={(iso) => {
                  const e = data?.habitLog[iso]
                  return e ? `${iso}: ${e.completed}/${e.total} (${e.pct}%)` : `${iso}: no data`
                }}
              />
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionTitle}>History</div>
            {entries.length === 0 ? (
              <p className={s.empty}>Check off a habit on the Today page to start the log.</p>
            ) : (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Completed</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => (
                    <tr key={e.date}>
                      <td>{e.date}</td>
                      <td>
                        {e.completed} / {e.total}
                      </td>
                      <td className={e.pct === 100 ? s.tagClean : undefined}>{e.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  )
}
