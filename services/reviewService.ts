
import { supabase } from '../lib/supabaseClient';
import { Review, Product } from '../types';

/**
 * Fetches the latest reviews directly from Supabase.
 */
export const fetchLatestReviews = async (limit = 12): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Supabase Error (fetchLatestReviews):", error);
    return [];
  }
  return data || [];
};

/**
 * Fetches unique product names for the comparison dropdowns.
 */
export const fetchUniqueProducts = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('product_name');

  if (error) {
    console.error("Supabase Error (fetchUniqueProducts):", error);
    return [];
  }
  
  const names = data
    ?.map(d => d.product_name)
    .filter((name): name is string => typeof name === 'string' && name.length > 0) || [];
    
  return Array.from(new Set(names));
};

/**
 * Fetches product data and its reviews from 'my_reviews' table by product name.
 */
export const fetchProductDataFromReviews = async (name: string): Promise<{ reviews: Review[], firstMatch: Review | null }> => {
  const { data, error } = await supabase
    .from('my_reviews')
    .select('*')
    .ilike('product_name', `%${name}%`);

  if (error) {
    console.error("Supabase Error (fetchProductDataFromReviews):", error);
    return { reviews: [], firstMatch: null };
  }
  
  return { 
    reviews: data || [], 
    firstMatch: data && data.length > 0 ? data[0] : null 
  };
};
