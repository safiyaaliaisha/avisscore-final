import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export const fetchProductByNameWithReviews = async (name: string): Promise<{ data: Product | null; error: any }> => {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      reviews (
        *
      )
    `)
    .ilike('name', name)
    .maybeSingle();

  return { data, error };
};
