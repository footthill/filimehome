import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { FaCircleChevronLeft, FaCircleChevronRight } from 'react-icons/fa6';
import { useNavigate } from 'react-router-dom';
import { useSupabaseQuery } from '../hooks/useSupabaseQuery';

interface Movie {
  id: string;
  title: string;
  backdrop?: string | null;
  image?: string | null;
  tmdb_overview?: string | null;
  score: number;
  modifiedAt: string;
}

const PAGE_SIZE = 8;

const MovieHeroSection: React.FC = () => {
  const navigate = useNavigate();

  const { data: top8Data, isLoading: top8Loading, error: top8Error } =
    useSupabaseQuery<Movie[]>(
      'movies:top8',
      async (client) => {
        const { data, error, count } = await client
          .from('moviesv2')
          .select('id, title, backdrop, tmdb_overview, image, score, modifiedAt')
          .order('modifiedAt', { ascending: false })
          .limit(PAGE_SIZE);
        return { data, error, count: count ?? undefined };
      }
    );

  const { data: recent2Data, isLoading: recent2Loading} =
    useSupabaseQuery<Movie[]>(
      'movies:recent2',
      async (client) => {
        const { data, error, count } = await client
          .from('moviesv2')
          .select('id, title, backdrop, image, score, modifiedAt')
          .order('modifiedAt', { ascending: false })
          .limit(2);
        return { data, error, count: count ?? undefined };
      }
    );

  const { data: rockyData, isLoading: rockyLoading,  } =
    useSupabaseQuery<Movie>(
      'movies:rocky',
      async (client) => {
        const { data, error, count } = await client
          .from('moviesv2')
          .select('id, title, backdrop, tmdb_overview, image, score, modifiedAt')
          .eq('narrator', 'Rocky')
          .order('modifiedAt', { ascending: false })
          .limit(1)
          .single();
        return { data, error, count: count ?? undefined };
      }
    );

  const loading = top8Loading || recent2Loading || rockyLoading;
  const getPoster = (m: Movie) => m.image || m.backdrop || '';

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto text-white">
      {/* Left (2 Swipers stacked in grid) */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4 h-[320px]">
        {[1, 2].map((n) => (
          <div key={n} className="relative rounded-2xl overflow-hidden shadow-lg bg-black/40 backdrop-blur-sm">
            <Swiper
              autoplay={{ delay: 3000, disableOnInteraction: false }}
              navigation={{
                nextEl: `.custom-next${n}`,
                prevEl: `.custom-prev${n}`,
              }}
              pagination={{ clickable: true }}
              modules={[Navigation, Autoplay]}
              slidesPerView={1}
              loop
              className="h-full w-full"
            >
              {loading ? (
                <SwiperSlide>
                  <div className="animate-pulse bg-gray-800 w-full h-full" />
                </SwiperSlide>
              ) : top8Error ? (
                <SwiperSlide>
                  <div className="text-red-400 p-6">Failed to load movies.</div>
                </SwiperSlide>
              ) : (
                top8Data?.data?.slice(n===1?0:3,n===1?4:7).map((movie) => (
                  <SwiperSlide key={movie.id}>
                    <div
                      onClick={() => navigate('/details/' + movie.id)}
                      className="relative h-full cursor-pointer"
                    >
                      <img
                        src={getPoster(movie)}
                        alt={movie.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="relative z-10 p-4 flex flex-col justify-end h-full">
                        <h2 className="text-lg md:text-xl font-bold line-clamp-2 drop-shadow">
                          {movie.title}
                        </h2>
                        <div>
                          <button className="inline-flex items-center gap-2 text-xs bg-white/90 text-black font-semibold py-1.5 px-3 rounded-lg shadow-md hover:bg-white transition">
                          <FaPlay /> Watch now
                           </button>
                        </div>
                        
                      </div>
                    </div>
                  </SwiperSlide>
                ))
              )}
            </Swiper>
            {/* Controls */}
            <button className={`custom-prev${n} absolute top-1/2 left-2 -translate-y-1/2 text-white text-xl`}>
              <FaCircleChevronLeft />
            </button>
            <button className={`custom-next${n} absolute top-1/2 right-2 -translate-y-1/2 text-white text-xl`}>
              <FaCircleChevronRight />
            </button>
          </div>
        ))}
      </div>

      {/* Right column (Rocky + recent) */}
      <div className="flex flex-col gap-4 h-[320px]">
        {/* Rocky */}
        {rockyData?.data && (
          <div
            onClick={() => navigate('/details/' + rockyData.data?.id)}
            className="relative flex-1 rounded-2xl overflow-hidden shadow-lg bg-black/40 cursor-pointer"
          >
            <img
              src={getPoster(rockyData.data)}
              alt={rockyData.data.title}
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="relative z-10 p-4 flex flex-col justify-end h-full">
              <h3 className="text-base md:text-lg font-bold line-clamp-2">
                {rockyData.data.title}
              </h3>
              <div>
                <button className="mt-2 inline-flex items-center gap-2 text-xs bg-white/90 text-black font-semibold py-1.5 px-3 rounded-lg shadow-md hover:bg-white transition">
                <FaPlay /> start Watching now
              </button> 
              </div>
             
            </div>
          </div>
        )}

        {/* Recent 2 */}
        <div className="grid grid-cols-2 gap-4 h-[40%]">
          {recent2Data?.data?.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate('/details/' + m.id)}
              className="relative rounded-2xl bg-cover bg-center shadow-md cursor-pointer flex items-end p-3"
              style={{ backgroundImage: `url(${getPoster(m)})` }}
            >
              <p className="text-sm font-semibold text-white drop-shadow line-clamp-2">
                {m.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieHeroSection;
