/**
 * rebamovie "token fresher" (frontend side).
 *
 * rebamovie/Wix download URLs are signed and expire (~24h). The DB stores the
 * stable watch/manifest URL, and this helper mints a FRESH signed MP4 on demand
 * by calling the public worker endpoint `POST /reba/resolve`, which AES-wraps and
 * proxies rebamovie /downloadData with GUID verification.
 *
 * Two guarantees this file exists to provide:
 *
 *  1. NEVER navigate to a known-expired signed URL. The Wix `?token=` is a JWT,
 *     so we decode its `exp` claim and know whether a link is stale instead of
 *     guessing. A stored link is only used as a last resort, and only after we
 *     have genuinely tried (and retried) to refresh it.
 *
 *  2. NEVER trip the popup blocker. A fresh URL only exists after an await, and
 *     browsers only honour appOpen() synchronously inside a user gesture —
 *     iOS Safari blocks the post-await call outright, so the download would fail
 *     silently. We reserve a blank tab inside the click, then navigate it.
 */

import { isNative } from './native';
import { downloadInApp } from './nativeDownload';
import { appOpen } from '../ads/adControl';

const WORKER_URL = String(import.meta.env.VITE_SUBSCRIPTION_WORKER_URL || '').replace(/\/+$/, '');

// Hosts served by rebamovie/Wix whose links are signed and expire.
const REBA_HOST_RE = /(?:cdn-video\.rebamovie\.com|download-video\.wixmp\.com|repackager\.wixmp\.com|video\.wixstatic\.com)/i;

export const hasRebaFresher = Boolean(WORKER_URL);

/** True when this entry's watch URL is a signed rebamovie/Wix link. */
export function isRebaLink(url = ''): boolean {
  return REBA_HOST_RE.test(String(url || ''));
}

/** Treat a link with under this much token life left as already expired. */
const EXPIRY_SLACK_MS = 30_000;

/**
 * Read the `exp` claim (ms epoch) out of a Wix `?token=` JWT.
 * Returns 0 when there is no token or it can't be decoded.
 */
