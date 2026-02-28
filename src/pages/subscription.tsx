import { useEffect } from "react";
import { useNarratorStore } from "../store/useNarratorStore";
import UmusobanuziCard from "../components/UmusobanuziCard";
const Subscription = () => {
  const { narrators, loading, error, fetchNarrators } = useNarratorStore();

  useEffect(() => {
    if (narrators.length === 0 && !loading) {
      fetchNarrators();
    }
  }, [narrators, loading, fetchNarrators]);

  if (loading) return <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-gray-700 rounded-lg h-[200px]" />
          ))}
        </div>;
  if (error) return <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="animate-pulse bg-gray-700 rounded-lg h-[200px]" />
          ))}
        </div>;

  return (
    <div className="space-y-6 px-4 md:px-8 mb-50">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {narrators.map((narrator) => (
        <UmusobanuziCard
          key={narrator.id}
          person={{
            id:narrator.id,
            name: narrator.name,
            avatar: narrator.avatar,
            totalMovies: narrator.total_movies,
          }}
        />
      ))}
    </div>
    </div>
    
  );
};

export default Subscription