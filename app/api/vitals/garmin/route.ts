/**
 * Garmin wellness lookup — server-side so the Garmin credentials NEVER reach the
 * browser (same shape as /api/youtube/subs and /api/finance/quote). A sealed tile
 * can't fetch, so the Vitals tile calls this through the host bridge
 * (window.Vitality.garmin).
 *
 * SCAFFOLD — dormant until Garmin access is wired. Unlike Finnhub/YouTube, Garmin
 * is NOT a paste-a-key API: its Health/Connect API is a developer-program OAuth
 * integration (apply → approve → OAuth token). So this route reads a bearer token
 * + a summary URL from the environment and returns { error: 'no_creds' } until both
 * are set. The moment they are, it fetches your latest daily wellness summary and
 * normalizes it to the exact fields the Vitals tile stores.
 *
 * Set when your Garmin developer access lands (.env.local + Vercel env):
 *   GARMIN_ACCESS_TOKEN  — the OAuth access token for your Garmin user
 *   GARMIN_SUMMARY_URL   — the wellness/dailies endpoint returning today's summary
 *
 * Returns, normalized: { recovery?, sleepHours?, hrv?, restingHr? }
 *   recovery  → maps to the tile's `whoopRecovery` (a device number wins over the
 *               manual sleep/feel inputs, and reshapes the Peak curve too)
 *   sleepHours, hrv, restingHr → extra signal the tile can surface.
 */

/** Pull the first finite number found across a list of candidate field names. */
function pick(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj?.[k]
    const n = typeof v === 'string' ? Number(v) : (v as number)
    if (typeof n === 'number' && Number.isFinite(n)) return n
  }
  return undefined
}

export async function GET(): Promise<Response> {
  const token = process.env.GARMIN_ACCESS_TOKEN
  const url = process.env.GARMIN_SUMMARY_URL
  if (!token || !url) return Response.json({ error: 'no_creds' })

  try {
    const r = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!r.ok) return Response.json({ error: 'garmin_' + r.status })

    const j = await r.json()
    // Garmin returns an array of daily summaries or a single object depending on
    // the endpoint; take the most recent object either way.
    const s: Record<string, unknown> = Array.isArray(j) ? j[j.length - 1] || {} : j || {}

    // Normalize across the field-name variants Garmin uses. Body Battery is the
    // closest single "recovery" analogue; finalize this mapping when the real
    // endpoint's payload is confirmed.
    const recovery = pick(s, ['recovery', 'bodyBatteryHigh', 'bodyBattery', 'trainingReadiness'])
    const hrv = pick(s, ['hrv', 'avgOvernightHrv', 'lastNightAvg', 'hrvWeeklyAverage'])
    const restingHr = pick(s, ['restingHr', 'restingHeartRate', 'restingHeartRateInBeatsPerMinute'])
    const sleepSeconds = pick(s, ['sleepTimeSeconds', 'sleepDurationInSeconds', 'totalSleepSeconds'])
    const sleepHours =
      sleepSeconds != null ? Math.round((sleepSeconds / 3600) * 10) / 10 : pick(s, ['sleepHours'])

    const out: Record<string, number> = {}
    if (recovery != null) out.recovery = Math.max(1, Math.min(99, Math.round(recovery)))
    if (sleepHours != null) out.sleepHours = sleepHours
    if (hrv != null) out.hrv = Math.round(hrv)
    if (restingHr != null) out.restingHr = Math.round(restingHr)

    if (!Object.keys(out).length) return Response.json({ error: 'no_data' })
    return Response.json(out)
  } catch {
    return Response.json({ error: 'fetch_failed' })
  }
}
