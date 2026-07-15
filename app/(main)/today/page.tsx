'use client'

import { useEffect, useState } from 'react'
import s from '../section.module.css'
import { loadToday, saveToday, type TodayData } from '@/lib/data/today'

const today = new Date()
const DATE_LABEL = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

export default function TodayPage() {
  const [data, setData] = useState<TodayData | null>(null)
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    loadToday().then(setData)
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

  const toggleHabit = (id: string) => {
    persist({ ...data, habits: data.habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h)) })
  }

  const toggleStep = (procId: string, stepId: string) => {
    persist({
      ...data,
      procedures: data.procedures.map((p) =>
        p.id === procId
          ? { ...p, steps: p.steps.map((st) => (st.id === stepId ? { ...st, done: !st.done } : st)) }
          : p,
      ),
    })
  }

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>Today</div>
        <h1 className={s.title}>{DATE_LABEL}</h1>
      </header>

      <div className={s.grid2}>
        <section className={s.section}>
          <div className={s.sectionTitle}>To-do</div>
          <div className={s.card}>
            <div className={s.rowList}>
              {data.todos.length === 0 ? (
                <p className={s.empty}>Nothing on the list yet.</p>
              ) : (
                data.todos.map((t) => (
                  <label key={t.id} className={`${s.checkRow} ${t.done ? s.checkRowDone : ''}`}>
                    <input type="checkbox" checked={t.done} onChange={() => toggleTodo(t.id)} />
                    {t.text}
                  </label>
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
    </div>
  )
}
