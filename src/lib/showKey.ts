/**
 * Show-level identity for home rows.
 *
 * The catalogue stores one row per season/episode ("Outer Banks Season 01",
 * "Outer Banks S05", ...). Those are separate rows with their own score, so a
 * score-sorted row would show the same show five times and crowd out everything
 * else. This collapses those variants back to a single show key.
 *
 * MUST stay identical to coreTitle() in
 * moviescraper/scrapers/agasobanuyenow/keys.js — the hot-signal scorer groups
 * and attributes boosts with that function, so any drift here would let a boost
 * land on a row this dedupe then throws away. Keep the two in sync.
 */
const coreTitle = (raw = ''): string =>
  String(raw)
    .toLowerCase()
    .replace(/\b(?:19|20)\d{2}\b/g, ' ')
    .replace(/\bs\d{1,2}(?:\s*e\d{1,2})?\b/g, ' ')
    .replace(/\b(?:season|saizonya|saison)\s*\d+\b/g, ' ')
    .replace(/\b(?:episode|igice|ep)\s*\d+\b/g, ' ')
    .replace(/\b(?:part|pt\.?|igice|gbice)\s*(?:one|two|three|four|five|[a-z]|\d+)\b/g, ' ')
    .replace(/\b(?:final|full movie|full)\b/g, ' ')
    .replace(/\s*[([](?:[^)\]]*)[)\]]\s*$/, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** Stable key for "which show is this row part of". Empty when unusable. */
export const showKey = (title = ''): string => coreTitle(String(title || ''));

/**
 * Keep only the first row per show. Callers MUST pass rows already sorted by
 * descending score, so the row we keep is the best-scoring one — normally the
 * newest season, though not always: a season with no tmdb_rating/popularity
 * scores lower than its predecessor. The hot-signal scorer mirrors this exact
 * choice, so a boost is never applied to a row this drops.
 */
export const dedupeByShow = <T extends { title?: string | null }>(rows: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    const key = showKey(row.title ?? '');
    if (key) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(row);
  }
  return out;
};
