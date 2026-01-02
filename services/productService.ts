
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
 * Jointure avec 'products' incluant le slug et la catégorie pour le routage.
 */
export const fetchLatestCommunityReviews = async (limit = 3): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, image_url, category, product_slug)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erreur fetchLatestCommunityReviews:", error);
    return [];
  }
};

/**
 * Récupère les produits ayant un avis pour la section "Avis Récents"
 */
export const fetchRecentReviews = async (limit = 3): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .not('review_text', 'is', null)
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erreur fetchRecentReviews:", error);
    return [];
  }
};

/**
 * Récupère un produit complet avec ses avis associés.
 * Supporte maintenant la recherche par ID, Nom ou Slug.
 */
export const fetchFullProductData = async (identifier: string, type: 'id' | 'slug' | 'name' = 'name'): Promise<{ data: Product | null; error: any }> => {
  try {
    let query = supabase.from('products').select('*, reviews(*)');
    
    if (type === 'id') {
      query = query.eq('id', identifier);
    } else if (type === 'slug') {
      query = query.eq('product_slug', identifier);
    } else {
      query = query.ilike('name', `%${identifier}%`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn("Erreur lors de la récupération avec jointure reviews, essai sans jointure...", error);
      let fallbackQuery = supabase.from('products').select('*');
      if (type === 'id') fallbackQuery = fallbackQuery.eq('id', identifier);
      else if (type === 'slug') fallbackQuery = fallbackQuery.eq('product_slug', identifier);
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
