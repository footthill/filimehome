import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import { FaPlay } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';

interface Video {
  direct: boolean;
  downloadUrl: string;
  watchUrl: string;
  title: string;
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
  const navigate = useNavigate();

  const handleVideoClick = (video: Video) => {
    if (mode === 'watch') {
      navigate(`/watch?url=${encodeURIComponent(video.watchUrl)}&backdrop=${poster}&name=${movieName}`);
    } else {
      window.open(video.downloadUrl, '_blank');
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
                onClick={() => handleVideoClick(video)}
                className="flex justify-between items-center cursor-pointer min-w-[150px] px-4 py-2 bg-gray-800/70 hover:bg-green-600 hover:text-black rounded-lg transition font-medium"
              >
                <span className="truncate">{video.title}</span>
                <span className="text-xs flex items-center gap-1">
                  {mode === 'watch' ? (
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
