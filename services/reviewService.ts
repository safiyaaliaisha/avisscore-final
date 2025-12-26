import { supabase } from '../lib/supabaseClient';
import { Review } from '../types';

/**
 * Fetches the latest reviews directly from Supabase with selective columns for speed.
 */
export const fetchLatestReviews = async (limit = 12): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('id, product_name, rating, image_url, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase Error (fetchLatestReviews):", error);
    return [];
  }
  return data || [];
};

/**
 * Fetches unique product names for comparison, limited to reduce data transfer.
 */
export const fetchUniqueProducts = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('product_name')
    .limit(500); // Optimization: Fetch a reasonable amount to keep it fast

  if (error) {
    console.error("Supabase Error (fetchUniqueProducts):", error);
    return [];
  }
  
  // Fixed: explicitly type the map input and result to avoid 'unknown' errors
  const names: string[] = ((data as any[]) || [])
    .map(d => d.product_name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0);
    
  return Array.from(new Set(names)).sort();
};

/**
 * Fetches product data and its reviews from 'my_reviews' table by product name.
 * Uses selective columns for faster fetching.
 */
export const fetchProductDataFromReviews = async (name: string): Promise<{ reviews: Review[], firstMatch: Review | null }> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('id, product_name, rating, review_text, author_name, created_at, source, image_url')
    .ilike('product_name', `%${name}%`)
    .limit(20); // Optimization: Limit total reviews per product to keep UI snappy

  if (error) {
    console.error("Supabase Error (fetchProductDataFromReviews):", error);
    return { reviews: [], firstMatch: null };
  }
  
  return { 
    reviews: data || [], 
    firstMatch: data && data.length > 0 ? data[0] : null 
  };
}