export function tokenExpiryMs(url = ''): number {
  const m = /[?&]token=([^&]+)/.exec(String(url || ''));
  if (!m) return 0;
  const part = decodeURIComponent(m[1]).split('.')[1];
  if (!part) return 0;
  try {
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const exp = (JSON.parse(json) as { exp?: unknown }).exp;
    return typeof exp === 'number' ? exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/**
 * True when this is a signed rebamovie link whose token is expired (or nearly).
 * Non-reba links are never "stale" — they don't expire. When the token can't be
 * decoded we return false, so an unparseable token never blocks a download.
 */
export function isStaleSignedUrl(url = ''): boolean {
  if (!isRebaLink(url)) return false;
  const exp = tokenExpiryMs(url);
  if (!exp) return false;
  return exp <= Date.now() + EXPIRY_SLACK_MS;
}

/** True when this link is signed by Wix and still has usable life left. */
export function isFreshSignedUrl(url = ''): boolean {
  return isRebaLink(url) && !isStaleSignedUrl(url) && tokenExpiryMs(url) > 0;
}

export interface FreshenedEntry {
  title: string;
  watchUrl: string;
  downloadUrl: string;
  direct: boolean;
  /** rebamovie catalog item id (last segment of the row's `link`) — for self-heal. */
  movieId?: string;
  /** Optional episode locator, used when the media GUID can't be matched. */
  season?: number;
  episode?: number;
}

/** Result of a refresh attempt, so callers can tell a real refresh from a no-op. */
export interface FreshenResult {
  downloadUrl: string;
  /** True only when a genuinely non-expired signed URL came back. */
  verified: boolean;
  error?: string;
}

/**
 * Ask the worker for a fresh signed MP4.
 *
 * `requireFresh` makes this strict: a returned URL that is missing or already
 * expired is treated as a FAILURE rather than handed back, so the caller can
 * retry instead of silently downgrading to a dead link.
 */
export async function resolveFreshUrl(
  entry: FreshenedEntry,
  { requireFresh = true, timeoutMs = 12_000 }: { requireFresh?: boolean; timeoutMs?: number } = {}
): Promise<FreshenResult> {
  const source = entry?.watchUrl || entry?.downloadUrl || '';
  if (!WORKER_URL) return { downloadUrl: entry?.downloadUrl || '', verified: false, error: 'no worker' };
  if (!isRebaLink(source)) {
    // Not a signed link — nothing to refresh, and nothing that can expire.
    return { downloadUrl: entry?.downloadUrl || '', verified: true };
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetch(`${WORKER_URL}/reba/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: source,
        name: entry.title || '',
        movieId: entry.movieId || '',
        season: entry.season,
        episode: entry.episode,
      }),
      signal: ctl.signal,
    });
    if (!res.ok) return { downloadUrl: entry?.downloadUrl || '', verified: false, error: `HTTP ${res.status}` };
    const data = (await res.json()) as { downloadUrl?: string };
    const url = data?.downloadUrl || '';
    if (!url) return { downloadUrl: entry?.downloadUrl || '', verified: false, error: 'empty' };
    if (requireFresh && isStaleSignedUrl(url)) {
      return { downloadUrl: entry?.downloadUrl || '', verified: false, error: 'worker returned expired token' };
    }
    return { downloadUrl: url, verified: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { downloadUrl: entry?.downloadUrl || '', verified: false, error: msg };
  } finally {
    clearTimeout(timer);
  }
}

/** Memoised prefetch cache: source URL -> verified fresh download URL. */
const freshCache = new Map<string, string>();
/** Keys currently being prefetched, so hover spam can't stack duplicate calls. */
const inFlight = new Set<string>();

function cacheKey(entry: FreshenedEntry): string {
  return entry?.watchUrl || entry?.downloadUrl || entry?.title || '';
}

/**
 * Warm the cache for a link ahead of the click (call on hover/focus), so the
 * first tap opens an already-valid URL with zero waiting. Deliberately NOT done
 * for a whole list in one go — a 30-episode show would fire 30 parallel
 * /downloadData calls and trip rebamovie's rate limiter.
 */
export async function prefetchRebaEntry(entry: FreshenedEntry): Promise<void> {
  const source = entry?.watchUrl || entry?.downloadUrl || '';
  if (!WORKER_URL || !isRebaLink(source)) return;
  const key = cacheKey(entry);
  const hit = freshCache.get(key);
  if (hit && !isStaleSignedUrl(hit)) return;
  if (inFlight.has(key)) return;
  inFlight.add(key);
  try {
    const r = await resolveFreshUrl(entry);
    if (r.verified && r.downloadUrl) freshCache.set(key, r.downloadUrl);
  } finally {
    inFlight.delete(key);
  }
}

export async function prefetchRebaEntries(entries: FreshenedEntry[]): Promise<void> {
  if (!WORKER_URL || !Array.isArray(entries) || !entries.length) return;
  await Promise.all(entries.map((e) => prefetchRebaEntry(e).catch(() => undefined)));
}

/** Back-compat wrapper: returns the entry with the best URL we can get. */
export async function freshenRebaEntry(entry: FreshenedEntry): Promise<FreshenedEntry> {
  const source = entry?.watchUrl || entry?.downloadUrl || '';
  if (!WORKER_URL || !isRebaLink(source)) return entry;

  const hit = freshCache.get(cacheKey(entry));
  if (hit && !isStaleSignedUrl(hit)) return { ...entry, downloadUrl: hit };

  const r = await resolveFreshUrl(entry, { requireFresh: false });
  if (r.verified && r.downloadUrl) freshCache.set(cacheKey(entry), r.downloadUrl);
  return { ...entry, downloadUrl: r.downloadUrl || entry.downloadUrl };
}

/** freshenRebaEntry over a list, preserving order. */
export async function freshenRebaEntries(entries: FreshenedEntry[]): Promise<FreshenedEntry[]> {
  if (!Array.isArray(entries) || !entries.length) return entries;
  return Promise.all(entries.map((e) => freshenRebaEntry(e)));
}

/* ------------------- popup-blocker-safe download handoff ------------------- */

/** MUST be called synchronously from a click handler. Returns null if blocked. */
export function reserveTab(): Window | null {
  try {
    const tab = appOpen('', '_blank');
    // We navigate this to a third-party host, so drop the back-reference first
    // (reverse tabnabbing) while we still hold the handle.
    if (tab) tab.opener = null;
    return tab;
  } catch {
    return null;
  }
}

/**
 * Hand a resolved href to a reserved tab. If the popup was blocked (null) or
 * the tab died, fall back to same-tab navigation — which is never blocked — so
 * the download always starts instead of failing silently.
 */
export function deliverToTab(tab: Window | null, href: string): void {
  if (href && tab && !tab.closed) {
    tab.location.href = href;
    // When the server answers with Content-Disposition the browser starts the
    // download WITHOUT leaving about:blank, so the reserved tab would sit there
    // empty forever. Close it in that case; leave it open if it really navigated.
    closeIfStillBlank(tab);
    return;
  }
  if (href) {
    window.location.assign(href);
    return;
  }
  // Nothing to download: don't leave a stray blank tab behind.
  if (tab && !tab.closed) tab.close();
}

/** Close a reserved tab that never actually navigated (download started instead). */
function closeIfStillBlank(tab: Window | null, delayMs = 1200): void {
  if (!tab) return;
  setTimeout(() => {
    try {
      if (tab.closed) return;
      // Still on about:blank => the download was handed off and the tab is dead
      // weight. Cross-origin access throws, which means it DID navigate.
      if (!tab.location.href || tab.location.href === 'about:blank') tab.close();
    } catch {
      // navigated cross-origin — the tab is showing the media, leave it alone
    }
  }, delayMs);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Open a download, guaranteeing we land on a VALID link.
 *
 * Order of preference:
 *   1. cached, non-expired URL from a prefetch  -> instant, already verified
 *   2. live resolve, retried up to 2x            -> verified non-expired
 *   3. the stored URL, only if it isn't known-expired
 *
 * The tab is reserved synchronously so the popup blocker can't interfere while
 * we wait, and the user's tab is never left on a link we know is dead while a
 * refresh is still possible.
 */
export async function openDownloadWithFreshToken(entry: FreshenedEntry): Promise<void> {
  const source = entry?.watchUrl || entry?.downloadUrl || '';
  const stored = entry?.downloadUrl || '';

  // APK: download INSIDE the app (progress tray, saved to Documents/MihetoFilms). No Chrome.
  if (isNative) {
    let url = stored;
    if (WORKER_URL && isRebaLink(source)) {
      const cached = freshCache.get(cacheKey(entry));
      if (cached && !isStaleSignedUrl(cached)) url = cached;
      else {
        const r = await resolveFreshUrl(entry, { requireFresh: true });
        if (!r.verified || !r.downloadUrl) throw new Error(r.error || 'could not mint a valid download link');
        freshCache.set(cacheKey(entry), r.downloadUrl);
        url = r.downloadUrl;
      }
    }
    if (!url) throw new Error('no url');
    await downloadInApp(url, entry.title);
    return;
  }

  // Not a signed link (or no worker configured): nothing to verify or refresh.
  if (!WORKER_URL || !isRebaLink(source)) {
    if (stored) appOpen(stored, '_blank', 'noopener');
    return;
  }

  // FAST PATH — the prefetch already verified a live URL, so open it right now,
  // synchronously, while the user gesture is still active. No blank tab, no
  // await, no popup-blocker exposure.
  const cached = freshCache.get(cacheKey(entry));
  if (cached && !isStaleSignedUrl(cached)) {
    appOpen(cached, '_blank', 'noopener');
    return;
  }

  // SLOW PATH — cache miss. Reserve the tab inside the click so the popup
  // blocker can't interfere while we wait, then navigate it (or close it again
  // if the download starts without navigating).
  const tab = reserveTab();

  // Resolve live, retrying: the first attempt can hit a rebamovie cooldown.
  let attempts = 0;
  while (attempts < 2) {
    attempts++;
    const r = await resolveFreshUrl(entry, { requireFresh: true });
    if (r.verified && r.downloadUrl) {
      freshCache.set(cacheKey(entry), r.downloadUrl);
      deliverToTab(tab, r.downloadUrl);
      return;
    }
    if (attempts < 2) await sleep(600);
  }

  // Last resort — but never a link we KNOW is expired. A non-reba/unknown
  // token is allowed through; a dead signed link is reported instead.
  if (stored && !isStaleSignedUrl(stored)) {
    deliverToTab(tab, stored);
    return;
  }
  deliverToTab(tab, '');
  throw new Error('no valid link: stored token is expired and refresh failed');
}

export default {
  isRebaLink,
  isStaleSignedUrl,
  isFreshSignedUrl,
  tokenExpiryMs,
  freshenRebaEntry,
  freshenRebaEntries,
  resolveFreshUrl,
  prefetchRebaEntry,
  prefetchRebaEntries,
  openDownloadWithFreshToken,
  reserveTab,
  deliverToTab,
  hasRebaFresher,
};
