import { supabase } from "../lib/supabase";
import { getFromCache, saveToCache } from "../lib/cache";

type SupabaseQueryFn<T> = (client: typeof supabase) => Promise<{ data: T | null; error: any; count?: number }>;

export async function executeSupabaseQuery<T>(
  queryFn: SupabaseQueryFn<T>,
  cacheKey: string
): Promise<{ data: T | null; count?: number }> {
  try {
    const { data, error, count } = await queryFn(supabase);
    if (error) throw error;

    saveToCache(cacheKey, { data, count });
    return { data, count };
  } catch (err) {
    const fallback = getFromCache(cacheKey);
    if (fallback) {
      console.warn("Supabase error. Using cached fallback:", err);
      return fallback;
    }
    throw err;
  }
}

