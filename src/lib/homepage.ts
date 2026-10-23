import { supabase } from './supabase';

const TABLE = 'homepage_config';

export async function fetchHomepageConfig() {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .in('section', ['hero', 'trending']);
  if (error) throw error;
  const result = { hero: [], trending: [] };
  (data || []).forEach((row: any) => {
    if (row.section === 'hero') result.hero = Array.isArray(row.order) ? row.order : [];
    if (row.section === 'trending') result.trending = Array.isArray(row.order) ? row.order : [];
  });
  return result;
}

export default { fetchHomepageConfig };
