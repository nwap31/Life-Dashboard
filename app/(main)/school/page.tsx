'use client'

import { useEffect, useState } from 'react'
import s from '../section.module.css'
import { loadSchool, saveSchool, type SchoolData, type ReadingStatus } from '@/lib/data/school'

const TABS = ['Reading', 'Assignments'] as const
type Tab = (typeof TABS)[number]

const STATUS_LABEL: Record<ReadingStatus, string> = {
  'to-read': 'To read',
  reading: 'Reading',
  done: 'Done',
}

export default function SchoolPage() {
  const [tab, setTab] = useState<Tab>('Reading')
  const [data, setData] = useState<SchoolData | null>(null)
  const [newTitle, setNewTitle] = useState('')
  const [newCourse, setNewCourse] = useState('')
  const [newDue, setNewDue] = useState('')

  useEffect(() => {
    loadSchool().then(setData)
  }, [])

  if (!data) return <div className={s.page} />

  const persist = (next: SchoolData) => {
    setData(next)
    saveSchool(next)
  }

  const addReading = () => {
    const title = newTitle.trim()
    if (!title) return
    persist({ ...data, reading: [...data.reading, { id: crypto.randomUUID(), title, status: 'to-read' }] })
    setNewTitle('')
  }

  const cycleStatus = (id: string) => {
    const order: ReadingStatus[] = ['to-read', 'reading', 'done']
    persist({
      ...data,
      reading: data.reading.map((r) =>
        r.id === id ? { ...r, status: order[(order.indexOf(r.status) + 1) % order.length] } : r,
      ),
    })
  }

  const removeReading = (id: string) => {
    persist({ ...data, reading: data.reading.filter((r) => r.id !== id) })
  }

  const addAssignment = () => {
    const title = newTitle.trim()
    if (!title) return
    persist({
      ...data,
      assignments: [
        ...data.assignments,
        { id: crypto.randomUUID(), title, course: newCourse.trim() || undefined, dueDate: newDue || undefined, done: false },
      ],
    })
    setNewTitle('')
    setNewCourse('')
    setNewDue('')
  }

  const toggleAssignment = (id: string) => {
    persist({ ...data, assignments: data.assignments.map((a) => (a.id === id ? { ...a, done: !a.done } : a)) })
  }

  const removeAssignment = (id: string) => {
    persist({ ...data, assignments: data.assignments.filter((a) => a.id !== id) })
  }

  const sortedAssignments = [...data.assignments].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1
    return (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
  })

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.eyebrow}>School</div>
        <h1 className={s.title}>School</h1>
      </header>

      <div className={s.tabRow}>
        {TABS.map((t) => (
          <button key={t} className={`${s.tab} ${tab === t ? s.tabActive : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Reading' ? (
        <section className={s.section}>
          <div className={s.card}>
            {data.reading.length === 0 ? (
              <p className={s.empty}>Nothing on the list yet.</p>
            ) : (
              <div className={s.rowList}>
                {data.reading.map((r) => (
                  <div key={r.id} className={s.checkRow}>
                    <button
                      className="btn-link"
                      style={{ minWidth: 72, textAlign: 'left' }}
                      onClick={() => cycleStatus(r.id)}
                    >
                      {STATUS_LABEL[r.status]}
                    </button>
                    <span style={{ flex: 1 }} className={r.status === 'done' ? s.checkRowDone : ''}>
                      {r.title}
                    </span>
                    <button className="btn-link" onClick={() => removeReading(r.id)}>
                      delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className={s.inlineForm}>
              <input
                className="input"
                placeholder="Book or article title…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addReading()}
              />
              <button className="btn btn-primary" onClick={addReading}>
                Add
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className={s.section}>
          <p className={s.empty} style={{ marginBottom: 'var(--space-3)' }}>
            Logged manually for now — once your school-year Todoist list exists, ask your mentor to wire up an
            automatic pull, same as the Today page&apos;s calendar sync.
          </p>
          <div className={s.card}>
            {sortedAssignments.length === 0 ? (
              <p className={s.empty}>No assignments yet.</p>
            ) : (
              <div className={s.rowList}>
                {sortedAssignments.map((a) => (
                  <div key={a.id} className={s.checkRow}>
                    <input type="checkbox" checked={a.done} onChange={() => toggleAssignment(a.id)} />
                    <span style={{ flex: 1 }} className={a.done ? s.checkRowDone : ''}>
                      {a.title}
                      {a.course && <span style={{ color: 'var(--muted)' }}> · {a.course}</span>}
                      {a.dueDate && <span style={{ color: 'var(--mint-hover)' }}> · due {a.dueDate}</span>}
                    </span>
                    <button className="btn-link" onClick={() => removeAssignment(a.id)}>
                      delete
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className={s.inlineForm} style={{ flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ flex: 2, minWidth: 160 }}
                placeholder="Assignment…"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAssignment()}
              />
              <input
                className="input"
                style={{ flex: 1, minWidth: 120 }}
                placeholder="Course (optional)"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
              />
              <input className="input" style={{ flex: 1, minWidth: 140 }} type="date" value={newDue} onChange={(e) => setNewDue(e.target.value)} />
              <button className="btn btn-primary" onClick={addAssignment}>
                Add
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
