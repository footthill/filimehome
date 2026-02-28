import { create } from 'zustand';
import { supabase } from '../lib/supabase';

type NarratorData = {
  id: string;
  name: string;
  avatar: string;
  total_movies: number;
};

interface NarratorStore {
  narrators: NarratorData[];
  loading: boolean;
  error: string | null;
  fetchNarrators: () => Promise<void>;
}

export const useNarratorStore = create <NarratorStore>((set) => ({
  narrators: [],
  loading: false,
  error: null,

  fetchNarrators: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.rpc("get_narrators_with_movie_count");

      if (error) {
        set({ error: error.message, loading: false });
        console.error("Failed to fetch narrators:", error);
        return;
      }

      set({ narrators: data || [], loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
      console.error("Unexpected error fetching narrators:", e);
    }
  },
}));
