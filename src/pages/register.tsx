import { useState } from "react";
import { supabase } from "../lib/supabase";
import { FaCheckCircle, FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import { Link } from "react-router-dom";

const AppRegister = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!form.name || !form.email || !form.phone) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("appusers").insert([
      {
        name: form.name,
        email: form.email,
        phone: form.phone,
      },
    ]);

    if (error) {
      setError("Something went wrong. Please try again.");
      console.error(error);
    } else {
      setSubmitted(true);
    }

    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white text-center px-4">
      <div className="max-w-md w-full space-y-6">
        {submitted ? (
          <div className="text-center">
            <FaCheckCircle className="text-green-400 text-5xl mb-4 mx-auto" />
            <h2 className="text-2xl font-semibold">You're on the list!</h2>
            <p className="text-white/70 mt-2">
              We'll notify you as soon as the app is ready.
            </p>
          </div>
        ) : (
          <>
          <div className="flex">
            <div className="h-full flex items-center">
              <Link to="/" className="underline hover:text-yellow-400 p-3 "> <FaArrowLeft/></Link>
            </div>
            <h1 className="text-3xl font-bold">  Be First to Know</h1>
          </div>
            <p className="text-white/70">
              Register now and we’ll notify you when the app launches.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div className="flex items-center bg-white/10 rounded px-4 py-2">
                <FaUser className="mr-2 text-white/60" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="bg-transparent w-full focus:outline-none text-white"
                />
              </div>

              {/* Email */}
              <div className="flex items-center bg-white/10 rounded px-4 py-2">
                <FaEnvelope className="mr-2 text-white/60" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your email"
                  className="bg-transparent w-full focus:outline-none text-white"
                />
              </div>

              {/* Phone */}
              <div className="flex items-center bg-white/10 rounded px-4 py-2">
                <FaPhone className="mr-2 text-white/60" />
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Your phone number"
                  className="bg-transparent w-full focus:outline-none text-white"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold transition"
              >
                {loading ? "Submitting..." : "Notify Me"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AppRegister;
