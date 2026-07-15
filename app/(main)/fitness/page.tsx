'use client'

import { useEffect, useMemo, useState } from 'react'
import s from '../section.module.css'
import f from './fitness.module.css'
import { loadFitness, saveFitness, emptyDayLog, presetExercises, PRESETS, type FitnessData, type Preset } from '@/lib/data/fitness'
import { profile } from '@/lib/tiles/profile'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function pad(n: number) {
  return String(n).padStart(2, '0')
}
function isoOf(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}
function todayISO() {
  const n = new Date()
  return isoOf(n.getFullYear(), n.getMonth(), n.getDate())
}

export default function FitnessPage() {
  const [data, setData] = useState<FitnessData | null>(null)
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [newExercise, setNewExercise] = useState('')

  useEffect(() => {
    loadFitness().then(setData)
  }, [])

  const kcalTarget = profile().kcalTarget ?? 2700

  const cells = useMemo(() => {
    const { year, month } = cursor
    const firstDow = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const list: (number | null)[] = Array(firstDow).fill(null)
    for (let d = 1; d <= daysInMonth; d++) list.push(d)
    return list
  }, [cursor])

  if (!data) return <div className={s.page} />

  const persist = (next: FitnessData) => {
    setData(next)
    saveFitness(next)
  }

  const dayLog = selected ? data.log[selected] ?? emptyDayLog() : null

  const updateDay = (patch: Partial<ReturnType<typeof emptyDayLog>>) => {
    if (!selected) return
    const current = data.log[selected] ?? emptyDayLog()
    persist({ log: { ...data.log, [selected]: { ...current, ...patch } } })
  }

  // Picking a preset loads its template exercises — but only when the day is
  // still empty, so it never clobbers exercises you've already logged.
  const setPreset = (preset: Preset) => {
    const current = selected ? data.log[selected] ?? emptyDayLog() : emptyDayLog()
    if (current.exercises.length === 0) {
      updateDay({ preset, exercises: presetExercises(preset) })
    } else {
      updateDay({ preset })
    }
  }

  const resetToTemplate = () => {
    if (!dayLog?.preset) return
    updateDay({ exercises: presetExercises(dayLog.preset) })
  }

  const addExercise = () => {
    const name = newExercise.trim()
    if (!name || !dayLog) return
    updateDay({ exercises: [...dayLog.exercises, { id: crypto.randomUUID(), name, sets: [] }] })
    setNewExercise('')
  }

  const addSet = (exerciseId: string) => {
    if (!dayLog) return
    updateDay({
      exercises: dayLog.exercises.map((ex) =>
        ex.id === exerciseId ? { ...ex, sets: [...ex.sets, { reps: 0, weight: 0 }] } : ex,
      ),
    })
  }

  const updateSet = (exerciseId: string, idx: number, field: 'reps' | 'weight', value: number) => {
    if (!dayLog) return
    updateDay({
      exercises: dayLog.exercises.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.map((st, i) => (i === idx ? { ...st, [field]: value } : st)) }
          : ex,
      ),
    })
  }

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>Fitness</div>
        <h1 className={s.title}>Split &amp; calories</h1>
      </header>

      <section className={s.section}>
        <div className={f.calendarCard}>
          <div className={f.calendarHead}>
            <button className={f.navBtn} aria-label="Previous month" onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { ...c, month: c.month - 1 }))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <strong className={f.monthLabel}>{monthLabel}</strong>
            <button className={f.navBtn} aria-label="Next month" onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { ...c, month: c.month + 1 }))}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
          <div className={f.calendar}>
            {WEEKDAYS.map((w, i) => (
              <div key={i} className={f.weekday}>
                {w}
              </div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={i} className={`${f.day} ${f.dayEmpty}`} />
              const iso = isoOf(cursor.year, cursor.month, day)
              const entry = data.log[iso]
              const classes = [f.day]
              if (iso === todayISO()) classes.push(f.dayToday)
              if (selected === iso) classes.push(f.daySelected)
              return (
                <div key={i} className={classes.join(' ')} onClick={() => setSelected(iso)}>
                  <span className={f.dayNum}>{day}</span>
                  {entry?.preset && <span className={f.dayPreset}>{entry.preset}</span>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {selected && dayLog && (
        <section className={s.section}>
          <div className={s.sectionTitle}>{selected}</div>
          <div className={s.card}>
            <div className={f.presetRow}>
              {PRESETS.map((p) => (
                <button
                  key={p}
                  className={`${f.presetChip} ${dayLog.preset === p ? f.presetChipActive : ''}`}
                  onClick={() => setPreset(p)}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="field" style={{ maxWidth: 200, marginBottom: 'var(--space-4)' }}>
              <span className="label">Calories (target {kcalTarget})</span>
              <input
                className="input"
                type="number"
                value={dayLog.calories ?? ''}
                onChange={(e) => updateDay({ calories: Number(e.target.value) })}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className={s.sectionTitle}>Exercises</div>
              {dayLog.preset && dayLog.preset !== 'Rest' && (
                <button className="btn-link" onClick={resetToTemplate}>
                  reset to {dayLog.preset} template
                </button>
              )}
            </div>
            {dayLog.exercises.length === 0 ? (
              <p className={s.empty}>No exercises logged.</p>
            ) : (
              dayLog.exercises.map((ex) => (
                <div key={ex.id} style={{ marginBottom: 'var(--space-3)' }}>
                  <strong style={{ fontSize: 'var(--text-sm)' }}>{ex.name}</strong>
                  {ex.sets.map((st, i) => (
                    <div key={i} className={f.exerciseRow}>
                      <span>Set {i + 1}</span>
                      <input
                        className="input"
                        style={{ width: 80 }}
                        type="number"
                        placeholder="reps"
                        value={st.reps}
                        onChange={(e) => updateSet(ex.id, i, 'reps', Number(e.target.value))}
                      />
                      <span>×</span>
                      <input
                        className="input"
                        style={{ width: 90 }}
                        type="number"
                        placeholder="lb"
                        value={st.weight}
                        onChange={(e) => updateSet(ex.id, i, 'weight', Number(e.target.value))}
                      />
                    </div>
                  ))}
                  <button className="btn-link" onClick={() => addSet(ex.id)}>
                    + add set
                  </button>
                </div>
              ))
            )}
            <div className={s.inlineForm}>
              <input
                className="input"
                placeholder="Exercise name…"
                value={newExercise}
                onChange={(e) => setNewExercise(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExercise()}
              />
              <button className="btn btn-primary" onClick={addExercise}>
                Add
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
