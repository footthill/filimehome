import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface Comment {
  name: string;
  text: string;
  movie_id: string;
  created_at: string;
}

const AddCommentForm = ({
  movieId,
  onAdd,
}: {
  movieId: string;
  onAdd: (comment: Comment) => void;
}) => {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX_COMMENT_LENGTH = 500;

  useEffect(() => {
    const savedName = localStorage.getItem("commenterName");
    if (savedName) {
      setName(savedName);
    } else {
      setEditingName(true);
    }
  }, []);

  useEffect(() => {
    if (!editingName && name.trim()) {
      localStorage.setItem("commenterName", name);
    } else if (!name.trim()) {
      setEditingName(true);
    }
  }, [name, editingName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) {
      setError("Name and comment are required.");
      return;
    }

    setIsSubmitting(true);
    const newComment: Comment = {
      name,
      text,
      movie_id: movieId,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("comments").insert([newComment]);
    setIsSubmitting(false);
    if (error) {
      setError("Failed to save comment. Please try again.");
      console.error(error);
      return;
    }

    onAdd(newComment); // Update parent
    setText("");
    setError(null);
  };

  const handleSaveName = () => {
    if (name.trim()) {
      setEditingName(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="card my-5 rounded-2xl border border-gray-700 bg-gray-900 shadow-md p-4"
    >
      <h2 className="text-lg font-semibold text-white mb-4">Add a Comment</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Your Name</label>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:border-yellow-500"
            placeholder="e.g. Alice"
            required
            disabled={!editingName}
          />
          {editingName ? (
            <button
              type="button"
              onClick={handleSaveName}
              className="text-sm text-yellow-400 hover:underline"
            >
              Save
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-sm text-yellow-400 hover:underline"
            >
              Change
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Your Comment</label>
        <textarea
          value={text}
          onChange={(e) =>
            e.target.value.length <= MAX_COMMENT_LENGTH && setText(e.target.value)
          }
          className="w-full px-3 py-2 rounded-md bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring focus:border-yellow-500"
          rows={3}
          placeholder="Write something..."
          required
        />
        <p className="text-sm text-gray-400">
          {text.length}/{MAX_COMMENT_LENGTH} characters
        </p>
      </div>

      <button
        type="submit"
        className="w-full py-2 rounded-md bg-yellow-500 text-black font-semibold hover:bg-yellow-600 transition disabled:opacity-50"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Posting..." : "Post Comment"}
      </button>
    </form>
  );
};

export default AddCommentForm;
