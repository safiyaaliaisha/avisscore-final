
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
 * Fallback : Si aucune donnée dans 'reviews', récupère les avis marchands (Rakuten, Fnac, etc.) 
 * directement depuis la table 'products'.
 */
export const fetchLatestCommunityReviews = async (limit = 3): Promise<any[]> => {
  try {
    // 1. Tentative de récupération des avis utilisateurs réels de la table dédiée
    const { data, error } = await supabase
      .from('reviews')
      .select('*, products(name, image_url, category, product_slug)')
      .order('created_at', { ascending: false })
      .limit(limit);

    // 2. Fallback intelligent : Si pas d'avis communautaires, on extrait les avis marchands des produits
    if (error || !data || data.length === 0) {
      // On cherche des produits qui ont au moins un avis marchand (Rakuten en priorité)
      const { data: prodData } = await supabase
        .from('products')
        .select('name, image_url, category, product_slug, rakuten_rev, fnac_rev, darty_rev, review_text, created_at, score, rating')
        .or('rakuten_rev.neq.null,fnac_rev.neq.null,review_text.neq.null')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (prodData && prodData.length > 0) {
        return prodData.map((p, i) => {
          // Choix de la source de l'avis : Priorité Rakuten selon la demande
          let source = "Expert Avisscore";
          let reviewText = p.review_text || "";
          let author = "Verdict Expert";

          if (p.rakuten_rev) {
            reviewText = p.rakuten_rev;
            source = "Rakuten";
            author = "Client Rakuten";
          } else if (p.fnac_rev) {
            reviewText = p.fnac_rev;
            source = "Fnac";
            author = "Client Fnac";
          }

          return {
            id: `merchant-rev-${i}`,
            author_name: author,
            review_text: reviewText,
            rating: p.score || p.rating || 4,
            created_at: p.created_at || new Date().toISOString(),
            source: source,
            products: {
              name: p.name,
              image_url: p.image_url,
              category: p.category,
              product_slug: p.product_slug
            }
          };
        });
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
