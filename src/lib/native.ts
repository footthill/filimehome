import { Capacitor } from '@capacitor/core';

/** True only inside the installed APK — false on the website. */
export const isNative = Capacitor.isNativePlatform();

/** Open an external page inside the app (in-app browser tab) instead of leaving to Chrome. */
export async function openExternal(url: string): Promise<void> {
  if (!url) return;
  if (!isNative) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  const { Browser } = await import('@capacitor/browser');
  await Browser.open({ url, presentationStyle: 'popover', toolbarColor: '#000000' });
}

const isInternal = (href: string) => {
  try {
    const u = new URL(href, window.location.href);
    return u.origin === window.location.origin || !/^https?:$/.test(u.protocol);
  } catch {
    return true;
  }
};

/** Call once at startup. No-op on the website. */
export async function initNative(): Promise<void> {
  if (!isNative) return;
  document.documentElement.classList.add('native-app');

  const [{ StatusBar, Style }, { SplashScreen }, { App }] = await Promise.all([
    import('@capacitor/status-bar'),
    import('@capacitor/splash-screen'),
    import('@capacitor/app'),
  ]);
  try {
    await StatusBar.setOverlaysWebView({ overlay: false });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#000000' });
  } catch { /* not fatal */ }
  setTimeout(() => SplashScreen.hide().catch(() => undefined), 300);

  // Back button: go back in-app, exit only from Home.
  App.addListener('backButton', () => {
    const p = window.location.pathname;
    if (p !== '/' && window.history.length > 1) window.history.back();
    else if (p !== '/') window.location.assign('/');
    else App.exitApp();
  });

  // Real taps on external links (share, WhatsApp, footer...) stay in the app.
  // Scripted clicks (ad scripts) are NOT handled here — the ad controller decides those.
  document.addEventListener(
    'click',
    (e) => {
      if (!e.isTrusted) return;
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || isInternal(a.href) || /^(tel|mailto|sms):/i.test(a.href)) return;
      e.preventDefault();
      void openExternal(a.href);
    },
    true
  );
}

/** Landscape while watching, portrait otherwise. No-op on the web. */
export async function setLandscape(on: boolean): Promise<void> {
  if (!isNative) return;
  try {
    const { ScreenOrientation } = await import('@capacitor/screen-orientation');
    await ScreenOrientation.lock({ orientation: on ? 'landscape' : 'portrait' });
  } catch { /* ignore */ }
}
