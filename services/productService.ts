
import { supabase } from '../lib/supabaseClient';
import { Product, Deal } from '../types';

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
    return (data as Product[]) || [];
  } catch (error) {
    console.error("Erreur fetchHomeProducts:", error);
    return [];
  }
};

/**
 * Récupère les bons plans (deals) depuis la table deals.
 */
export const fetchDeals = async (limit = 4): Promise<Deal[]> => {
  try {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as Deal[]) || [];
  } catch (error) {
    console.error("Erreur fetchDeals:", error);
    return [];
  }
};

/**
 * Récupère les derniers avis réels depuis la base de données.
 */
export const fetchLatestCommunityReviews = async (limit = 4): Promise<any[]> => {
  try {
    const { data: prodData, error } = await supabase
      .from('products')
      .select('name, image_url, category, product_slug, fnac_rev, darty_rev, rating, created_at')
      .or('fnac_rev.neq.null,darty_rev.neq.null')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !prodData || prodData.length === 0) {
      return [];
    }

    return prodData.map((p, i) => {
      const rawText = p.fnac_rev || p.darty_rev || "";
      const extract = rawText.length > 160 ? rawText.substring(0, 157) + "..." : rawText;

      return {
        id: `recent-product-rev-${i}`,
        author_name: "Acheteur vérifié",
        review_text: extract,
        rating: p.rating || 4,
        created_at: p.created_at || new Date().toISOString(),
        products: {
          name: p.name,
          image_url: p.image_url,
          category: p.category,
          product_slug: p.product_slug
        }
      };
    });
  } catch (error) {
    console.error("Erreur fetchLatestCommunityReviews:", error);
    return [];
  }
};

/**
 * Récupère un produit complet avec ses avis associés et explicitement la colonne faq.
 */
export const fetchFullProductData = async (
  identifier: string, 
  type: 'id' | 'slug' | 'name' = 'name',
  category?: string
): Promise<{ data: Product | null; error: any }> => {
  try {
    let query = supabase.from('products').select('*, reviews(*), faq');
    
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
      let fallbackQuery = supabase.from('products').select('*, faq');
      if (type === 'id') fallbackQuery = fallbackQuery.eq('id', identifier);
      else if (type === 'slug') fallbackQuery = fallbackQuery.ilike('product_slug', identifier);
      else fallbackQuery = fallbackQuery.ilike('name', `%${identifier}%`);
      
      const { data: fbData, error: fbError } = await fallbackQuery.maybeSingle();
      if (fbError || !fbData) return { data: null, error: fbError?.message || 'Produit non trouvé' };
      return { data: fbData as Product, error: null };
    }

    return { data: data as Product, error: null };
  } catch (err: any) {
    console.error("Erreur critique fetchFullProductData:", err);
    return { data: null, error: err?.message || 'An unexpected error occurred' };
  }
};