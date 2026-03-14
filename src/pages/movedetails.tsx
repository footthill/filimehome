import React, { useEffect, useState, useCallback, type FC } from "react";
import { useParams } from "react-router-dom";
import {
  FaFilm,
  FaGlobeAmericas,
  FaPlay,
  FaVideo,
  FaDownload,
  FaUser,
  FaComment,
  FaPaperPlane,
} from "react-icons/fa";
import { supabase } from "../lib/supabase";
import axios from "axios";
import WatchModal from "../components/watchmodal";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";

interface MovieVideo {
  title: string;
  downloadUrl: string;
  direct: boolean;
  watchUrl: string;
}

interface SupMovie {
  id: string;
  title: string;
  country?: string;
  narrator?: string;
  tmdb_id?: number;
  tmdb_overview?: string;
  poster?: string | null;
  image?: string | null;
  modifiedAt?: string;
  Downloadurls: MovieVideo[];
}

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  user_id: string;
  user: {
    display_name: string;
    avatar_url: string;
  };
  likes_count?: number;
  user_has_liked?: boolean;
  replies?: UserComment[];
}

const TMDB_API_KEY = "97b73a4d4fcb7b36fbb151aac0f762d3";

interface CommentItemProps {
  comment: UserComment;
  isReply?: boolean;
  authUser: any;
  guestName: string;
  setGuestName: (name: string) => void;
  onLike: (id: string) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
}

