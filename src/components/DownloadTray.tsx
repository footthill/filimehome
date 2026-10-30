import { useDownloads } from '../lib/nativeDownload';

const DownloadTray = () => {
  const items = useDownloads((s) => s.items);
  if (!items.length) return null;
  return (
    <div className="fixed left-2 right-2 bottom-16 md:bottom-4 md:left-auto md:w-80 z-[60] space-y-2">
      {items.map((i) => (
        <div key={i.id} className="bg-[#1e1e1e] border border-gray-700 rounded-lg p-3 text-white shadow-xl">
          <div className="flex justify-between text-sm mb-1">
            <span className="truncate pr-2">{i.title}</span>
            <span className="text-gray-400">{i.status === 'error' ? 'Failed' : i.status === 'done' ? 'Done' : `${i.pct}%`}</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded">
            <div className={`h-full rounded ${i.status === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${i.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
};
export default DownloadTray;
