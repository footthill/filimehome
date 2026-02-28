import { FaFacebookF, FaInstagram, FaYoutube} from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-black text-white rounded-lg py-12 px-6 text-center border-t border-gray-800 mt-16 shadow-inner">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-semibold mb-2 tracking-wide">
          Connect with Filime Home
        </h2>
        <p className="text-gray-400 text-sm mb-8 max-w-xl mx-auto">
          Follow us on social media for the latest updates, releases, and exclusive content.
        </p>

        <div className="flex justify-center gap-6 flex-wrap mb-8">
          <SocialIcon
            href="https://www.facebook.com/profile.php?id=61579638986664"
            bgClass="bg-blue-600 hover:bg-blue-700"
            icon={<FaFacebookF size={20} />}
            ariaLabel="Facebook"
          />
          <SocialIcon
            href="https://www.instagram.com/filimshome?igsh=YzljYTk1ODg3Zg== "
            bgClass="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 hover:opacity-90"
            icon={<FaInstagram size={20} />}
            ariaLabel="Instagram"
          />
          <SocialIcon
            href="https://youtube.com/@filmshome-p6c?si=FJaJnwxV9cD2VMAo"
            bgClass="bg-red-600 hover:bg-red-700"
            icon={<FaYoutube size={20} />}
            ariaLabel="YouTube"
          />
        </div>
        <p className="text-xs text-gray-500 select-none">
          &copy; {new Date().getFullYear()} Filime Home. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

const SocialIcon = ({
  href,
  bgClass,
  icon,
  ariaLabel,
}: {
  href: string;
  bgClass: string;
  icon: React.ReactNode;
  ariaLabel: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={ariaLabel}
    className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-md transition duration-300 ${bgClass}`}
  >
    {icon}
  </a>
);



export default Footer;
