
import { supabase } from '../lib/supabaseClient';
import { Product, Review } from '../types';

/**
 * Récupère les derniers produits pour la page d'accueil
 */
export const fetchHomeProducts = async (limit = 4): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erreur fetchHomeProducts:", error);
    return [];
  }
};

/**
 * Récupère les derniers avis réels de la communauté (table reviews)
 * Fallback : Si aucune donnée dans 'reviews', récupère les verdicts experts de la table 'products'.
 */
export const fetchLatestCommunityReviews = async (limit = 3): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, image_url, category, product_slug)')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Si la table reviews est vide ou erreur de jointure, on utilise les reviews intégrées aux produits
    if (error || !data || data.length === 0) {
      const { data: prodData } = await supabase
        .from('products')
        .select('name, image_url, category, product_slug, review_text, created_at, score, rating')
        .not('review_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (prodData && prodData.length > 0) {
        return prodData.map((p, i) => ({
          id: `expert-rev-${i}`,
          author_name: "Verdict Expert",
          review_text: p.review_text,
          rating: p.score || p.rating || 5,
          created_at: p.created_at || new Date().toISOString(),
          products: {
            name: p.name,
            image_url: p.image_url,
            category: p.category,
            product_slug: p.product_slug
          }
        }));
      }
      return [];
    }
    
    return data;
  } catch (error) {
    console.error("Erreur fetchLatestCommunityReviews:", error);
    return [];
  }
};

/**
 * Récupère un produit complet avec ses avis associés.
 * Recherche exacte et insensible à la casse sur product_slug.
 */
export const fetchFullProductData = async (
  identifier: string, 
  type: 'id' | 'slug' | 'name' = 'name',
  category?: string
): Promise<{ data: Product | null; error: any }> => {
  try {
    let query = supabase.from('products').select('*, reviews(*)');
    
    if (type === 'id') {
      query = query.eq('id', identifier);
    } else if (type === 'slug') {
      query = query.ilike('product_slug', identifier);
      if (category) {
        query = query.ilike('category', category);
      }
    } else {
      query = query.ilike('name', `%${identifier}%`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      let fallbackQuery = supabase.from('products').select('*');
      if (type === 'id') fallbackQuery = fallbackQuery.eq('id', identifier);
      else if (type === 'slug') fallbackQuery = fallbackQuery.ilike('product_slug', identifier);
      else fallbackQuery = fallbackQuery.ilike('name', `%${identifier}%`);
      
      const { data: fbData, error: fbError } = await fallbackQuery.maybeSingle();
      if (fbError || !fbData) return { data: null, error: fbError || 'Produit non trouvé' };
      return { data: fbData, error: null };
    }

    return { data, error: null };
  } catch (err) {
    console.error("Erreur critique fetchFullProductData:", err);
    return { data: null, error: err };
  }
};
