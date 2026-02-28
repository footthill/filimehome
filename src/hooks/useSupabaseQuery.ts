import { useQuery } from "@tanstack/react-query";
import { executeSupabaseQuery } from "../services/executeSupabaseQuery";
import { supabase } from "../lib/supabase";

export const useSupabaseQuery = <T>(
    cacheKey: string,
    queryFn: (client: typeof supabase) => Promise<{ data: T | null; error: any; count?: number }>
  ) => {
    return useQuery({
      queryKey: [cacheKey],
      queryFn: () => executeSupabaseQuery<T>(queryFn, cacheKey),
      staleTime: 1000 * 60 * 5,
      retry: 2,
    });
  };
