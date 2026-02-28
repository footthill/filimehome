import React, { useId } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import MovieCard from './moviecard';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';
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
}

const SKELETON_COUNT = 6;

const MovieSwiper: React.FC<Props> = ({ genres = [], title = 'New Movies' }) => {
  const uniqueId = useId().replace(/:/g, ''); // remove colons for CSS compatibility
  const prevButtonClass = `swiper-button-prev-${uniqueId}`;
  const nextButtonClass = `swiper-button-next-${uniqueId}`;

  const queryKey = 'movies:swiper' + (genres.length > 0 ? `:${genres.join(',')}` : '');

  const { data, isLoading } = useSupabaseQuery<Movie[]>(
    queryKey,
    async (client) => {
      let baseQuery = client
        .from('moviesv2')
        .select('id, title, poster, image, modifiedAt, narrator, genres')
        .order('modifiedAt', { ascending: false })
        .limit(40);

      if (genres.length > 0 && genres[0] !== 'All') {
        baseQuery = baseQuery.overlaps('genres', genres);
      }

      const { data, error } = await baseQuery;
      if (error) throw error;

      const transformed = (data as RawMovie[]).map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: dayjs(movie.modifiedAt).fromNow(),
        price: movie.narrator || 'Unknown narrator',
        poster: movie.poster || movie.image || '/fallback.jpg',
      }));

      return {
        data: transformed,
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
        <Swiper
          modules={[Navigation,Autoplay]}
          navigation={{
            nextEl: `.${nextButtonClass}`,
            prevEl: `.${prevButtonClass}`,
          }}
          spaceBetween={12}
          loop={!isLoading && (data?.data?.length ?? 0) > 0}
          autoplay={!isLoading ? {
            delay: 1000,
            disableOnInteraction: false,
          } : false}
          breakpoints={{
            0: { slidesPerView: 3 },
            768: { slidesPerView: 4 },
            1024: { slidesPerView: 6 },
          }}
          className="mySwiper"
        >
          {isLoading || data?.data?.length === 0
            ? renderSkeletonSlides()
            : data?.data?.map((movie) => (
                <SwiperSlide key={movie.id}>
                  <MovieCard movie={movie} />
                </SwiperSlide>
              ))}
        </Swiper>
      </div>
    </section>
  );
};

export default MovieSwiper;
