/**
 * Ad-free subscription helpers.
 *
 * FilmHome has no real login system, so every browser gets a stable, private
 * user id (stored in localStorage). The paid flow works like this:
 *   1. User picks a plan (Weekly 1000 RWF / Monthly 2000 RWF).
 *   2. User pays via MTN MoMo USSD  *182*8*1*1603518*<amount>#  (name: andrew).
 *   3. User taps the WhatsApp button (message prefilled with plan + user id)
 *      to 079 556 578 saying "I have finished paying".
 *   4. The admin reads the WhatsApp message, opens the SuperAdmin
 *      "Subscriptions" page, and confirms the user id as paid.
 *   5. The app then flags the browser ad-free (stops loading the Monetag tag).
 */

const WORKER_URL = String(import.meta.env.VITE_SUBSCRIPTION_WORKER_URL || '').replace(/\/+$/, '');
const USER_ID_KEY = 'fh_user_id';
const AD_FREE_KEY = 'fh_adfree';

export interface SubscriptionStatus {
  userId: string;
  plan: 'weekly' | 'monthly' | null;
  amount: number;
  status: 'never' | 'pending' | 'active';
  active: boolean;
  requestedAt: string | null;
  confirmedAt: string | null;
  expiresAt: string | null;
}

export const PLANS = {
  weekly: { amount: 1000, days: 7, label: 'Weekly', ussdAmount: '1000' },
  monthly: { amount: 2000, days: 30, label: 'Monthly', ussdAmount: '2000' },
} as const;

export type PlanKey = keyof typeof PLANS;

const WHATSAPP_NUMBER = '250795566578'; // 079 556 578
export const MOBILE_MONEY_NAME = 'andrew';

function makeId(): string {
  try {
    const rnd = crypto.getRandomValues(new Uint8Array(12));
    return Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  }
}

/** Stable per-browser user id the user includes on WhatsApp for confirmation. */
export function getUserId(): string {
  let id = localStorage.getItem(USER_ID_KEY);
  if (!id) {
    id = makeId();
    localStorage.setItem(USER_ID_KEY, id);
  }
  return id;
}

export const hasSubscriptionWorker = Boolean(WORKER_URL);

/** Public status check — drives the "ad-free" flag for this browser. */
export async function fetchSubscriptionStatus(userId = getUserId()): Promise<SubscriptionStatus | null> {
  if (!WORKER_URL) return null;
  try {
    const res = await fetch(`${WORKER_URL}/subscribe/status?userId=${encodeURIComponent(userId)}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as SubscriptionStatus;
  } catch {
    return null;
  }
}

/** Public — record a pending request so the admin sees intent quickly. */
export async function requestSubscription(plan: PlanKey, userId = getUserId()): Promise<boolean> {
  if (!WORKER_URL) return false;
  try {
    const res = await fetch(`${WORKER_URL}/subscribe/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, plan }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Syncs the ad-free flag with the real subscription state and applies it:
 * sets localStorage, and when the browser becomes ad-free it removes the
 * Monetag tag + unregisters its service worker.
 */
export async function applyAdFreeState(): Promise<SubscriptionStatus | null> {
  const status = await fetchSubscriptionStatus();
  const active = Boolean(status?.active);
  const wasActive = localStorage.getItem(AD_FREE_KEY) === '1';
  localStorage.setItem(AD_FREE_KEY, active ? '1' : '0');

  if (active && !wasActive) {
    try {
      document
        .querySelectorAll('script[src="https://quge5.com/88/tag.min.js"]')
        .forEach((el) => el.remove());
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) await reg.unregister();
    } catch {
      // best-effort; the header loader respects the flag on next load
    }
  }
  return status;
}

/** MoMo dial string: *182*8*1*1603518*<amount># */
export function ussdCode(plan: PlanKey): string {
  return `*182*8*1*1603518*${PLANS[plan].ussdAmount}#`;
}

/** tel: link that opens the dialer with the USSD code. */
export function dialLink(plan: PlanKey): string {
  return `tel:${encodeURIComponent(ussdCode(plan))}`;
}

/** Prefilled WhatsApp confirmation message including the user id. */
export function waLink(plan: PlanKey, userId = getUserId()): string {
  const msg = [
    `I have finished paying for the ${PLANS[plan].label} FilmHome ad-free plan.`,
    '',
    `Amount: ${PLANS[plan].amount} RWF`,
    `User ID: ${userId}`,
    `Name: ${MOBILE_MONEY_NAME}`,
    '',
    'Please confirm my subscription.',
  ].join('\n');
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/** e.g. "2026-09-25T..." -> "Sep 25, 2026". */
export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return String(iso);
  }
}

export type { SubscriptionStatus as SubscriptionStatusType };

export default { getUserId, fetchSubscriptionStatus, requestSubscription, applyAdFreeState, ussdCode, dialLink, waLink, formatDate, PLANS };