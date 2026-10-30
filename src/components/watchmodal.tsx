import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { openDownloadWithFreshToken, prefetchRebaEntry } from '../lib/rebaFresher';

interface Video {
  direct: boolean;
  downloadUrl: string;
  watchUrl: string;
  title: string;
  // rebamovie self-heal hints passed through to the worker token fresher.
  movieId?: string;
  season?: number;
  episode?: number;
}

interface WatchModalProps {
  onClose: () => void;
  videos: Video[];
  poster?: string;
  movieName?: string;
  trailerUrl?: string;
  option: 'watch' | 'download';
}

const WatchModal = ({ onClose, videos, poster, movieName, trailerUrl, option }: WatchModalProps) => {
  const [mode, setMode] = useState<'watch' | 'download'>(option);
  const [resolving, setResolving] = useState(false);
  const navigate = useNavigate();

  // Warm the first entry only, so the common "grab episode 1" tap is instant
  // without firing a call per row (which would trip rebamovie's rate limiter).
  // The rest warm on hover/focus via prefetchRebaEntry.
  useEffect(() => {
    if (videos[0]) prefetchRebaEntry(videos[0]);
  }, [videos]);

  // rebamovie/Wix links are signed and expire, so mint a fresh one via the
  // worker token fresher before handing it off. Watch mode is skipped here
  // because the /watch page re-mints on mount (covering reloads/shared links),
  // so doing it in both places would double the /downloadData calls.
  const handleVideoClick = async (video: Video) => {
    if (mode === 'watch') {
      const params = new URLSearchParams({
        url: video.watchUrl || '',
        dl: video.downloadUrl || '',
        backdrop: poster || '',
        name: movieName || '',
      });
      if (video.movieId) params.set('movieId', video.movieId);
      if (video.season != null) params.set('season', String(video.season));
      if (video.episode != null) params.set('episode', String(video.episode));
      navigate(`/watch?${params.toString()}`);
      return;
    }

    setResolving(true);
    try {
      await openDownloadWithFreshToken({
        title: video.title,
        watchUrl: video.watchUrl || '',
        downloadUrl: video.downloadUrl || '',
        direct: video.direct,
        movieId: video.movieId,
        season: video.season,
        episode: video.episode,
      });
    } catch {
      toast.error('Could not get a valid download link. Please try again.');
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="relative w-full max-w-4xl bg-gray-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row gap-6"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <FiX size={26} />
        </button>

        {/* Poster + Trailer */}
        {poster && (
          <div className="hidden md:flex flex-shrink-0 w-40 h-60 rounded-xl overflow-hidden border border-gray-700 shadow-inner">
            <img src={poster} alt="Movie Poster" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 flex flex-col gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold">{movieName || 'Watch Movie'}</h2>
            <p className="text-gray-400 text-sm mt-1">{videos.length} video{videos.length !== 1 && 's'} available</p>
          </div>

          {/* Trailer */}
          {trailerUrl && (
            <div className="w-full aspect-video rounded-xl overflow-hidden shadow-lg">
              <iframe
                src={trailerUrl}
                title="Movie Trailer"
                allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          )}

          {/* Mode Switch */}
          <div className="flex justify-center md:justify-start gap-3 mt-2">
            <button
              onClick={() => setMode('watch')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                mode === 'watch'
                  ? 'bg-green-500 text-black'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              Watch Full
            </button>
            <button
              onClick={() => setMode('download')}
              className={`px-5 py-2 rounded-full font-semibold text-sm transition ${
                mode === 'download'
                  ? 'bg-green-500 text-black'
                  : 'bg-gray-800 hover:bg-gray-700 text-white'
              }`}
            >
              Download
            </button>
          </div>

          {/* Video List */}
          <div className="mt-3 flex flex-wrap gap-3 overflow-y-auto max-h-60">
            {videos.map((video, idx) => (
              <div
                key={idx}
                data-ad={mode === 'watch' ? 'watch' : undefined}
                    onClick={() => !resolving && handleVideoClick(video)}
                onMouseEnter={() => prefetchRebaEntry(video)}
                onFocus={() => prefetchRebaEntry(video)}
                tabIndex={0}
                className={`flex justify-between items-center min-w-[150px] px-4 py-2 rounded-lg transition font-medium ${
                  resolving
                    ? 'bg-gray-800/50 text-gray-400 cursor-wait'
                    : 'bg-gray-800/70 hover:bg-green-600 hover:text-black cursor-pointer'
                }`}
              >
                <span className="truncate">{video.title}</span>
                <span className="text-xs flex items-center gap-1">
                  {resolving ? (
                    <span>Loading…</span>
                  ) : mode === 'watch' ? (
                    <>Play <FaPlay className="ml-1" /></>
                  ) : (
                    <>Download <FiDownload className="ml-1" /></>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default WatchModal;
