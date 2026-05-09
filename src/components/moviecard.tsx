import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Movie {
  id: string;
  title: string;
  poster: string;
  year?: string | number;
  price?: string;
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <Link 
      to={'/details/' + movie.id} 
      className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg group cursor-pointer"
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${movie.poster})`,
        }}
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-300" />

      {/* Content Container */}
      <div className="relative w-full h-full flex flex-col justify-end p-4 sm:p-5">
        {/* Movie Title */}
        <h3 className="text-white text-lg sm:text-xl font-bold mb-3 line-clamp-2 leading-tight">
          {movie.title}
        </h3>

        {/* Watch Now Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            // Navigate to watch or details page
          }}
          className="inline-flex items-center justify-center gap-2 w-fit bg-white text-black px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-sm sm:text-base hover:bg-gray-200 transition-colors duration-200 group/btn"
        >
          <FaPlay className="text-xs sm:text-sm" />
          <span>Watch now</span>
        </button>
      </div>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    </Link>
  );
};

export default MovieCard;
