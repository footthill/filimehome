import { useSearchParams } from "react-router-dom";
import { useSupabaseQuery } from "../hooks/useSupabaseQuery";
import MovieCard from "../components/moviecard";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Footer from "../components/footer";

dayjs.extend(relativeTime);

const PAGE_SIZE = 12;

const genresList = [
  "All", "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime", "Documentary",
  "Drama", "Family", "Fantasy", "History", "Horror", "Musical", "Mystery", "Romance",
  "Sci-Fi", "Sport", "Thriller", "War", "Western"
];

const countriesList = [
  "All", "United States", "India", "United Kingdom", "France", "Nigeria", "South Africa",
  "Japan", "Australia", "Brazil", "Germany", "Canada", "Mexico", "Italy", "South Korea",
  "Spain", "Russia", "Kenya", "Netherlands", "Philippines", "Turkey", "Belgium",
  "Thailand", "Colombia", "Sweden", "Vietnam", "Ireland", "Morocco", "New Zealand",
  "Finland", "Hungary", "Romania", "Indonesia", "Czech Republic", "Saudi Arabia", "Taiwan",
  "Switzerland", "Liberia", "Guinea", "Bulgaria", "Georgia", "Norway", "Chile", "Malaysia",
  "China"
];

const narratorsList = [
  "All", "Rocky", "Junior Giti", "Gaheza", "Sankara Da Premier", "Savimbi", "Senior",
  "Saga Mwiza", "Fey", "Yanga", "PK", "Fred", "B da great", "Dylan Kabaka", "Cyber Bigwi",
  "Didier", "Eric Pro", "Hakim", "Jovi", "Kim Rwanda", "Master P", "Moses", "Mr Genius",
  "Ndabaga", "Nkuba", "Perfect", "Remmy", "Robert", "Sikov", "Vj Steppin", "Yakuza"
];

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeGenre = searchParams.get("genre") || "All";
  const activeNarrator = searchParams.get("narrator") || "All";
  const activeCountry = searchParams.get("country") || "All";
  const page = Number(searchParams.get("page")) || 1;

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set(key, value);
    if (key !== "page") newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const { data, isLoading } = useSupabaseQuery(
    `movies:browse:${activeGenre}:${activeNarrator}:${activeCountry}:${page}`,
    async (client) => {
      let query = client
        .from("moviesv2")
        .select("id, title, poster, image, modifiedAt, narrator, genres, country, release_date")
        .order("modifiedAt", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (activeGenre !== "All") query = query.contains("genres", [activeGenre]);
      if (activeNarrator !== "All") query = query.eq("narrator", activeNarrator);
      if (activeCountry !== "All") query = query.eq("country", activeCountry);

      const { data, error } = await query;
      if (error) throw error;

      const transformed = (data ?? []).map((movie) => ({
        id: movie.id,
        title: movie.title,
        poster: movie.poster || movie.image || "/fallback.jpg",
        year: dayjs(movie.modifiedAt).fromNow(),
        price: movie.narrator || "Unknown narrator",
      }));

      return { data: transformed, error: null };
    }
  );

  const movies = data?.data || [];

  const renderFilterGroup = <T extends string>(
    label: string,
    items: T[],
    activeItem: T,
    paramKey: string
  ) => (
    <div className="filter overflow-red pb-3 max-w-full overflow-x-auto flex items-center gap-2">
      <div className="label text-white bg-[#141414] sticky left-0 pr-2 text-sm font-semibold">{label}</div>
      <ul className="flex gap-1">
        {items.map((item) => (
          <li key={item}>
            <button
              onClick={() => updateFilter(paramKey, item)}
              className={`rounded-lg px-3 py-1 text-xs text-nowrap font-medium transition-colors ${
                item === activeItem
                  ? "bg-gray-300 text-gray-900"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-6 px-4 md:px-8 mb-50">
      <div className="filters space-y-4">
        {renderFilterGroup("Genres", genresList, activeGenre, "genre")}
        {renderFilterGroup("Umusobanuzi", narratorsList, activeNarrator, "narrator")}
        {renderFilterGroup("Country", countriesList, activeCountry, "country")}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-gray-700 rounded-lg h-[200px]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}

      <div className="flex justify-center items-center gap-4 mt-4">
        <button
          disabled={page === 1}
          onClick={() => updateFilter("page", (page - 1).toString())}
          className="text-white px-3 py-1 bg-gray-700 rounded disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-white">Page {page}</span>
        <button
          onClick={() => updateFilter("page", (page + 1).toString())}
          className="text-white px-3 py-1 bg-gray-700 rounded"
        >
          Next
        </button>
      </div>
          <Footer />
    </div>
  );
};

export default Browse;
