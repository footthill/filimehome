import { useEffect, useState, type FC} from "react";
import { useParams } from "react-router-dom";
import {
  FaFilm,
  FaGlobeAmericas,
  FaPlay,
  FaVideo,
  FaDownload,
  FaUser,
} from "react-icons/fa";
import { supabase } from "../lib/supabase";
import axios from "axios";
import WatchModal from "../components/watchmodal";

interface MovieVideo {
  title: string;
  downloadUrl: string;
  direct: boolean;
  watchUrl: string;
}

interface SupMovie {
  id: string;
  title: string;
  country?: string;
  narrator?: string;
  tmdb_id?: number;
  tmdb_overview?: string;
  poster?: string | null;
  image?: string | null;
  modifiedAt?: string;
  Downloadurls: MovieVideo[];
}

const TMDB_API_KEY = "97b73a4d4fcb7b36fbb151aac0f762d3";

const MovieDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const [movie, setMovie] = useState<SupMovie | null>(null);
  const [movieVideos, setMovieVideos] = useState<MovieVideo[]>([]);
  const [trailers, setTrailers] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openMode, setOpenMode] = useState<"watch" | "download">("watch");

  const open = (mode: "watch" | "download") => {
    setOpenMode(mode);
    setShowModal(true);
  };

  useEffect(() => {
    if (!id) return;

    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("moviesv2")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) throw new Error("Movie not found");

        setMovie(data);
        setMovieVideos(data.Downloadurls || []);

        if (data.tmdb_id) {
          try {
            const [vRes, iRes] = await Promise.all([
              axios.get(
                `https://api.themoviedb.org/3/movie/${data.tmdb_id}/videos`,
                { params: { api_key: TMDB_API_KEY } }
              ),
              axios.get(
                `https://api.themoviedb.org/3/movie/${data.tmdb_id}/images`,
                { params: { api_key: TMDB_API_KEY } }
              ),
            ]);

            const trailerUrls = Array.isArray(vRes.data?.results)
              ? vRes.data.results
                  .filter((v: any) => v.site === "YouTube" && v.key)
                  .map((v: any) => `https://www.youtube.com/embed/${v.key}`)
              : [];

            const imageUrls = Array.isArray(iRes.data?.backdrops)
              ? iRes.data.backdrops.map(
                  (b: any) => `https://image.tmdb.org/t/p/w500${b.file_path}`
                )
              : [];

            setTrailers(trailerUrls);
            setImages(imageUrls);
          } catch (tmdbErr: any) {
            console.warn("TMDB fetch failed:", tmdbErr.message);
            setTrailers([]);
            setImages([]);
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err.message);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

  

    fetchMovieData();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-8">
        <div className="relative w-full h-60 bg-gray-700 animate-pulse rounded-md" />
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 animate-pulse">
          <div className="w-32 h-32 bg-gray-600 rounded-full md:translate-x-1/4 translate-y-[-50%]" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-600 rounded w-1/2" />
            <div className="h-4 bg-gray-600 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-48 bg-gray-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>Movie not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-8 mb-16">
      {showModal && (
        <WatchModal
          onClose={() => setShowModal(false)}
          poster={movie.image || movie.poster || images[0]}
          movieName={movie.title}
          videos={movieVideos}
          option={openMode}
          trailerUrl={trailers[0] || ""}
        />
      )}

      {/* Header */}
      <section className="relative">
        <div className="w-full h-60 rounded-md bg-gray-800 overflow-hidden shadow-md">
          {images[0] && (
            <img
              src={images[0]}
              alt="backdrop"
              className="w-full h-full object-cover rounded-md"
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start -mt-16">
          <img
            src={movie.poster || movie.image || images[1] || ""}
            alt={movie.title}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-900 object-cover"
          />
          <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-white">{movie.title}</h2>
            <p className="text-gray-400 mt-1">
              {movieVideos.length} video{movieVideos.length !== 1 && "s"}
            </p>
          </div>

          <div className="flex md:flex-col gap-3 md:ml-auto mt-4 md:mt-0">
            <button
              onClick={() => open("watch")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
            >
              <FaPlay /> Watch Now
            </button>
            <button
              onClick={() => open("download")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
            >
              <FaDownload /> Download Now
            </button>
          </div>
        </div>
      </section>

      {/* Details & Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Movie Info */}
        <section>
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
              Movie Info
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <FaFilm className="text-green-500" /> 
                <span className="text-gray-400 font-medium">Title:</span>
                <span className="text-white">{movie.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaGlobeAmericas className="text-green-500" />
                <span className="text-gray-400 font-medium">Country:</span>
                <span className="text-white">{movie.country || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUser className="text-green-500" />
                <span className="text-gray-400 font-medium">Narrator:</span>
                <span className="text-white">{movie.narrator || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaVideo className="text-green-500" />
                <span className="text-gray-400 font-medium">Videos:</span>
                <span className="text-white">{movieVideos.length}</span>
              </div>
            </div>
          </div>

          {/* Trailer */}
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
              Trailer
            </h3>
            {trailers[0] ? (
              <div className="relative pb-[56.25%] rounded-xl overflow-hidden shadow-inner mb-4">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                  src={trailers[0]}
                  title="Movie Trailer"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-gray-400">No trailer available</p>
            )}
            {trailers[0] && (
              <button
                onClick={() =>
                  window.open(trailers[0].replace("/embed/", "/watch?v="), "_blank")
                }
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
              >
                Watch Trailer
              </button>
            )}
          </div>

          {/* Description */}
          {movie.tmdb_overview && (
            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{movie.tmdb_overview}</p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-white mb-3">Images</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Movie ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Downloadable Videos */}
        <section>
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4">Movie Videos</h3>
            {movieVideos.length > 0 ? (
              <ul className="space-y-3">
                {movieVideos.map((video, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-800 rounded-xl p-2 hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.image || movie.poster || ""}
                        alt={`Video ${idx + 1}`}
                        className="w-16 h-10 object-cover rounded-md"
                      />
                      <span className="text-gray-300 font-medium">{video.title}</span>
                    </div>
                    <a
                      href={video.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm font-semibold text-green-500 hover:text-green-600 transition"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No videos available</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovieDetails;
