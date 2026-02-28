import React from 'react';
import { FaVideo } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import AvatarImage from './customAvatar';

interface Umusobanuzi {
  id: string;
  name: string;
  avatar: string;
  totalMovies: number;
}

interface UmusobanuziCardProps {
  person: Umusobanuzi;
}

const UmusobanuziCard: React.FC<UmusobanuziCardProps> = ({ person }) => {
  return (
    <Link
      to={`/umusobanuzi/${person.id}`}
      className="bg-gray-800 aspect-[0.8] rounded-lg overflow-hidden shadow-lg flex flex-col text-left group relative hover:scale-105 transition-transform duration-300"
    >
      {/* Avatar */}
      <div className="relative w-full flex-grow">
        <AvatarImage className='w-full  object-cover rounded-lg' src={person.avatar} alt={person.name} />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-80 transition-opacity duration-300">
          <span className="text-green-400 text-xl font-bold">View</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 bg-gradient-to-t from-black via-gray-900 to-transparent">
        <h3 className="text-white text-sm font-semibold truncate" title={person.name}>
          {person.name}
        </h3>

        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <FaVideo className="text-green-400" />
          <span>{person.totalMovies} movies</span>
        </div>
      </div>
    </Link>
  );
};

export default UmusobanuziCard;
