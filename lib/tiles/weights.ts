/**
 * Goals + tile weights — the math of the equation, with NO AI key at runtime.
 *
 *   y = the Mentor (the overseer, where the math lives)
 *   x = each input tile · w = that tile's share of the ACTIVE goal
 *
 * Each goal carries its own weights (sum ≈ 100): "famous YouTuber" leans on
 * Brand; "185 lb lean" leans on Train/Fuel. The row badges show the active
 * goal's weights; the Mentor lists every goal with its full breakdown.
 *
 * WHO DOES THE MATH: Claude Code, at build time — not an Anthropic key, not
 * you by hand. In VS Code, say:
 *
 *   "My goals are X and Y. Open lib/tiles/weights.ts and re-run the math:
 *    for each goal, weigh how much each tile's input actually moves it
 *    (ask me questions if you need to). Each goal's weights sum to 100."
 *
 * Claude reasons, edits DEFAULT_GOALS, you reload. Later it can also
 * cross-reference your real tile data (video published vs workouts, water,
 * caffeine) and retune from evidence. A localStorage override
 * ('vitality:goals') wins over these defaults, so the connector or a goals
 * UI can retune without a code change.
 */

export interface Goal {
  id: string
  title: string
  /** tile slot -> % of this goal (sums to ~100) */
  weights: Record<string, number>
  /** true while the mentor (Claude Code) hasn't shaped + weighed it yet */
  pending?: boolean
  /** each goal tints the board a little; the overall goal goes gold */
  accent?: string
  /** how far you've come, 0–100 — computed by the mentor from data sweeps
   *  (analytics, manual logs, wearables), never guessed by the app */
  progress?: number
}

/** One observation the mentor pushed after scanning your data, with any
 *  weight changes it made because of what it found. */
export interface Notice {
  id: string
  when: string
  text: string
  /** bullet points; **bold** marks the highlighted words */
  points?: string[]
  deltas?: { tile: string; from: number; to: number }[]
}

export const DEFAULT_GOALS: Goal[] = [
  {
    id: 'trader',
    title: 'Be a profitable day trader',
    accent: '#8AB4FF',
    // The main goal. Finance is the direct lever; but day trading is won on the
    // mental game — Vitals (sleep/stress/focus) and Peak (caffeine/sharpness)
    // carry real weight, with Fuel/Train keeping the machine steady.
    weights: { finance: 55, vitals: 22, peak: 10, fuel: 8, train: 5 },
  },
  {
    id: 'jacked',
    title: 'Get jacked',
    accent: '#6EE7B7',
    weights: { train: 40, fuel: 30, vitals: 18, peak: 12 },
  },
  {
    id: 'knowledge',
    title: 'Become more knowledgeable',
    accent: '#C4B5FD',
    // No tile tracks learning yet — see DEFAULT_IDEAS ('knowledge' → Learn tile).
    // Until one exists, this leans on the inputs that protect retention and
    // consistency: recovery, energy, and steady training/fuel.
    weights: { vitals: 45, peak: 20, fuel: 20, train: 15 },
  },
]

/** The overseer's synthesis of EVERY goal, polished into one sentence by the
 *  mentor (Claude Code). Switching it on = top priority — the board goes gold. */
export const OVERALL_GOAL: Goal = {
  id: 'overall',
  title: 'Trade profitably every day — sharp, strong, always learning',
  accent: '#E8C878',
  weights: { finance: 35, vitals: 22, train: 18, fuel: 13, peak: 12 },
}

/** Overall first, then the individual goals. */
export function allGoals(): Goal[] {
  return [OVERALL_GOAL, ...goals()]
}

/** The full active Goal (incl. overall), for accent + title. */
export function activeGoal(): Goal | undefined {
  const id = activeGoalId()
  return allGoals().find((g) => g.id === id) ?? goals()[0]
}

export const DEFAULT_NOTICED: Notice[] = [
  {
    id: 'n-first-day',
    when: 'just now',
    text: 'Set your equation, Nolan: trading leads, get jacked and grow knowledge feed in behind it. No data to read yet — the moment your tiles start filling, I watch for the patterns (trades vs sleep, gym vs focus) and retune these weights from evidence, not guesses.',
    points: [
      'Main goal locked: **be a profitable day trader** — Finance carries it',
      'Your **mental game** (Vitals + Peak) is weighted heavier than most traders admit',
      'One gap found: **nothing tracks learning yet** — build a Learn tile with /tile learn',
    ],
  },
]

/** A blueprint for a tile they SHOULD have — a gap the mentor found between
 *  their goal and what their tiles actually track. Pre-written by the mentor
 *  (Claude Code) from their data; localStorage 'vitality:ideas' overrides. */
