import { create } from 'zustand';
import toast from 'react-hot-toast';
import { openExternal } from './native';

export interface DlItem { id: string; title: string; pct: number; status: 'downloading' | 'done' | 'error'; }
export const useDownloads = create<{ items: DlItem[]; set: (id: string, p: Partial<DlItem>, init?: DlItem) => void; remove: (id: string) => void }>((s) => ({
  items: [],
  set: (id, p, init) =>
    s((st) => ({
      items: st.items.some((i) => i.id === id)
        ? st.items.map((i) => (i.id === id ? { ...i, ...p } : i))
        : init ? [...st.items, init] : st.items,
    })),
  remove: (id) => s((st) => ({ items: st.items.filter((i) => i.id !== id) })),
}));

const safeName = (t: string) => (t || 'movie').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'movie';

/** Download a file inside the app (saved in Documents/MihetoFilms) with live progress. */
export async function downloadInApp(url: string, title: string): Promise<void> {
  // Pages like Mediafire are HTML, not files — show them in the in-app browser instead.
  if (/mediafire\.com\//i.test(url)) return openExternal(url);

  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const id = `${Date.now()}`;
  const path = `MihetoFilms/${safeName(title)}_${id.slice(-5)}.mp4`;
  const { set, remove } = useDownloads.getState();
  set(id, {}, { id, title, pct: 0, status: 'downloading' });

  const handle = await Filesystem.addListener('progress', (p) => {
    if (p.url === url && p.contentLength > 0) set(id, { pct: Math.min(99, Math.round((p.bytes / p.contentLength) * 100)) });
  });
  try {
    await Filesystem.downloadFile({ url, path, directory: Directory.Documents, recursive: true, progress: true });
    set(id, { pct: 100, status: 'done' });
    toast.success('Saved in Documents/MihetoFilms');
    setTimeout(() => remove(id), 4000);
  } catch {
    set(id, { status: 'error' });
    toast.error('Download failed. Opening the link instead.');
    setTimeout(() => remove(id), 2500);
    await openExternal(url);
  } finally {
    handle.remove();
  }
}
