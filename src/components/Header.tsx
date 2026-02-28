import { FiMenu, FiSearch, FiArrowLeft } from 'react-icons/fi';
import { FaSearch, FaShare } from 'react-icons/fa';
import logo from '../assets/logo192.png';
import { useEffect, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useSidebarStore } from '../store/useSideStore';
import {  useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ShareModal from './ShareMoadl';

const Header = () => {
  const navigate = useNavigate();
  const { toggle } = useSidebarStore();

  const [searchActive, setSearchActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const shareUrl = 'https://filimehome.web.app';
  
  // Search movies
  const search = useCallback(async (term: string) => {
    const { data, error } = await supabase
      .from('moviesv2')
      .select('id, title, image')
      .ilike('title', `%${term}%`)
      .order('modifiedAt', { ascending: false })
      .limit(10);

    if (!error && data) setSearchResults(data);
  }, []);

  // Debounce searchTerm
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchTerm.trim()) {
        search(searchTerm.trim());
      }
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, search]);

  // Fetch top 5 popular movies
  useEffect(() => {
    async function fetchPopular() {
      const { data, error } = await supabase
        .from('moviesv2')
        .select('id, title')
        .order('score', { ascending: false }) // Or change to 'likes'
        .limit(5);

      if (!error && data) setPopularMovies(data);
    }
    fetchPopular();
  }, []);

  return (
    <header className="h-14 px-4 md:px-6 flex items-center justify-between bg-[#141414]/70 backdrop-blur-md sticky top-0 z-50">
      {/* Left: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        <button onClick={toggle} aria-label="Toggle Sidebar">
          <FiMenu className="text-2xl cursor-pointer text-white" />
        </button>
        <div className="flex items-center gap-2 font-bold text-white text-lg">
          <img src={logo} alt="Mihetofilms Logo" className="w-[40px] " />
          <span>FilmHome</span>
        </div>
      </div>

      {/* Center: Search */}
      {!searchActive ? (
        <div className="flex-1 mx-4 hidden md:flex">
          <div className="flex items-center bg-[#3a3a3a] px-3 py-1.5 rounded-md w-full max-w-xl">
            <FiSearch className="text-gray-400 mr-2" />
            <input
              type="text"
              onClick={() => setSearchActive(true)}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search movies/TV Shows"
              className="bg-transparent text-sm text-white placeholder-gray-400 flex-1 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="absolute md:relative w-full max-w-xl left-0 right-0 p-3 md:p-0 bg-[#141414]/70 z-50">
          <div className="flex w-full">
            <button
              className="bg-[#3a3a3a] p-2 mr-1 hover:bg-[#3a3a3a]/90 rounded-full aspect-square"
              onClick={() => setSearchActive(false)}
              aria-label="Close Search"
            >
              <FiArrowLeft />
            </button>
            <div className="flex w-full items-center bg-[#3a3a3a] px-3 py-1.5 rounded-md">
              <FiSearch className="text-gray-400 mr-2" />
              <input
                autoFocus
                onChange={(e) => setSearchTerm(e.target.value)}
                type="text"
                placeholder="Search movies/TV Shows"
                className="bg-transparent text-sm text-white placeholder-gray-400 flex-1 focus:outline-none"
              />
            </div>
          </div>

          {/* Dropdown */}
          <div className="absolute top-full left-0 w-full bg-gray-800 text-white mt-2 rounded-lg shadow-lg max-h-96 overflow-auto">
            {searchTerm.trim() === '' ? (
              <>
                <h2 className="text-lg font-semibold px-4 py-2">
                  Everyone is searching
                </h2>
                <ul className="px-4 py-2 flex flex-wrap gap-2 text-sm">
                  {popularMovies.map((movie) => (
                    <li
                      key={movie.id}
                      onClick={() => {
                        navigate('/details/' + movie.id);
                        setSearchActive(false);
                      }}
                      className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      {movie.title}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-lg font-semibold px-4 py-2">Search Results</h2>
                <ul className="px-4 py-2 space-y-1 text-sm">
                  {searchResults.map((res) => (
                    <li
                      key={res.id}
                      onClick={() => {
                        navigate('/details/' + res.id);
                        setSearchActive(false);
                      }}
                      className="p-2 flex items-center m-1 rounded-md text-gray-300 hover:bg-gray-600 cursor-pointer"
                    >
                      <FaSearch className="mr-3" />
                      {res?.title}
                      <img
                        src={res?.image || ''}
                        alt={res?.title}
                        className="rounded-md ml-auto h-10 aspect-square object-cover"
                      />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* Mobile Search Icon */}
      {!searchActive && (
        <button
          onClick={() => setSearchActive(true)}
          className="p-2  rounded-md aspect-square md:hidden"
          aria-label="Open Search"
        >
          <FiSearch className="text-gray-400" />
        </button>
      )}

      {/* Right Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center aspect-square md:aspect-auto gap-2 p-2 md:px-3 md:py-1.5 text-sm rounded-md text-white bg-green-600 hover:bg-green-700 transition"
        >
          <FaShare />
          <span className="hidden md:inline-block">Share</span>
        </button>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showModal && (
          <ShareModal shareUrl={shareUrl} onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
