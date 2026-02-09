
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export const fetchHomeProducts = async (limit = 100): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as Product[]) || [];
  } catch (error) {
    return [];
  }
};

export const fetchLatestCommunityReviews = async (limit = 4): Promise<any[]> => {
  try {
    const { data: prodData, error } = await supabase
      .from('products')
      .select('name, image_url, category, product_slug, review_text, rating, created_at')
      .not('review_text', 'is', null)
      .order('created_at', { ascending: false });

    if (error || !prodData) return [];

    const processedReviews = [];
    for (const p of prodData) {
      let extract = "";
      const raw = p.review_text;
      
      if (Array.isArray(raw) && raw.length > 0) {
        const first = raw[0];
        extract = typeof first === 'string' ? first : (first.content || first.text || JSON.stringify(first));
      } else if (typeof raw === 'string') {
        extract = raw;
      }

      if (extract && extract.trim().length > 10) {
        processedReviews.push({
          id: `rev-home-${p.product_slug}`,
          review_text: extract.length > 180 ? extract.substring(0, 177) + "..." : extract,
          rating: p.rating || 4.5,
          created_at: p.created_at,
          products: p
        });
      }
      if (processedReviews.length >= limit) break;
    }
    return processedReviews;
  } catch (error) {
    return [];
  }
};

// Fixed fetchFullProductData: updated signature to accept target, type, and category 
// to resolve the "Expected 1 arguments, but got 3" error in App.tsx.
export const fetchFullProductData = async (
  target: string, 
  type: 'id' | 'slug' | 'name' = 'slug', 
  category?: string
): Promise<{ data: Product | null; error: any }> => {
  try {
    const cleanTarget = decodeURIComponent(target).trim();
    let query = supabase.from('products').select('*');

    // Build query based on type
    if (type === 'id') {
      query = query.eq('id', cleanTarget);
    } else if (type === 'slug') {
      query = query.eq('product_slug', cleanTarget);
    } else {
      query = query.ilike('name', `%${cleanTarget.replace(/-/g, ' ')}%`);
    }

    // Filter by category if provided
    if (category) {
      query = query.ilike('category', category);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (data) return { data, error: null };

    // Fallback: search by name if ID or Slug search failed
    if (type !== 'name') {
      const searchName = cleanTarget.replace(/-/g, ' ');
      const { data: fallback } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${searchName}%`)
        .limit(1)
        .maybeSingle();

      return { data: fallback || null, error: fallback ? null : "Non trouvé" };
    }

    return { data: null, error: "Non trouvé" };
  } catch (err: any) {
    return { data: null, error: err.message };
  }
};
