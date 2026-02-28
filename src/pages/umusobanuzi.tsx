import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MovieCard from "../components/moviecard";
import { supabase } from "../lib/supabase";
import { useNarratorStore } from "../store/useNarratorStore";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import AvatarImage from "../components/customAvatar";

dayjs.extend(relativeTime);

interface RawMovie {
  id: string;
  title: string;
  poster?: string | null;
  image?: string | null;
  modifiedAt: string;
  narrator: string;
  genres: string[];
  country?: string;
  release_date?: string;
}

interface Movie {
  id: string;
  title: string;
  poster: string;
  year: string;
  price: string;
}

const PAGE_SIZE = 12;

const Umusobanuzi = () => {
  const { id } = useParams<{ id: string }>();
  const { narrators } = useNarratorStore();
  const narrator = narrators.find((n) => n.id === id);

  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);

  useEffect(() => {
    if (!narrator) return;

    const fetchMovies = async () => {
      setLoading(true);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("moviesv2")
        .select("id, title, poster, image, modifiedAt, narrator, genres, country, release_date", { count: "exact" })
        .eq("narrator", narrator.name)
        .order("modifiedAt", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Failed to fetch narrator movies:", error);
        setMovies([]);
      } else {
        const transformed = (data as RawMovie[]).map((movie) => ({
          id: movie.id,
          title: movie.title,
          poster: movie.poster || movie.image || "/fallback.jpg",
          year: dayjs(movie.modifiedAt).fromNow(),
          price: movie.narrator || "Unknown narrator",
        }));

        setMovies(transformed);
        setTotalMovies(count || 0);
      }

      setLoading(false);
    };

    fetchMovies();
  }, [narrator, page]);

  if (!narrator) {
    return (
      <div className="text-white text-center py-10">Narrator not found</div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-8 mb-50">
      <div>
        <div className="relative w-full h-60 rounded-md bg-[#3a3a3a] overflow-visible" />
        <div className="flex flex-col md:flex-row ">
        <AvatarImage
  className="
    border-3 border-[#141414] rounded-full w-32 aspect-square object-cover
    translate-y-[-50%]
    translate-x-1/2 -translate-x-1/2
    md:translate-x-1/4
  "
  src={narrator.avatar}
  alt={narrator.name}
/>

          <div className="title  md:translate-x-1/4 text-center md:text-left">
            <h2 className="text-white text-3xl font-bold p-3">{narrator.name}</h2>
            <p className="text-gray-400 text-sm ml-3 -mt-2">{narrator.total_movies} movies</p>
          </div>
          <div className="actions md:ml-auto p-3">
            <button 
                className="flex w-full items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
            >
              Subscribe
            </button>
          </div>
        </div>
      </div>

      <div className="movies">
        <h2 className="text-xl text-white font-bold mb-3">Movies</h2>

        {loading ? (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-700 rounded-lg h-[200px]" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <p className="text-gray-400">No movies found for {narrator.name}</p>
        ) : (
          <>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="text-white px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-white">Page {page}</span>
              <button
                disabled={page * PAGE_SIZE >= totalMovies}
                onClick={() => setPage((p) => p + 1)}
                className="text-white px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
      
    </div>
  );
};

export default Umusobanuzi;
