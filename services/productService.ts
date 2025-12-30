
import { supabase } from '../lib/supabaseClient';
import { Product, Review } from '../types';

/**
 * Récupère les derniers produits pour la page d'accueil
 */
export const fetchHomeProducts = async (limit = 4): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erreur fetchHomeProducts:", error);
    return [];
  }
  return data || [];
};

/**
 * Récupère les produits ayant un avis pour la section "Avis Récents"
 */
export const fetchRecentReviews = async (limit = 3): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .not('review_text', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erreur fetchRecentReviews:", error);
    return [];
  }
  return data || [];
};

/**
 * Récupère un produit complet depuis la table unique 'products'.
 */
export const fetchFullProductData = async (identifier: string, isId: boolean = false): Promise<{ data: Product | null; error: any }> => {
  try {
    let productQuery = supabase.from('products').select('*');
    if (isId) {
      productQuery = productQuery.eq('id', identifier);
    } else {
      productQuery = productQuery.ilike('name', `%${identifier}%`);
    }

    const { data: products, error: pError } = await productQuery.limit(1);

    if (pError || !products || products.length === 0) {
      return { data: null, error: pError || 'Produit non trouvé' };
    }

    return { 
      data: products[0], 
      error: null 
    };
  } catch (err) {
    console.error("Erreur critique fetchFullProductData:", err);
    return { data: null, error: err };
  }
};
