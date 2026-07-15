'use client'

import { useEffect, useState } from 'react'
import s from '../section.module.css'
import { loadToday, saveToday, type TodayData } from '@/lib/data/today'
import { loadSelfGrowth, logHabits, type SelfGrowthData } from '@/lib/data/selfGrowth'
import { loadTrading, type TradingData } from '@/lib/data/trading'
import { loadFitness, type FitnessData } from '@/lib/data/fitness'

const today = new Date()
const DATE_LABEL = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
const TODAY_ISO = today.toISOString().slice(0, 10)

const TABS = ['Today', 'This Week'] as const
type Tab = (typeof TABS)[number]

function currentWeekDates(): Date[] {
  const now = new Date()
  const day = now.getDay() // 0 = Sun
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => new Date(monday.getTime() + i * 86400000))
}

const WEEK_DATES = currentWeekDates()

export default function TodayPage() {
  const [tab, setTab] = useState<Tab>('Today')
  const [data, setData] = useState<TodayData | null>(null)
  const [newTodo, setNewTodo] = useState('')
  const [growth, setGrowth] = useState<SelfGrowthData | null>(null)
  const [trading, setTrading] = useState<TradingData | null>(null)
  const [fitness, setFitness] = useState<FitnessData | null>(null)

  useEffect(() => {
    loadToday().then(setData)
    loadSelfGrowth().then(setGrowth)
    loadTrading().then(setTrading)
    loadFitness().then(setFitness)
  }, [])

  if (!data) return <div className={s.page} />

  const persist = (next: TodayData) => {
    setData(next)
    saveToday(next)
  }

  const addTodo = () => {
    const text = newTodo.trim()
    if (!text) return
    persist({ ...data, todos: [...data.todos, { id: crypto.randomUUID(), text, done: false }] })
    setNewTodo('')
  }

  const toggleTodo = (id: string) => {
    persist({ ...data, todos: data.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })
  }

  const removeTodo = (id: string) => {
    persist({ ...data, todos: data.todos.filter((t) => t.id !== id) })
  }

  const toggleHabit = (id: string) => {
    const habits = data.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    persist({ ...data, habits })
    logHabits(TODAY_ISO, habits.length, habits.filter((h) => h.done).length)
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>Today</div>
        <h1 className={s.title}>{DATE_LABEL}</h1>
      </header>

      <div className={s.tabRow}>
        {TABS.map((t) => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Today' && (
        <>
          <div className={s.grid2}>
            <section className={s.section}>
              <div className={s.sectionTitle}>To-do</div>
              <div className={s.card}>
                <div className={s.rowList}>
                  {data.todos.length === 0 ? (
                    <p className={s.empty}>Nothing on the list yet.</p>
                  ) : (
                    data.todos.map((t) => (
                      <div
                        key={t.id}
                        className={`${s.checkRow} ${t.done ? s.checkRowDone : ''}`}
                        style={{ justifyContent: 'space-between' }}
                      >
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1 }}>
                          <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                          {t.text}
                          {t.source === 'todoist' && (
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>via Todoist</span>
                          )}
                        </label>
                        <button
                          className="btn-link"
                          style={{ padding: 'var(--space-1) var(--space-2)' }}
                          onClick={() => removeTodo(t.id)}
                        >
                          delete
                        </button>
                      </div>
                    ))
                  )}
                </div>
                <div className={s.inlineForm}>
                  <input
                    className="input"
                    placeholder="Add a to-do…"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  />
                  <button className="btn btn-primary" onClick={addTodo}>
                    Add
                  </button>
                </div>
              </div>
            </section>

            <section className={s.section}>
              <div className={s.sectionTitle}>Calendar</div>
              <div className={s.card}>
                <div className={s.rowList}>
                  {data.events.length === 0 ? (
                    <p className={s.empty}>No events synced yet — ask your mentor to pull today&apos;s calendar.</p>
                  ) : (
                    data.events.map((e) => (
                      <div key={e.id} className={s.checkRow}>
                        <strong style={{ minWidth: 72, color: 'var(--mint-hover)' }}>{e.time}</strong>
                        {e.title}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>

          <section className={s.section}>
            <div className={s.sectionTitle}>Habits</div>
            <div className={s.card}>
              <div className={s.rowList}>
                {data.habits.map((h) => (
                  <label key={h.id} className={`${s.checkRow} ${h.done ? s.checkRowDone : ''}`}>
                    <input type="checkbox" checked={h.done} onChange={() => toggleHabit(h.id)} />
                    {h.label}
                  </label>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {tab === 'This Week' && (
        <section className={s.section}>
          <div className={s.sectionTitle}>Mon – Sun</div>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Day</th>
                <th>Habits</th>
                <th>Trading</th>
                <th>Workout</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DATES.map((date) => {
                const iso = date.toISOString().slice(0, 10)
                const isToday = iso === TODAY_ISO
                const habitEntry = growth?.habitLog[iso]
                const tradingEntry = trading?.days.find((d) => d.date === iso)
                const fitnessEntry = fitness?.log[iso]
                return (
                  <tr key={iso} style={isToday ? { background: 'rgba(156, 90, 44, 0.06)' } : undefined}>
                    <td>
                      <strong>{date.toLocaleDateString('en-US', { weekday: 'short' })}</strong>{' '}
                      <span style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)' }}>
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td>{habitEntry ? `${habitEntry.completed}/${habitEntry.total}` : '—'}</td>
                    <td className={tradingEntry ? (tradingEntry.rules === 'clean' ? s.tagClean : s.tagBroke) : undefined}>
                      {tradingEntry ? `${tradingEntry.pnl >= 0 ? '+' : ''}${tradingEntry.pnl.toFixed(2)}` : '—'}
                    </td>
                    <td>{fitnessEntry?.preset ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}
