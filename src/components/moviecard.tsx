import React from 'react';
import { FaPlay } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface Movie {
  id: string;
  title: string;
  poster: string;
  year: string | number;
  price: string;
}

interface MovieCardProps {
  movie: Movie;
}

const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  return (
    <Link to={'/details/'+movie.id} className="bg-gray-800 aspect-[0.55] rounded-lg overflow-hidden shadow-lg flex flex-col text-left group relative">
      {/* Movie Poster with Aspect Ratio */}
      <div className="relative w-full flex-grow">
        <img
          src={movie.poster}
          alt={movie.title}
          className="object-cover w-full h-full"
        />
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <FaPlay className="text-white text-2xl" />
        </div>
      </div>

      {/* Movie Info */}
     <div
  className="px-3 py-1 bg-gradient-to-t from-black via-gray-900 to-transparent flex flex-col justify-between h-[60px] overflow-hidden"
>
  {/* Title */}
  <h3
    className="text-white text-[11px] font-semibold leading-snug line-clamp-2 overflow-hidden"
    title={movie.title}
    style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
  >
    {movie.title}
  </h3>
  {/* Bottom Section: Year + Price */}
  <div className="flex justify-between items-center text-[11px] mt-1 overflow-hidden">
    <p className="text-gray-400 whitespace-nowrap mr-2 flex-shrink-0">{movie.year}</p>
    <p className="text-white font-medium truncate max-w-[60%] text-right">
      {movie.price}
    </p>
  </div>
</div>

    </Link>
  );
};

export default MovieCard;
