'use client'

import s from './Heatmap.module.css'

interface HeatmapProps {
  weeks?: number
  getValue: (iso: string) => number | null
  colorFor: (value: number | null) => string
  getTitle?: (iso: string, value: number | null) => string
}

const DAY_MS = 24 * 60 * 60 * 1000
const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export default function Heatmap({ weeks = 18, getValue, colorFor, getTitle }: HeatmapProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDow = today.getDay() // 0 = Sun
  const gridEnd = new Date(today.getTime() + (6 - endDow) * DAY_MS)
  const gridStart = new Date(gridEnd.getTime() - (weeks * 7 - 1) * DAY_MS)

  const columns: Date[][] = []
  for (let w = 0; w < weeks; w++) {
    const col: Date[] = []
    for (let d = 0; d < 7; d++) col.push(new Date(gridStart.getTime() + (w * 7 + d) * DAY_MS))
    columns.push(col)
  }

  let lastMonth = -1
  const showMonth = columns.map((col) => {
    const m = col[0].getMonth()
    const show = m !== lastMonth
    lastMonth = m
    return show
  })

  return (
    <div className={s.wrap}>
      <div className={s.monthRow}>
        <div className={s.weekdaySpacer} />
        {columns.map((col, ci) => (
          <div key={ci} className={s.monthLabel}>
            {showMonth[ci] ? col[0].toLocaleDateString('en-US', { month: 'short' }) : ''}
          </div>
        ))}
      </div>
      <div className={s.bodyRow}>
        <div className={s.weekdayCol}>
          {WEEKDAY_LABELS.map((label, i) => (
            <div key={i} className={s.weekdayLabel}>
              {label}
            </div>
          ))}
        </div>
        <div className={s.grid}>
          {columns.map((col, ci) => (
            <div key={ci} className={s.col}>
              {col.map((date, di) => {
                if (date > today) return <div key={di} className={s.cellEmpty} />
                const iso = isoDate(date)
                const value = getValue(iso)
                return (
                  <div
                    key={di}
                    className={s.cell}
                    style={{ background: colorFor(value) }}
                    title={getTitle ? getTitle(iso, value) : iso}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
