import React, { useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import MovieCard from './moviecard';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
import { dedupeByShow } from '../lib/showKey';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Movie {
  id: string;
  title: string;
  year: string;
  price: string;
  poster: string;
}

interface RawMovie {
  id: string;
  title: string;
  poster?: string | null;
  image?: string | null;
  modifiedAt: string;
  narrator: string;
  genres: string[];
}

interface Props {
  genres?: string[];
  title?: string | null;
  /** 'tv' for series rows, 'movie' for films. */
  type?: string | null;
  /** Exact (case-insensitive) country match, e.g. 'South Korea'. */
  country?: string | null;
  /** 'score' = highest rated first, 'recent' = newest first. */
  sort?: 'score' | 'recent';
}

const SKELETON_COUNT = 6;
const VISIBLE = 12; // how many cards a row shows
// A score-sorted row is one row per season, so the first 12 can be 5 seasons of
// the same show. Over-fetch, then collapse to one row per show.
const SCORE_FETCH = 60;

// Genre labels in moviesv2 are stored with inconsistent casing ('Action' vs
// 'action') and a few synonyms ('Sci-Fi' vs 'Science Fiction'). A plain
// `contains` filter is case-sensitive, so lowercase rows were silently dropped.
// Match every common casing of each requested genre instead.
const GENRE_ALIASES: Record<string, string[]> = {
  'Sci-Fi': ['Sci-Fi', 'Science Fiction'],
};

const genreVariants = (genre: string): string[] => {
  const names = [genre, ...(GENRE_ALIASES[genre] ?? [])];
  const variants = new Set<string>();
  for (const name of names) {
    variants.add(name);
    variants.add(name.toLowerCase());
    variants.add(name.toUpperCase());
    variants.add(name.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()));
  }
  return [...variants];
};

const MovieSwiper: React.FC<Props> = ({
  genres = [],
  title = 'New Movies',
  type = null,
  country = null,
  sort = 'recent',
}) => {
  const uniqueId = useId().replace(/:/g, ''); // remove colons for CSS compatibility
  const prevButtonClass = `swiper-button-prev-${uniqueId}`;
  const nextButtonClass = `swiper-button-next-${uniqueId}`;

  const queryKey =
    'movies:swiper' +
    (genres.length > 0 ? `:g=${genres.join(',')}` : '') +
    (type ? `:type=${type}` : '') +
    (country ? `:country=${country}` : '') +
    `:sort=${sort}`;

  const { data, isLoading, isError } = useSupabaseQuery<Movie[]>(
    queryKey,
    async (client) => {
      let baseQuery = client
        .from('moviesv2')
        .select('id, title, poster, image, modifiedAt, narrator, genres')
        .limit(sort === 'score' ? SCORE_FETCH : VISIBLE);

      if (sort === 'score') {
        // Postgres sorts NULLs FIRST on DESC, so un-scored rows would sit at the
        // very top of a score-sorted row. Drop them explicitly.
        baseQuery = baseQuery
          .not('score', 'is', null)
          .order('score', { ascending: false })
          .order('modifiedAt', { ascending: false });
      } else {
        baseQuery = baseQuery.order('modifiedAt', { ascending: false }).order('score', { ascending: false });
      }

      if (genres.length > 0) {
        // One `overlaps` per genre: ANDs across genres, but each genre matches
        // any casing variant.
        for (const genre of genres) {
          baseQuery = baseQuery.overlaps('genres', genreVariants(genre));
        }
      }
      // Series vs films live in their own column, not in `genres`.
      if (type) baseQuery = baseQuery.eq('type', type);
      // PostgREST `ilike` is a full-string case-insensitive match, so
      // 'South Korea' won't also pull in 'Korea' or 'North Korea'.
      if (country) baseQuery = baseQuery.ilike('country', country);

      const { data, error } = await baseQuery;
      if (error) throw error;

      const transformed = (data as RawMovie[]).map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: dayjs(movie.modifiedAt).fromNow(),
        price: movie.narrator || 'Unknown narrator',
        poster: movie.poster || movie.image || '/fallback.jpg',
      }));

      // Rows arrive score-descending, so the first row kept for a show is its
      // best-scoring season — for a season list that's the newest one.
      const visible =
        sort === 'score' ? dedupeByShow(transformed).slice(0, VISIBLE) : transformed;

      return {
        data: visible,
        error: null,
        count: undefined,
      };
    }
  );

  const renderSkeletonSlides = () =>
    [...Array(SKELETON_COUNT)].map((_, idx) => (
      <SwiperSlide key={`skeleton-${idx}`}>
        <div className="animate-pulse bg-gray-700 rounded-lg w-full h-48 flex flex-col p-3">
          <div className="bg-gray-600 rounded-md h-32 w-full mb-3" />
          <div className="h-4 bg-gray-600 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-600 rounded w-1/2" />
        </div>
      </SwiperSlide>
    ));

  return (
    <section className="my-6 relative">
      <h2 className="font-bold text-xlarge text-white flex items-center gap-2 mb-4">
        {title} <FaChevronRight className="text-yellow-200" />
      </h2>

      {/* Custom Navigation Buttons with Unique Classes */}
      <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 z-10">
        <button className={`${prevButtonClass} p-2 bg-black bg-opacity-60 rounded-full`}>
          <FaChevronLeft size={18} className="text-white" />
        </button>
      </div>
      <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 z-10">
        <button className={`${nextButtonClass} p-2 bg-black bg-opacity-60 rounded-full`}>
          <FaChevronRight size={18} className="text-white" />
        </button>
      </div>

      <div className="container relative mx-auto py-8">
        {isLoading ? (
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={12}
            loop={false}
            breakpoints={{ 0: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 6 } }}
            className="mySwiper"
          >
            {renderSkeletonSlides()}
          </Swiper>
        ) : (data?.data?.length ?? 0) === 0 ? (
          // Previously an empty result rendered the same grey blocks as the
          // loading state, so a broken row looked like it was still loading,
          // forever. Say what actually happened instead.
          <p className="text-gray-400 py-6">
            {isError
              ? 'Could not load this section. Please refresh.'
              : 'No movies in this section yet.'}
          </p>
        ) : (
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation={{
              nextEl: `.${nextButtonClass}`,
              prevEl: `.${prevButtonClass}`,
            }}
            spaceBetween={12}
            loop={(data?.data?.length ?? 0) > 0}
            autoplay={{ delay: 1000, disableOnInteraction: false }}
            breakpoints={{ 0: { slidesPerView: 3 }, 768: { slidesPerView: 4 }, 1024: { slidesPerView: 6 } }}
            className="mySwiper"
          >
            {data?.data?.map((movie) => (
              <SwiperSlide key={movie.id}>
                <MovieCard movie={movie} />
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </div>
    </section>
  );
};

export default MovieSwiper;
