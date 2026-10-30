/**
 * MONETAG AD CONTROLLER — edit AD_RULES below to control when ads appear.
 *
 * Why this exists: the Monetag tag hooks taps on the whole page and opens ad popups whenever IT
 * decides. On mobile that means ads during playback, on the sign-up page, in Chrome, etc.
 * Now the tag may only open an ad when WE open a short "ad window", and we only open it:
 *   - on a deliberate action (tapping a video to watch: elements marked data-ad="watch"),
 *   - never on blocked pages, never for ad-free subscribers,
 *   - never in the first seconds of a launch or the user's first few actions,
 *   - with a cooldown + per-session + per-day cap.
 * Every other popup the tag tries is silently dropped. The app's own links are unaffected.
 *
 * Optional: set VITE_ADS_CONFIG_URL to a JSON file (partial is fine) to change these rules or
 * kill ads remotely without shipping a new APK.
 */
import { isNative, openExternal } from '../lib/native';

export const AD_RULES = {
  enabled: true, //                master kill switch
  tag: { src: 'https://quge5.com/88/tag.min.js', zone: '286513', serviceWorker: true },
  graceMs: 45_000, //              no ads in the first 45s after launch
  blockedRoutes: ['/watch', '/register', '/subscription', '/appcoming'],
  moments: { watch: true } as Record<string, boolean>, // which actions may trigger an ad
  skipFirstActions: 2, //          user's first 2 watch taps are ad-free
  minIntervalMs: 4 * 60_000, //    at least 4 minutes between ads
  maxPerSession: 3, //             per app launch / page load
  maxPerDay: 8,
  grantWindowMs: 2_000, //         how long after the tap an ad popup is tolerated
};

type Rules = typeof AD_RULES;
let rules: Rules = AD_RULES;
const REMOTE = String(import.meta.env.VITE_ADS_CONFIG_URL || '');
const merge = (a: any, b: any): any => {
  if (!b || typeof b !== 'object') return a;
  const o = { ...a };
  for (const k of Object.keys(b)) o[k] = a?.[k] && typeof a[k] === 'object' && !Array.isArray(a[k]) ? merge(a[k], b[k]) : b[k];
  return o;
};

const startedAt = Date.now();
const LS = 'mf_ads_v2';
interface Persist { day: string; today: number; actions: number }
const dayKey = () => new Date().toISOString().slice(0, 10);
const loadP = (): Persist => {
  try {
    const p = JSON.parse(localStorage.getItem(LS) || '');
    return p.day === dayKey() ? p : { ...p, day: dayKey(), today: 0 };
  } catch { return { day: dayKey(), today: 0, actions: 0 }; }
};
let persist = loadP();
const saveP = () => { try { localStorage.setItem(LS, JSON.stringify(persist)); } catch { /* ignore */ } };

let sessionShown = 0;
let lastAt = 0;
let allowUntil = 0;
let bypass = 0;
let tagLoaded = false;

const rawOpen = window.open.bind(window); // captured BEFORE we patch it

const isAdFree = () => { try { return localStorage.getItem('fh_adfree') === '1'; } catch { return false; } };
const routeBlocked = () => rules.blockedRoutes.some((r) => window.location.pathname.startsWith(r));

function adsDue(moment: string): boolean {
  if (!rules.enabled || isAdFree() || !rules.moments[moment]) return false;
  if (routeBlocked()) return false;
  if (Date.now() - startedAt < rules.graceMs) return false;
  if (persist.actions <= rules.skipFirstActions) return false;
  if (sessionShown >= rules.maxPerSession || persist.today >= rules.maxPerDay) return false;
  if (Date.now() - lastAt < rules.minIntervalMs) return false;
  return true;
}

/** Spend the open ad window (if any) on one ad. */
function takeGrant(): boolean {
  if (Date.now() > allowUntil) return false;
  allowUntil = 0;
  sessionShown += 1;
  lastAt = Date.now();
  persist = { ...persist, today: persist.today + 1 };
  saveP();
  return true;
}

/** The app's OWN window.open — never blocked by the ad guard, stays in-app on the APK. */
export function appOpen(url?: string, target?: string, features?: string): Window | null {
  if (isNative) {
    if (url) void openExternal(url);
    return null;
  }
  bypass += 1;
  try { return rawOpen(url, target, features); } finally { bypass -= 1; }
}

function loadTag() {
  if (tagLoaded || !rules.enabled || isAdFree() || routeBlocked()) return;
  if (Date.now() - startedAt < rules.graceMs) return;
  tagLoaded = true;
  const s = document.createElement('script');
  s.src = rules.tag.src; // same URL as before so subscription.applyAdFreeState can still remove it
  s.async = true;
  s.setAttribute('data-zone', rules.tag.zone);
  s.setAttribute('data-cfasync', 'false');
  document.head.appendChild(s);
  if (!isNative && rules.tag.serviceWorker && 'serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  }
}

export function initAds() {
  if (REMOTE) fetch(REMOTE, { cache: 'no-store' }).then((r) => r.json()).then((j) => { rules = merge(AD_RULES, j); }).catch(() => undefined);

  // 1. A tap on a data-ad element is the only thing that can open an ad window.
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = (e.target as Element | null)?.closest?.('[data-ad]');
      if (!el) return;
      persist = { ...persist, actions: persist.actions + 1 };
      saveP();
      if (adsDue(el.getAttribute('data-ad') || '')) allowUntil = Date.now() + rules.grantWindowMs;
    },
    true
  );

  // 2. Popups from scripts: only allowed inside an ad window.
  window.open = ((url?: string | URL, target?: string, features?: string) => {
    if (bypass > 0) return rawOpen(url as string, target, features);
    if (!takeGrant()) return null;
    if (isNative) { if (url) void openExternal(String(url)); return null; }
    return rawOpen(url as string, target, features);
  }) as typeof window.open;

  // 3. Same for ad scripts that fake a click on a hidden external <a>.
  const rawClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    let external = false;
    try { external = new URL(this.href, location.href).origin !== location.origin && /^https?:/i.test(this.href); } catch { /* internal */ }
    if (bypass > 0 || !external) return rawClick.call(this);
    if (!takeGrant()) return;
    if (isNative) { void openExternal(this.href); return; }
    return rawClick.call(this);
  };

  // 4. Load the tag only when it is allowed to be useful.
  const t = setInterval(() => { loadTag(); if (tagLoaded) clearInterval(t); }, 2000);
}
