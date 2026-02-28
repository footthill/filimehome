import { Link } from "react-router-dom";
import { FaMobileAlt, FaBell } from "react-icons/fa";

const AppComingSoon = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center px-4">
      <div className="max-w-xl">
        <div className="text-4xl sm:text-5xl font-bold mb-6 flex flex-col items-center gap-3">
          <FaMobileAlt className="text-6xl text-white/60" />
          <span>App Coming Soon 🚀</span>
        </div>

        <p className="text-lg sm:text-xl text-white/70 mb-8">
          We're working hard to bring you the best Agasobanuye experience on your phone.
          Be the first to know when it's live!
        </p>

        <Link
          to="/register"
          className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 transition px-6 py-3 rounded-full text-lg font-semibold"
        >
          <FaBell className="text-white" />
          Notify Me First
        </Link>

        <p className="mt-6 text-sm text-white/50">
         <Link to="/" className="underline hover:text-white"> Go back to home</Link>
        </p>
      </div>
    </div>
  );
};

export default AppComingSoon;
