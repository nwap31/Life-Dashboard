'use client'

import { useEffect, useState } from 'react'
import s from '../section.module.css'
import {
  loadTrading,
  saveTrading,
  computeStats,
  type TradingData,
  type TradingDay,
  type Direction,
  type RulesStatus,
} from '@/lib/data/trading'

const todayISO = new Date().toISOString().slice(0, 10)

function blankEntry(): TradingDay {
  return { date: todayISO, pnl: 0, direction: 'long', projectedRR: 0, realizedRR: 0, rules: 'clean' }
}

// Only one sub-section for now (Trading) — more (budgets, net worth, savings)
// nest in here later as additional tabs without touching the sidebar.
const TABS = ['Trading'] as const
type Tab = (typeof TABS)[number]

export default function FinancesPage() {
  const [tab, setTab] = useState<Tab>('Trading')
  const [data, setData] = useState<TradingData | null>(null)
  const [form, setForm] = useState<TradingDay>(blankEntry())

  useEffect(() => {
    loadTrading().then((d) => {
      setData(d)
      const existing = d.days.find((day) => day.date === todayISO)
      if (existing) setForm(existing)
    })
  }, [])

  const submit = () => {
    if (!data) return
    const others = data.days.filter((d) => d.date !== form.date)
    const next = { ...data, days: [...others, form] }
    setData(next)
    saveTrading(next)
  }

  const removeDay = (date: string) => {
    if (!data) return
    const next = { ...data, days: data.days.filter((d) => d.date !== date) }
    setData(next)
    saveTrading(next)
  }

  const toggleStep = (procId: string, stepId: string) => {
    if (!data) return
    const next = {
      ...data,
      procedures: data.procedures.map((p) =>
        p.id === procId
          ? { ...p, steps: p.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)) }
          : p,
      ),
    }
    setData(next)
    saveTrading(next)
  }

  const stats = data ? computeStats(data.days) : null
  const sortedDays = data ? [...data.days].sort((a, b) => b.date.localeCompare(a.date)) : []

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>Finances</div>
        <h1 className={s.title}>Rules, P&amp;L, RR</h1>
      </header>

      <div className={s.tabRow}>
        {TABS.map((t) => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Trading' && data && stats && (
        <>
          <section className={s.section}>
            <div className={s.sectionTitle}>Procedures</div>
            {data.procedures.map((p) => (
              <div key={p.id} className={s.card} style={{ marginBottom: 'var(--space-3)' }}>
                <strong style={{ fontSize: 'var(--text-sm)' }}>{p.title}</strong>
                <div className={s.rowList} style={{ marginTop: 'var(--space-2)' }}>
                  {p.steps.map((st) => (
                    <label key={st.id} className={`${s.checkRow} ${st.done ? s.checkRowDone : ''}`}>
                      <input type="checkbox" checked={st.done} onChange={() => toggleStep(p.id, st.id)} />
                      {st.text}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <div className={s.statRow}>
            <div className={s.stat}>
              <div className={s.statLabel}>Net P&amp;L</div>
              <div className={s.statValue} style={{ color: stats.netPnl >= 0 ? 'var(--mint-hover)' : 'var(--red)' }}>
                {stats.netPnl >= 0 ? '+' : ''}
                {stats.netPnl.toFixed(2)}
              </div>
            </div>
            <div className={s.stat}>
              <div className={s.statLabel}>Win rate</div>
              <div className={s.statValue}>{stats.winRate}%</div>
            </div>
            <div className={s.stat}>
              <div className={s.statLabel}>Clean streak</div>
              <div className={s.statValue}>{stats.cleanStreak}d</div>
            </div>
            <div className={s.stat}>
              <div className={s.statLabel}>30d adherence</div>
              <div className={s.statValue}>{stats.adherence30}%</div>
            </div>
          </div>

          <section className={s.section}>
            <div className={s.sectionTitle}>Log today</div>
            <div className={s.card}>
              <div className={s.grid2}>
                <div className="field">
                  <span className="label">Date</span>
                  <input
                    className="input"
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="field">
                  <span className="label">Daily P&amp;L</span>
                  <input
                    className="input"
                    type="number"
                    step="0.01"
                    value={form.pnl}
                    onChange={(e) => setForm({ ...form, pnl: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <span className="label">Direction</span>
                  <select
                    className="input"
                    value={form.direction}
                    onChange={(e) => setForm({ ...form, direction: e.target.value as Direction })}
                  >
                    <option value="long">Long</option>
                    <option value="short">Short</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
                <div className="field">
                  <span className="label">Rules</span>
                  <select
                    className="input"
                    value={form.rules}
                    onChange={(e) => setForm({ ...form, rules: e.target.value as RulesStatus })}
                  >
                    <option value="clean">Clean</option>
                    <option value="broke">Broke</option>
                  </select>
                </div>
                <div className="field">
                  <span className="label">Projected RR</span>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={form.projectedRR}
                    onChange={(e) => setForm({ ...form, projectedRR: Number(e.target.value) })}
                  />
                </div>
                <div className="field">
                  <span className="label">Realized RR</span>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    value={form.realizedRR}
                    onChange={(e) => setForm({ ...form, realizedRR: Number(e.target.value) })}
                  />
                </div>
              </div>
              <button className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }} onClick={submit}>
                Save day
              </button>
            </div>
          </section>

          <section className={s.section}>
            <div className={s.sectionTitle}>History</div>
            {sortedDays.length === 0 ? (
              <p className={s.empty}>No days logged yet.</p>
            ) : (
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>P&amp;L</th>
                    <th>Dir</th>
                    <th>Proj RR</th>
                    <th>Real RR</th>
                    <th>Rules</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sortedDays.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td style={{ color: d.pnl >= 0 ? 'var(--mint-hover)' : 'var(--red)' }}>
                        {d.pnl >= 0 ? '+' : ''}
                        {d.pnl.toFixed(2)}
                      </td>
                      <td style={{ textTransform: 'capitalize' }}>{d.direction}</td>
                      <td>{d.projectedRR}</td>
                      <td>{d.realizedRR}</td>
                      <td className={d.rules === 'clean' ? s.tagClean : s.tagBroke}>{d.rules}</td>
                      <td>
                        <button
                          className="btn-link"
                          onClick={() => {
                            if (confirm(`Delete the ${d.date} entry?`)) removeDay(d.date)
                          }}
                        >
                          delete
                        </button>
                      </td>
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
