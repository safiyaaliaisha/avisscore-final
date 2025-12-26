
import { supabase } from '../lib/supabaseClient';
import { Review } from '../types';

/**
 * جلب أحدث المراجعات مع معالجة الأخطاء لضمان استقرار التطبيق.
 */
export const fetchLatestReviews = async (limit = 12): Promise<Review[]> => {
  try {
    const { data, error } = await supabase
      .from('my_reviews')
      .select('id, product_name, rating, image_url, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Supabase Error (fetchLatestReviews):", error);
      return [];
    }
    
    // Ajout d'un nom d'auteur par défaut car la colonne n'existe pas en DB
    return ((data as any[]) || []).map(r => ({
      ...r,
      author_name: "Utilisateur vérifié"
    })) as Review[];
  } catch (err) {
    console.error("Critical failure in fetchLatestReviews:", err);
    return [];
  }
};

/**
 * جلب أسماء المنتجات الفريدة مع الحماية من الأخطاء.
 */
export const fetchUniqueProducts = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('my_reviews')
      .select('product_name')
      .limit(500); 

    if (error) {
      console.error("Supabase Error (fetchUniqueProducts):", error);
      return [];
    }
    
    const names: string[] = ((data as any[]) || [])
      .map(d => d.product_name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
      
    return Array.from(new Set(names)).sort();
  } catch (err) {
    console.error("Critical failure in fetchUniqueProducts:", err);
    return [];
  }
};

/**
 * جلب بيانات المنتج ومراجعاته من جدول 'my_reviews' مع الحماية القصوى من أخطاء الـ API.
 * تم حذف author_name من الاستعلام لتجنب خطأ 400.
 */
export const fetchProductDataFromReviews = async (name: string): Promise<{ reviews: Review[], firstMatch: Review | null }> => {
  try {
    const { data, error } = await supabase
      .from('my_reviews')
      .select('id, product_name, rating, review_text, created_at, source, image_url')
      .ilike('product_name', `%${name}%`)
      .limit(10); 

    if (error) {
      console.error("Supabase Error (fetchProductDataFromReviews):", error);
      return { reviews: [], firstMatch: null };
    }

    // Mapping pour injecter un nom d'auteur par défaut et éviter les erreurs UI
    const reviewsWithFallback = ((data as any[]) || []).map(r => ({
      ...r,
      author_name: "Avis vérifié"
    })) as Review[];
    
    return { 
      reviews: reviewsWithFallback, 
      firstMatch: reviewsWithFallback.length > 0 ? reviewsWithFallback[0] : null 
    };
  } catch (err) {
    console.error("Critical failure in fetchProductDataFromReviews:", err);
    return { reviews: [], firstMatch: null };
  }
}
