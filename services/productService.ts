
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
 * Jointure avec 'products' pour afficher le nom du produit concerné.
 */
export const fetchLatestCommunityReviews = async (limit = 3): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, image_url)')
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
 * Récupère les produits ayant un avis pour la section "Avis Récents" (Ancienne version, conservée pour compatibilité)
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
 * Récupère un produit complet avec ses avis associés (table reviews).
 */
export const fetchFullProductData = async (identifier: string, isId: boolean = false): Promise<{ data: Product | null; error: any }> => {
  try {
    let query = supabase.from('products').select('*, reviews(*)');
    
    if (isId) {
      query = query.eq('id', identifier);
    } else {
      query = query.ilike('name', `%${identifier}%`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn("Erreur lors de la récupération avec jointure reviews, essai sans jointure...", error);
      const fallbackQuery = isId 
        ? supabase.from('products').select('*').eq('id', identifier)
        : supabase.from('products').select('*').ilike('name', `%${identifier}%`);
      
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
