
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
 * Récupère un produit complet avec ses avis associés.
 * Recherche exacte et insensible à la casse sur product_slug.
 */
export const fetchFullProductData = async (
  identifier: string, 
  type: 'id' | 'slug' | 'name' = 'name',
  category?: string
): Promise<{ data: Product | null; error: any }> => {
  try {
    // On cible explicitement la table public.products
    let query = supabase.from('products').select('*, reviews(*)');
    
    if (type === 'id') {
      query = query.eq('id', identifier);
    } else if (type === 'slug') {
      // Utilisation de ilike pour une correspondance exacte mais insensible à la casse
      query = query.ilike('product_slug', identifier);
      if (category) {
        query = query.ilike('category', category);
      }
    } else {
      query = query.ilike('name', `%${identifier}%`);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn("Erreur fetch logic, tentative fallback...", error);
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
