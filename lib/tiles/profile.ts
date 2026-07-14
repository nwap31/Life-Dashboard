/**
 * Your body, on file — the personal inputs the mentor ASKS for.
 *
 * The mentor (Claude Code) interviews you — height, weight, age, units — the
 * first time a goal or tile needs body math (peak pharmacokinetics scale by
 * bodyweight; fuel targets scale by all of it). It writes the answers here,
 * you reload. Never guessed, never required up front: every field is optional
 * and the math degrades gracefully to sensible defaults.
 *
 * Two write paths, same as goals/weights:
 *   · this file (DEFAULT_PROFILE) — the mentor edits it in VS Code
 *   · localStorage 'vitality:profile' — the connector or a UI can retune
 *     without a code change; it wins over the defaults
 *
 * Ask in their units, store metric. lib knows only cm/kg.
 */

export interface Profile {
  /** First name, for the greeting. */
  name?: string
  heightCm?: number
  weightKg?: number
  age?: number
  sex?: 'male' | 'female'
  /** How to TALK to them about it — storage stays metric. */
  units?: 'metric' | 'imperial'
  /** Daily calorie target the mentor set from body stats + bulk/cut/maintain
   *  choice. Feeds the Fuel tile's calorie section once it's built. */
  kcalTarget?: number
}

/** Blank until the mentor asks. Fallbacks live at the call sites. */
export const DEFAULT_PROFILE: Profile = {
  name: 'Nolan',
  age: 20,
  sex: 'male',
  heightCm: 175, // 5'9"
  weightKg: 79.4, // 175 lb morning weight
  units: 'imperial',
  kcalTarget: 2700, // maintain — ~TDEE at 5'9", 175 lb, 20, training
}

/** The profile: localStorage override ('vitality:profile') if valid, else defaults. */
export function profile(): Profile {
  if (typeof window !== 'undefined') {
    try {
      const raw = window.localStorage.getItem('vitality:profile')
      if (raw) {
        const o = JSON.parse(raw)
        if (o && typeof o === 'object' && !Array.isArray(o)) return o as Profile
      }
    } catch {
      /* fall through */
    }
  }
  return DEFAULT_PROFILE
}

export function saveProfile(p: Profile): void {
  try {
    window.localStorage.setItem('vitality:profile', JSON.stringify(p))
  } catch {
    /* ignore */
  }
}

/** Bodyweight for tile math (peak PK etc.) — 75 kg until they've been asked. */
export function bodyWeightKg(): number {
  return profile().weightKg ?? 75
}
