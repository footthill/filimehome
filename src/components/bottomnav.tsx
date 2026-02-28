import { useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineHome,  HiOutlineCollection } from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import { FiCompass } from 'react-icons/fi';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
    { label: 'Home', icon: <HiOutlineHome size={20} />, link: '/' },
    { label: 'Explore', icon: <FiCompass size={20} />, link: '/browse' },
    { label: 'Abasobanuzi', icon: <HiOutlineCollection size={20} />, link: '/subscription' },
  ];

  return (
    <nav className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-50 flex justify-between items-center bg-gray-900/90 backdrop-blur-md rounded-full px-4 py-1.5 shadow-lg w-11/12 max-w-[360px] border border-gray-800 md:hidden">
      {items.map(({ label, icon, link }) => {
        const isActive = location.pathname === link;
        return (
          <button
            key={label}
            onClick={() => navigate(link)}
            className={`flex flex-col items-center justify-center text-[10px] transition-all duration-300 ${
              isActive
                ? 'text-yellow-400 scale-110'
                : 'text-gray-400 hover:text-white hover:scale-105'
            }`}
          >
            {icon}
            <span className="mt-0.5">{label}</span>
            {isActive && (
              <span className="block mt-0.5 h-1 w-1 rounded-full bg-yellow-400 animate-pulse" />
            )}
          </button>
        );
      })}

      {/* WhatsApp Button */}
      <a
        href="https://wa.me/250795566578?text=I%27m%20from%20FilimeHome"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center text-[10px] text-green-500 hover:scale-105 transition-transform"
      >
        <FaWhatsapp size={20} />
        <span className="mt-0.5">WhatsApp</span>
      </a>
    </nav>
  );
};

export default BottomNav;
