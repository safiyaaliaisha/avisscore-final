
import { supabase } from '../lib/supabaseClient';
import { Product, Analysis, Review } from '../types';

/**
 * Récupère les derniers produits pour la page d'accueil
 */
export const fetchHomeProducts = async (limit = 12): Promise<Product[]> => {
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
 * Parse sécurisé pour les colonnes JSON qui pourraient arriver en string ou null
 */
const safeParseArray = (val: any): string[] => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return val.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
};

/**
 * Récupère un produit complet de manière ultra-sécurisée.
 */
export const fetchFullProductData = async (identifier: string, isId: boolean = false): Promise<{ data: Product | null; error: any }> => {
  try {
    // 1. Récupération du produit de base
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

    const product = products[0];

    // 2. Récupération de l'analyse avec parsing sécurisé
    let analysisData: Analysis | undefined = undefined;
    try {
      const { data: analysis } = await supabase
        .from('analysis')
        .select('*')
        .eq('product_id', product.id)
        .maybeSingle();
      
      if (analysis) {
        analysisData = {
          ...analysis,
          points_forts: safeParseArray(analysis.points_forts),
          points_faibles: safeParseArray(analysis.points_faibles)
        };
      }
    } catch (aErr) {
      console.warn("Erreur analyse (non-fatale):", aErr);
    }

    // 3. Récupération des avis
    let reviewsData: Review[] = [];
    try {
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false });
      
      reviewsData = reviews || [];
    } catch (rErr) {
      console.warn("Erreur avis (non-fatale):", rErr);
    }

    return { 
      data: { 
        ...product, 
        analysis: analysisData, 
        reviews: reviewsData 
      }, 
      error: null 
    };
  } catch (err) {
    console.error("Erreur critique fetchFullProductData:", err);
    return { data: null, error: err };
  }
};

export const fetchAllProductNames = async (): Promise<string[]> => {
  const { data } = await supabase.from('products').select('name');
  return data?.map(p => p.name) || [];
};
