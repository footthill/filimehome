import {
  FaFacebookF,
  FaInstagram,
  FaWhatsapp,
  FaXTwitter
} from 'react-icons/fa6';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import { useState } from 'react';

const ShareModal = ({
  onClose,
  shareUrl
}: {
  onClose: () => void;
  shareUrl: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 10000);
    } catch {
      toast.error('Failed to copy the link.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center w-screen h-screen">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="bg-[#1e1e1e] text-white p-6 md:p-8 rounded-2xl w-[90%] max-w-md shadow-xl relative"
      >
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FiX size={22} />
        </button>

        {/* Title & Description */}
        <h2 className="text-2xl font-bold mb-2 text-white">Share FilimeFilms</h2>
        <p className="text-sm text-gray-300 mb-5">
          Let others enjoy the latest movies. Share this app with your friends!
        </p>

        {/* Copy Link Field */}
        <div className="flex items-center bg-[#2b2b2b] rounded-lg px-4 py-2 mb-6 border border-gray-700">
          <input
            readOnly
            value={shareUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="bg-transparent text-sm text-white flex-1 outline-none cursor-text select-all"
          />
          <button
            onClick={handleCopy}
            className={`ml-3 text-sm font-semibold px-4 py-1.5 rounded-lg transition duration-200 ${
              copied
                ? 'bg-green-600 text-white'
                : 'bg-white text-black hover:bg-gray-200'
            }`}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Social Share Icons */}
        <div className="flex justify-center gap-4 mt-3">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black hover:bg-gray-800 p-3 rounded-full transition"
            title="Share on Twitter"
          >
            <FaXTwitter size={18} />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#1877F2] hover:bg-[#145dbf] p-3 rounded-full transition"
            title="Share on Facebook"
          >
            <FaFacebookF size={18} />
          </a>
          <a
            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
              shareUrl
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#25D366] hover:bg-[#1da851] p-3 rounded-full transition"
            title="Share on WhatsApp"
          >
            <FaWhatsapp size={18} />
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gradient-to-br from-pink-500 via-red-500 to-green-500 p-3 rounded-full transition"
            title="Instagram (open profile)"
          >
            <FaInstagram size={18} />
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default ShareModal;
