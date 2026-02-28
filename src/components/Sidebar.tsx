import React, { useEffect, useRef } from 'react';
import type { FC } from 'react';
import {
  FiZap,         // for Action
  FiSmile,       // for Comedy
  FiUsers,       // for Drama
  FiAlertTriangle, // for Horror
  FiMap,         // for Adventure
  FiCpu,          // for Sci-Fi
  FiHome,
  FiCompass
} from 'react-icons/fi';

import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarStore } from '../store/useSideStore';
import { useNarratorStore } from '../store/useNarratorStore';
import { FaWhatsapp } from 'react-icons/fa';

interface MenuItem {
  label: string;
  Icon: FC<React.SVGProps<SVGSVGElement>>;
  extraContent?: React.ReactNode;
  link: string;
}

interface GenreItem {
  label: string;
  link: string;
  Icon: FC<React.SVGProps<SVGSVGElement>>;
}

const sidebarMenuTop: MenuItem[] = [
  { label: 'Home', link: '/', Icon: FiHome},
  { label: 'Explore', link: '/browse', Icon: FiCompass },
];

const genres: GenreItem[] = [
  { label: 'Action', link: '/browse?genre=Action&page=1', Icon: FiZap },
  { label: 'Comedy', link: '/browse?genre=Comedy&page=1', Icon: FiSmile },
  { label: 'Drama', link: '/browse?genre=Drama&page=1', Icon: FiUsers },
  { label: 'Horror', link: '/browse?genre=Horror&page=1', Icon: FiAlertTriangle },
  { label: 'Adventure', link: '/browse?genre=Adventure&page=1', Icon: FiMap },
  { label: 'Sci-Fi', link: '/browse?genre=Sci-Fi&page=1', Icon: FiCpu },
]

const Sidebar: FC = () => {
  const { isOpen, toggle } = useSidebarStore();
  const navigate = useNavigate();
  const location = useLocation();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  const { narrators, loading,  fetchNarrators } = useNarratorStore();

  useEffect(() => {
    if (narrators.length === 0 && !loading) {
      fetchNarrators();
    }
  }, [narrators, loading, fetchNarrators]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const isMobile = window.innerWidth < 768;
      if (
        isMobile &&
        isOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        toggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, toggle]);

const baseButtonClasses =
  'flex items-center w-full px-4 py-2 rounded-md text-green-700 hover:bg-green-100 hover:text-green-800 transition-all duration-200';
const activeButtonClasses =
  'bg-green-600 text-white shadow hover:bg-green-700';




  const handleNavigate = (link: string) => {
    navigate(link);
    if (window.innerWidth < 768 && isOpen) toggle(); // auto-close on mobile
  };

  const renderMenuItem = (
    { label, Icon, link, extraContent }: MenuItem,
    index: number
  ) => {
    const isActive = location.pathname === link;

    return (
      <button
        key={label + index}
        onClick={() => handleNavigate(link)}
        className={`${baseButtonClasses} ${isActive ? activeButtonClasses : ''}`}
        aria-label={label}
        type="button"
      >
        <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
        <span className="text-sm">{label}</span>
        {extraContent}
      </button>
    );
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ height: 'calc(100vh - 56px)' }}
      className={`
        fixed top-14 z-30 bg-[#141414] text-white w-64 p-4 overflow-y-auto custom-scrollbar
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:block
      `}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      {/* Top Menu */}
      <nav className="pb-4 border-b border-gray-700 mb-4" aria-label="Main menu">
        {sidebarMenuTop.map(renderMenuItem)}
        <a
        href="https://wa.me/250795566578?text=I%27m%20from%20FilimeHome" // replace with your real WhatsApp number
        target="_blank"
        rel="noopener noreferrer"
        className='flex items-center w-full p-2 rounded text-green-500 transition-colors'
        aria-label={'Chat on WhatsApp'}
      >
        <FaWhatsapp  className="h-6 w-6 mr-4 flex-shrink-0" />
        <span className="text-sm">Chat on WhatsApp</span>
      </a>
      </nav>

      {/* Genre Section */}
      <section className="pb-4  border-gray-700 mb-4">
        <h3 className="text-sm uppercase text-gray-400 mb-2 font-medium">Genres</h3>
        {genres.map(({ label, Icon, link }, index) => {
          const isActive = location.search.includes(`genre=${label}`);
          return (
            <button
              key={label + index}
              onClick={() => handleNavigate(link)}
              className={`${baseButtonClasses} ${isActive ? activeButtonClasses : ''}`}
              aria-label={label}
              type="button"
            >
              <Icon className="h-6 w-6 mr-4 flex-shrink-0" />
              <span className="text-sm">{label}</span>
              <span>
                <img className='w-[20px] ' src="https://h5-static.aoneroom.com/oneroomStatic/public/_nuxt/novel-hot.D_FY4Np1.gif" alt="" />
              </span>
            </button>
          );
        })}
      </section>


      {/* Custom Scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f3f;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #555;
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;