export interface TileIdea {
  /** ONE word — how the idea shows up in the popup (the mentor picks it) */
  word?: string
  title: string
  /** what the tile tracks, in one line */
  tracks: string
  /** why it moves THIS goal — tied to their data when possible */
  why: string
  /** the weight it would likely earn (≈ %) */
  estWeight: number
}

export const DEFAULT_IDEAS: Record<string, TileIdea[]> = {
  overall: [
    {
      word: 'Learn',
      title: 'Learn',
      tracks: 'study sessions + what you covered, per day',
      why: 'One of your three goals is knowledge, but no tile measures it. This is the missing input — the cheapest one to add.',
      estWeight: 12,
    },
    {
      word: 'Journal',
      title: 'Trade journal',
      tracks: 'setups, wins/losses, and the mistake tags behind them',
      why: 'Finance tracks the P&L; nothing tracks WHY. For a trader, the review loop is where the edge compounds.',
      estWeight: 10,
    },
  ],
  trader: [
    {
      word: 'Journal',
      title: 'Trade journal',
      tracks: 'every trade → setup, size, result, mistake tag',
      why: 'You can only fix what you log. Finance shows the score; this shows the pattern behind your losses — the single biggest lever on becoming profitable.',
      estWeight: 15,
    },
    {
      word: 'Discipline',
      title: 'Rules adherence',
      tracks: 'did you follow your risk rules today? yes / no',
      why: 'Blown accounts are almost never bad analysis — they are broken rules. One yes/no tile a day surfaces the leak.',
      estWeight: 8,
    },
  ],
  jacked: [
    {
      word: 'Water',
      title: 'Water',
      tracks: 'daily intake vs target',
      why: 'The cheapest input to muscle you are not tracking yet — recovery and pumps both live here.',
      estWeight: 8,
    },
    {
      word: 'Steps',
      title: 'Steps / NEAT',
      tracks: 'daily movement outside the gym',
      why: 'Body composition is won between workouts. Train sees the sessions; nothing sees the other 23 hours.',
      estWeight: 7,
    },
  ],
  knowledge: [
    {
      word: 'Learn',
      title: 'Learn',
      tracks: 'study sessions, topics, minutes per day',
      why: 'This goal has no home tile. Build it and the equation finally measures the thing you said you want — run /tile learn.',
      estWeight: 30,
    },
    {
      word: 'Reading',
      title: 'Reading log',
      tracks: 'books / articles finished, pages per week',
      why: 'A slower-burn companion to Learn: tracks depth over time, not just daily reps.',
      estWeight: 12,
    },
  ],
}

/** The mentor's tile recommendations for a goal (localStorage override wins). */
export function tileIdeas(goalId: string): TileIdea[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('vitality:ideas')
      if (raw) {
        const o = JSON.parse(raw)
        if (o && typeof o === 'object' && Array.isArray(o[goalId])) return o[goalId] as TileIdea[]
      }
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_IDEAS[goalId] ?? DEFAULT_IDEAS.overall ?? []
}

/** The mentor's noticed feed: localStorage override, else the seeded example.
 *  Claude Code (or the connector) writes 'vitality:noticed' after a scan. */
export function noticedFeed(): Notice[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('vitality:noticed')
      if (raw) {
        const o = JSON.parse(raw)
        if (Array.isArray(o)) return o as Notice[]
      }
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_NOTICED
}

/** Save the goals list (used by the mentor page's goal input). */
export function saveGoals(list: Goal[]): void {
  try {
    window.localStorage.setItem('vitality:goals', JSON.stringify(list))
  } catch {
    /* ignore */
  }
}

/** All goals: localStorage override ('vitality:goals') if valid, else defaults. */
export function goals(): Goal[] {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('vitality:goals')
      if (raw) {
        const o = JSON.parse(raw)
        if (Array.isArray(o) && o.every((g) => g && typeof g.id === 'string' && g.weights)) return o as Goal[]
      }
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_GOALS
}

/** The active goal id (persisted). Defaults to the first goal. */
export function activeGoalId(): string {
  if (typeof window !== 'undefined') {
    try {
      const v = window.localStorage.getItem('vitality:goal:active')
      if (v) return v
    } catch {
      /* fall through */
    }
  }
  return goals()[0]?.id ?? ''
}

export function setActiveGoalId(id: string): void {
  try {
    window.localStorage.setItem('vitality:goal:active', id)
  } catch {
    /* ignore */
  }
}

/** The active goal's weights (the badges on the row read these). */
export function tileWeights(): Record<string, number> {
  return activeGoal()?.weights ?? {}
}
