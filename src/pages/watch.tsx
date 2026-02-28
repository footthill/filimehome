import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand,
   FaArrowLeft,
} from "react-icons/fa";
import { FaExclamationCircle } from "react-icons/fa";
import toast from "react-hot-toast";

const MovieWatch = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>(null);

  const [iframesrc, setIframesrc] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { url: videoUrl, name: title } = location.state || {};
  
  useEffect(()=>{
      console.log(isFullscreen);
  },[isFullscreen])
  /* ----------------------- Guards ----------------------- */
  useEffect(() => {
    if (!videoUrl) {
      toast.error("No video URL provided");
      navigate(-1);
    }
  }, [videoUrl, navigate]);

  if (!videoUrl) {
    return null;
  }

  const isHtml =
    videoUrl.trim().startsWith("<!DOCTYPE") ||
    videoUrl.trim().startsWith("<html");

  /* ------------------ HTML EMBED HANDLING ------------------ */
  if (isHtml) {
    return (
      <div className="h-screen w-screen bg-black absolute inset-0">
        <div
          className="absolute inset-0 p-6"
          dangerouslySetInnerHTML={{ __html: videoUrl }}
        />
      </div>
    );
  }

  /* ------------------ MEDIAFIRE BLOCK ------------------ */
  if (videoUrl.includes("mediafire.com/")) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <FaExclamationCircle className="text-yellow-500 text-6xl mb-6" />
        <p className="mb-4">This video cannot be streamed.</p>
        <a
          href={videoUrl}
          download
          className="bg-yellow-500 px-6 py-3 rounded text-black font-bold"
        >
          Download Video
        </a>
      </div>
    );
  }

  /* ------------------ IFRAME DETECTION ------------------ */
  useEffect(() => {
    try {
      const parsed = new URL(videoUrl);
      // Allow iframes for external video hosts (adjust this logic as needed)
      const allowedIframeHosts = [
        "youtube.com",
        "vimeo.com",
        "dailymotion.com",
        "twitch.tv"
      ];
      
      const isAllowedIframe = allowedIframeHosts.some(host => 
        parsed.hostname.includes(host)
      );
      
      if (isAllowedIframe) {
        setIframesrc(parsed.href);
      } else {
        setIframesrc(null);
      }
    } catch {
      setIframesrc(null);
    }
  }, [videoUrl]);

  /* ------------------ VIDEO EVENTS ------------------ */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    const handleError = () => {
      setIsLoading(false);
      toast.error("Failed to load video");
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("playing", handlePlaying);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    // Set initial volume
    video.volume = volume / 100;
    video.muted = isMuted;

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [volume, isMuted]);

  /* ------------------ UI AUTO HIDE ------------------ */
  const hideControls = useCallback(() => {
    if (isPlaying) {
      setShowControls(false);
    }
  }, [isPlaying]);

  const showControlsWithTimeout = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(hideControls, 3000);
    }
  }, [isPlaying, hideControls]);

  useEffect(() => {
    showControlsWithTimeout();
    
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControlsWithTimeout]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("mousemove", showControlsWithTimeout);
    document.addEventListener("keydown", showControlsWithTimeout);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("mousemove", showControlsWithTimeout);
      document.removeEventListener("keydown", showControlsWithTimeout);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControlsWithTimeout]);

  /* ------------------ CONTROLS ------------------ */
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      video.play().catch(error => {
        toast.error("Failed to play video");
        console.error("Play error:", error);
      });
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    const video = videoRef.current;
    
    if (!video) return;
    
    video.volume = newVolume / 100;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted && newVolume > 0) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const video = videoRef.current;
    
    if (!video || !isFinite(video.duration)) return;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /* ------------------ RENDER ------------------ */
  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-black text-white group"
      onMouseMove={showControlsWithTimeout}
      onClick={() => togglePlay()}
    >
      {/* Video or iframe */}
      {!iframesrc ? (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-contain"
          preload="metadata"
        >
          <track kind="captions" src="" label="English" />
        </video>
      ) : (
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`${iframesrc}?autoplay=1&muted=${isMuted ? 1 : 0}`}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Video player"
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-40">
          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Back button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(-1);
        }}
        className="absolute top-4 left-4 z-50 bg-black/60 px-4 py-2 rounded hover:bg-black/80 transition-opacity"
        style={{ opacity: showControls ? 1 : 0 }}
      >
        <FaArrowLeft /> Back
      </button>

      {/* Title */}
      {title && showControls && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-black/60 px-4 py-2 rounded text-sm md:text-base truncate max-w-3/4">
          {title}
        </div>
      )}

      {/* Controls overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 z-40 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
          <div className="flex justify-between text-xs mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlay}
              className="hover:text-gray-300 transition-colors"
            >
              {isPlaying ? <FaPause size={20} /> : <FaPlay size={20} />}
            </button>
            
            <button
              onClick={toggleMute}
              className="hover:text-gray-300 transition-colors"
            >
              {isMuted || volume === 0 ? <FaVolumeMute size={20} /> : <FaVolumeUp size={20} />}
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              />
              <span className="text-xs w-10">{volume}%</span>
            </div>
            
            <div className="text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleFullscreen}
              className="hover:text-gray-300 transition-colors"
            >
              <FaExpand size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieWatch;