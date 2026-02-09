
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
    console.error("Erreur fetchHomeProducts:", error);
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
      
      if (Array.isArray(p.review_text) && p.review_text.length > 0) {
        const first = p.review_text[0];
        extract = typeof first === 'string' ? first : (first.content || first.text || "");
      } else if (typeof p.review_text === 'string' && p.review_text.length > 5) {
        extract = p.review_text;
      } else if (p.review_text && typeof p.review_text === 'object') {
        extract = p.review_text.content || p.review_text.text || "";
      }

      if (extract && typeof extract === 'string' && extract.trim().length > 0) {
        processedReviews.push({
          id: `rev-home-${p.product_slug}`,
          author_name: "Expert Web",
          review_text: extract.length > 150 ? extract.substring(0, 147) + "..." : extract,
          rating: p.rating || 4.5,
          created_at: p.created_at,
          products: {
            name: p.name,
            image_url: p.image_url,
            category: p.category,
            product_slug: p.product_slug
          }
        });
      }
      
      if (processedReviews.length >= limit) break;
    }

    return processedReviews;
  } catch (error) {
    console.error("Erreur fetchLatestCommunityReviews:", error);
    return [];
  }
};

/**
 * Récupère les données d'un produit en utilisant le moteur de recherche robuste (Hybrid Search).
 * Correction de l'erreur PGRST200 en supprimant la jointure reviews(*) problématique.
 */
export const fetchFullProductData = async (
  slug: string, 
  type: 'id' | 'slug' | 'name' = 'slug',
  category?: string
): Promise<{ data: Product | null; error: any }> => {
  try {
    const cleanSlug = decodeURIComponent(slug).trim();
    // 1. نظف الـ slug باش نحيدو منه أي رموز ونرجعه كلمات للبحث بالسمية
    const searchName = cleanSlug.replace(/-/g, ' ');

    // استخدام select('*') فقط لتجنب مشاكل العلاقات (Relationships) المفقودة في Supabase
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .or(`product_slug.eq."${cleanSlug}",name.ilike."%${searchName}%",affiliate_link.ilike."%${cleanSlug}%"`)
      .maybeSingle();

    if (error) throw error;
    if (!data) return { data: null, error: "Produit non trouvé" };

    // تأمين البيانات ضد الـ NULL لمنع انهيار الواجهة
    const normalizedData: Product = {
      ...data,
      faq: Array.isArray(data.faq) ? data.faq : [],
      fiche_technique: Array.isArray(data.fiche_technique) ? data.fiche_technique : 
                       (Array.isArray(data.tech) ? data.tech : []),
      review_text: Array.isArray(data.review_text) ? data.review_text : [],
      points_forts: Array.isArray(data.points_forts) ? data.points_forts : [],
      points_faibles: Array.isArray(data.points_faibles) ? data.points_faibles : []
    };

    return { data: normalizedData, error: null };
    
  } catch (err: any) {
    console.error("Critical fetch error:", err);
    return { data: null, error: err.message };
  }
};