const CommentItem: FC<CommentItemProps> = ({ comment, isReply, authUser, guestName, setGuestName, onLike, onReply }) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await onReply(comment.id, replyContent);
      setReplyContent("");
      setIsReplying(false);
    } catch (err) {
      // Parent handleCommentSubmit already show toast
      // We don't close the form so they can try again
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-4 ${isReply ? "ml-8 border-l-2 border-gray-800 pl-4 py-2" : "bg-gray-800/50 rounded-xl p-4 border border-gray-800"}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 ${isReply ? "w-6 h-6 border" : "w-10 h-10"} rounded-full bg-green-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-sm`}>
          {comment.user?.avatar_url ? (
            <img src={comment.user.avatar_url} alt={comment.user.display_name} className="w-full h-full object-cover" />
          ) : (
            comment.user?.display_name?.charAt(0).toUpperCase() || "U"
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className={`font-semibold text-white ${isReply ? "text-xs" : "text-sm"}`}>
              {comment.user?.display_name || "Unknown User"}
            </h4>
            <span className="text-[10px] text-gray-500">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className={`${isReply ? "text-xs" : "text-sm"} text-gray-300 leading-relaxed`}>
            {comment.content}
          </p>
          
          <div className="flex items-center gap-4 mt-3">
            <button 
              type="button"
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1.5 text-[10px] font-bold transition-all ${comment.user_has_liked ? "text-green-500" : "text-gray-500 hover:text-white"}`}
            >
              <FaPlay className={`${comment.user_has_liked ? "fill-current" : "fill-none stroke-current"}`} size={10} /> 
              {comment.likes_count || 0}
            </button>
            <button 
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 hover:text-white transition-all"
            >
              <FaComment size={10} /> Reply
            </button>
          </div>

          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-4 animate-in slide-in-from-top-2 duration-200">
              {!authUser && (
                <div className="mb-2">
                  <input
                    type="text"
                    required
                    placeholder="Your Name (Required)"
                    className="w-full bg-gray-900/80 text-white rounded-lg p-2 border border-gray-700 focus:border-green-500 outline-none text-[10px]"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                  />
                </div>
              )}
              <div className="relative">
                <textarea
                  autoFocus
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Your reply..."
                  className="w-full bg-gray-900/50 text-white rounded-xl p-3 pr-10 border border-gray-700 focus:border-green-500 outline-none resize-none h-20 text-xs shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim() || (!authUser && !guestName.trim())}
                  className="absolute bottom-2 right-2 p-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition shadow-md"
                >
                  <FaPaperPlane size={12} className={isSubmitting ? "animate-pulse" : ""} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => (
            <CommentItem 
              key={reply.id} 
              comment={reply} 
              isReply 
              authUser={authUser} 
              guestName={guestName} 
              setGuestName={setGuestName}
              onLike={onLike} 
              onReply={onReply} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MovieDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: authUser } = useAuthStore();
  const [movie, setMovie] = useState<SupMovie | null>(null);
  const [movieVideos, setMovieVideos] = useState<MovieVideo[]>([]);
  const [trailers, setTrailers] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [openMode, setOpenMode] = useState<"watch" | "download">("watch");

  // Comment states
  const [comments, setComments] = useState<UserComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [guestName, setGuestName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const open = (mode: "watch" | "download") => {
    setOpenMode(mode);
    setShowModal(true);
  };

  useEffect(() => {
    if (!id) return;

    const fetchMovieData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("moviesv2")
          .select("*")
          .eq("id", id)
          .single();

        if (error || !data) throw new Error("Movie not found");

        setMovie(data);
        setMovieVideos(data.Downloadurls || []);

        // Fetch comments
        fetchComments();

        if (data.tmdb_id) {
          try {
            const [vRes, iRes] = await Promise.all([
              axios.get(
                `https://api.themoviedb.org/3/movie/${data.tmdb_id}/videos`,
                { params: { api_key: TMDB_API_KEY } }
              ),
              axios.get(
                `https://api.themoviedb.org/3/movie/${data.tmdb_id}/images`,
                { params: { api_key: TMDB_API_KEY } }
              ),
            ]);

            const trailerUrls = Array.isArray(vRes.data?.results)
              ? vRes.data.results
                  .filter((v: any) => v.site === "YouTube" && v.key)
                  .map((v: any) => `https://www.youtube.com/embed/${v.key}`)
              : [];

            const imageUrls = Array.isArray(iRes.data?.backdrops)
              ? iRes.data.backdrops.map(
                  (b: any) => `https://image.tmdb.org/t/p/w500${b.file_path}`
                )
              : [];

            setTrailers(trailerUrls);
            setImages(imageUrls);
          } catch (tmdbErr: any) {
            console.warn("TMDB fetch failed:", tmdbErr.message);
            setTrailers([]);
            setImages([]);
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err.message);
        setMovie(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieData();
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    try {
      let localUserId: string | null = null;
      if (authUser?.email) {
        const { data: uData } = await supabase
          .from("users_filimehome")
          .select("id")
          .eq("email", authUser.email)
          .maybeSingle();
        localUserId = uData?.id || null;
      }

      const { data: rawComments, error } = await supabase
        .from("comments_filimehome")
        .select(`
          *,
          user:users_filimehome(display_name, avatar_url),
          likes:likes_filimehome(user_id)
        `)
        .eq("movie_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const processed = (rawComments || []).map((c: any) => ({
        ...c,
        likes_count: c.likes?.length || 0,
        user_has_liked: localUserId ? c.likes?.some((l: any) => l.user_id === localUserId) : false,
        replies: []
      }));

      const commentMap = new Map();
      processed.forEach(c => commentMap.set(c.id, c));
      
      const tree: UserComment[] = [];
      processed.forEach(c => {
        if (c.parent_id && commentMap.has(c.parent_id)) {
          commentMap.get(c.parent_id).replies.push(c);
        } else {
          tree.push(c);
        }
      });

      setComments(tree);
    } catch (err: any) {
      console.error("Comments fetch error:", err.message);
    }
  }, [id, authUser]);

  const findOrCreateUser = useCallback(async () => {
    const displayName = authUser?.name || guestName.trim();
    const email = authUser?.email || `guest_${guestName.toLowerCase().replace(/\s+/g, '_')}_${id}@filimehome.com`;

    const { data: userData } = await supabase
      .from("users_filimehome")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    
    if (userData) return userData.id;

    const { data: newUser, error: createError } = await supabase
      .from("users_filimehome")
      .insert([{ 
        display_name: displayName, 
        email: email,
        avatar_url: "" 
      }])
      .select()
      .single();
    
    if (createError) throw createError;
    return newUser.id;
  }, [authUser, guestName, id]);

  const handleCommentSubmit = useCallback(async (parentId: string | null = null, content: string) => {
    if (!content.trim() || !id) return;
    if (!authUser && !guestName.trim()) {
      toast.error("Please enter your name to comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = await findOrCreateUser();

      const { error } = await supabase
        .from("comments_filimehome")
        .insert([
          {
            movie_id: id,
            user_id: userId,
            parent_id: parentId,
            content: content.trim(),
          },
        ]);

      if (error) throw error;

      toast.success(parentId ? "Reply added!" : "Comment added!");
      if (!parentId) setNewComment("");
      fetchComments();
    } catch (err: any) {
      toast.error("Failed to post: " + err.message);
      throw err; // Re-throw to inform child component
    } finally {
      setIsSubmitting(false);
    }
  }, [id, authUser, guestName, findOrCreateUser, fetchComments]);

  const handleLike = useCallback(async (commentId: string) => {
    if (!authUser && !guestName.trim()) {
      toast.error("Please enter your name to like comments");
      return;
    }

    try {
      const userId = await findOrCreateUser();

      const { data: existingLike } = await supabase
        .from("likes_filimehome")
        .select("id")
        .eq("comment_id", commentId)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingLike) {
        await supabase
          .from("likes_filimehome")
          .delete()
          .eq("id", existingLike.id);
      } else {
        await supabase
          .from("likes_filimehome")
          .insert([{ comment_id: commentId, user_id: userId }]);
      }

      fetchComments();
    } catch (err: any) {
      console.error("Like error:", err.message);
    }
  }, [authUser, guestName, findOrCreateUser, fetchComments]);

  if (loading) {
    return (
      <div className="space-y-6 px-4 md:px-8">
        <div className="relative w-full h-60 bg-gray-700 animate-pulse rounded-md" />
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 animate-pulse">
          <div className="w-32 h-32 bg-gray-600 rounded-full md:translate-x-1/4 translate-y-[-50%]" />
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-gray-600 rounded w-1/2" />
            <div className="h-4 bg-gray-600 rounded w-1/4" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-48 bg-gray-700 rounded-md" />
          ))}
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="py-20 text-center text-gray-400">
        <p>Movie not found or an error occurred.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 md:px-8 mb-16">
      {showModal && (
        <WatchModal
          onClose={() => setShowModal(false)}
          poster={movie.image || movie.poster || images[0]}
          movieName={movie.title}
          videos={movieVideos}
          option={openMode}
          trailerUrl={trailers[0] || ""}
        />
      )}

      {/* Header */}
      <section className="relative">
        <div className="w-full h-60 rounded-md bg-gray-800 overflow-hidden shadow-md">
          {images[0] && (
            <img
              src={images[0]}
              alt="backdrop"
              className="w-full h-full object-cover rounded-md"
            />
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start -mt-16">
          <img
            src={movie.poster || movie.image || images[1] || ""}
            alt={movie.title}
            className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-gray-900 object-cover"
          />
          <div className="md:ml-6 mt-4 md:mt-0 text-center md:text-left flex-1">
            <h2 className="text-3xl font-bold text-white">{movie.title}</h2>
            <p className="text-gray-400 mt-1">
              {movieVideos.length} video{movieVideos.length !== 1 && "s"}
            </p>
          </div>

          <div className="flex md:flex-col gap-3 md:ml-auto mt-4 md:mt-0">
            <button
              onClick={() => open("watch")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
            >
              <FaPlay /> Watch Now
            </button>
            <button
              onClick={() => open("download")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl shadow-md transition"
            >
              <FaDownload /> Download Now
            </button>
          </div>
        </div>
      </section>

      {/* Details & Media */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Movie Info */}
        <section>
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
              Movie Info
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <FaFilm className="text-green-500" /> 
                <span className="text-gray-400 font-medium">Title:</span>
                <span className="text-white">{movie.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaGlobeAmericas className="text-green-500" />
                <span className="text-gray-400 font-medium">Country:</span>
                <span className="text-white">{movie.country || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaUser className="text-green-500" />
                <span className="text-gray-400 font-medium">Narrator:</span>
                <span className="text-white">{movie.narrator || "N/A"}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaVideo className="text-green-500" />
                <span className="text-gray-400 font-medium">Videos:</span>
                <span className="text-white">{movieVideos.length}</span>
              </div>
            </div>
          </div>

          {/* Trailer */}
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">
              Trailer
            </h3>
            {trailers[0] ? (
              <div className="relative pb-[56.25%] rounded-xl overflow-hidden shadow-inner mb-4">
                <iframe
                  className="absolute top-0 left-0 w-full h-full rounded-xl"
                  src={trailers[0]}
                  title="Movie Trailer"
                  allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <p className="text-gray-400">No trailer available</p>
            )}
            {trailers[0] && (
              <button
                onClick={() =>
                  window.open(trailers[0].replace("/embed/", "/watch?v="), "_blank")
                }
                className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition"
              >
                Watch Trailer
              </button>
            )}
          </div>

          {/* Description */}
          {movie.tmdb_overview && (
            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{movie.tmdb_overview}</p>
            </div>
          )}

          {/* Images */}
          {images.length > 0 && (
            <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 mb-6 hover:shadow-xl transition">
              <h3 className="text-xl font-semibold text-white mb-3">Images</h3>
              <div className="grid grid-cols-3 gap-2">
                {images.slice(0, 6).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Movie ${i + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Videos & Comments */}
        <section className="space-y-6">
          {/* Downloadable Videos */}
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 hover:shadow-xl transition">
            <h3 className="text-xl font-semibold text-white mb-4">Movie Videos</h3>
            {movieVideos.length > 0 ? (
              <ul className="space-y-3">
                {movieVideos.map((video, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between bg-gray-800 rounded-xl p-2 hover:bg-gray-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={movie.image || movie.poster || ""}
                        alt={`Video ${idx + 1}`}
                        className="w-16 h-10 object-cover rounded-md"
                      />
                      <span className="text-gray-300 font-medium">{video.title}</span>
                    </div>
                    <a
                      href={video.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-sm font-semibold text-green-500 hover:text-green-600 transition"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">No videos available</p>
            )}
          </div>

          {/* Comment Section */}
          <div className="bg-gray-900 rounded-2xl shadow-lg border border-gray-700 p-4 hover:shadow-xl transition flex flex-col min-h-[600px] h-fit">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FaComment className="text-green-500" /> Community
            </h3>

            {/* Main Comment Form */}
            <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(null, newComment); }} className="mb-8 space-y-3 bg-gray-800/20 p-4 rounded-xl border border-gray-800/50">
              {!authUser && (
                <div className="relative">
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-gray-800 text-white rounded-xl p-3 border border-gray-700 focus:border-green-500 outline-none transition text-sm shadow-inner"
                  />
                </div>
              )}
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full bg-gray-800 text-white rounded-xl p-3 pr-12 border border-gray-700 focus:border-green-500 outline-none resize-none transition h-24 text-sm shadow-inner"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim() || (!authUser && !guestName.trim())}
                  className="absolute bottom-3 right-3 p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white rounded-full transition shadow-lg group"
                >
                  <FaPaperPlane size={18} className={`${isSubmitting ? "animate-pulse" : "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"}`} />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar max-h-[600px]">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    authUser={authUser} 
                    guestName={guestName}
                    setGuestName={setGuestName}
                    onLike={handleLike} 
                    onReply={handleCommentSubmit} 
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 space-y-4">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                    <FaComment size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm">No comments yet. Start the conversation!</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default MovieDetails;
