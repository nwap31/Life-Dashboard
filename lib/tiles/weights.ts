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
    title: 'Be a profitable MNQ trader — rules first',
    accent: '#C17A54', // terracotta
    // The main goal. MNQ futures on an FVG + OTE model; the edge is discipline,
    // so the north star is DAYS FOLLOWING THE RULES — now measured by the Rules
    // tile (the 'peak' slot, repurposed). Rules leads; Finance is the account
    // scoreboard; Vitals is the mental game; Fuel/Train keep the machine steady.
    weights: { peak: 45, finance: 25, vitals: 20, fuel: 6, train: 4 },
  },
  {
    id: 'jacked',
    title: 'Get jacked',
    accent: '#8A9A5B', // sage / olive
    weights: { train: 45, fuel: 33, vitals: 22 },
  },
  {
    id: 'knowledge',
    title: 'Become a credit analyst — markets, fixed income, and myself',
    accent: '#A9713C', // ochre / sienna
    // Measured by the Learn tile (the 'brand' slot, repurposed): three tracks —
    // self-improvement, markets, fixed income. Learn is the direct driver;
    // Vitals/Fuel protect the retention and focus behind it.
    weights: { brand: 60, vitals: 22, fuel: 18 },
  },
]

/** The overseer's synthesis of EVERY goal, polished into one sentence by the
 *  mentor (Claude Code). Switching it on = top priority — the board goes gold. */
export const OVERALL_GOAL: Goal = {
  id: 'overall',
  title: 'Trade by the rules, build toward credit analyst, get jacked',
  accent: '#CBA35C', // warm earthy gold
  weights: { peak: 20, finance: 22, vitals: 16, brand: 16, train: 14, fuel: 12 },
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
    id: 'n-rules-built',
    when: 'just now',
    text: 'Your north star has a home now, Nolan. The Peak tile you never used is a Rules tile: one tap a day — clean or broke — with a streak you will not want to kill and a 30-day adherence %. And I made it the main event: your trader goal now leans on Rules more than on P&L, because discipline is the thing that actually produces the P&L.',
    points: [
      'Built **Rules** in the old Peak slot — clean streak + 30-day adherence',
      'Trader goal now leans on **Rules (45%)** over Finance (25%) — discipline first',
      'Learn (knowledge) + earthy palette already in; Garmin scaffolded on Vitals',
      'Next in the queue: **Train → your split**, **Fuel calories**, **Trade journal**',
    ],
    deltas: [
      { tile: 'peak', from: 10, to: 45 },
      { tile: 'finance', from: 55, to: 25 },
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
      word: 'Journal',
      title: 'Trade journal',
      tracks: 'each MNQ trade — FVG/OTE setup, result, mistake tag',
      why: 'Rules is the daily yes/no; this is the why. Log every trade and the review loop behind your losses becomes your edge.',
      estWeight: 12,
    },
    {
      word: 'Sleep',
      title: 'Sleep consistency',
      tracks: 'bedtime + wake, night by night',
      why: 'Discipline and focus both erode on bad sleep. Vitals sees recovery; this would see the habit that drives it.',
      estWeight: 6,
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
      word: 'Prep',
      title: 'Pre-market prep',
      tracks: 'did you mark your levels + bias before the open? yes / no',
      why: 'Clean days start before the bell. Rules scores the session; this scores the preparation that makes following them possible.',
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
      word: 'Reading',
      title: 'Reading log',
      tracks: 'books / articles finished, pages per week',
      why: 'A slower-burn companion to Learn: tracks depth over time, not just daily reps. Stack the credit + fixed-income books here.',
      estWeight: 12,
    },
    {
      word: 'Credit',
      title: 'Credit reps',
      tracks: 'company teardowns / credit cases worked, per week',
      why: 'The analyst road is built on reps. Learn tracks the hours; this tracks the actual work — real names, real spreads, real writeups.',
      estWeight: 10,
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
