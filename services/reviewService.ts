
import { supabase } from '../lib/supabaseClient';
import { Review, Product } from '../types';

/**
 * Fetches the latest reviews from the 'my_reviews' table.
 */
export const fetchLatestReviews = async (limit = 6): Promise<Review[]> => {
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE');

  if (isDemoMode) {
    return [
      { 
        id: 'mock-1', 
        product_name: 'Samsung Galaxy S25 Ultra', 
        rating: 4.9, 
        review_text: 'Le nouveau standard de l\'excellence Android. L\'écran est bluffant et l\'intégration de l\'IA Gemini Pro 1.5 en local est un bond en avant massif pour la productivité.', 
        author_name: 'Alex Rivard', 
        created_at: new Date().toISOString(), 
        source: 'Lab Tech',
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800'
      },
      { 
        id: 'mock-2', 
        product_name: 'iPhone 16 Pro Max', 
        rating: 4.8, 
        review_text: 'Apple peaufine sa recette avec un bouton de contrôle caméra révolutionnaire. La fluidité reste inégalée, même si l\'IA Apple Intelligence arrive progressivement.', 
        author_name: 'Sarah Chen', 
        created_at: new Date(Date.now() - 3600000).toISOString(), 
        source: 'Digital Daily',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800'
      },
      { 
        id: 'mock-3', 
        product_name: 'Google Pixel 9 Pro', 
        rating: 4.7, 
        review_text: 'Le roi de la photo assistée par IA. Les retouches magiques sont impressionnantes de réalisme. Un design enfin premium et distinctif.', 
        author_name: 'Marc Fontana', 
        created_at: new Date(Date.now() - 86400000).toISOString(), 
        source: 'Photo Mag',
        image_url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&q=80&w=800'
      },
      { 
        id: 'mock-4', 
        product_name: 'Xiaomi 15 Pro', 
        rating: 4.6, 
        review_text: 'Une bête de puissance avec le dernier Snapdragon. La charge 120W est toujours un bonheur au quotidien. Rapport qualité/prix imbattable.', 
        author_name: 'Léa Kim', 
        created_at: new Date(Date.now() - 172800000).toISOString(), 
        source: 'Mobile Hub',
        image_url: 'https://images.unsplash.com/photo-1592890288564-76628a30a657?auto=format&fit=crop&q=80&w=800'
      }
    ];
  }

  const { data, error } = await supabase
    .from('my_reviews')
    .select('id, product_name, rating, review_text, author_name, created_at, source, image_url')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching from 'my_reviews':", error);
    throw error;
  }
  return data || [];
};

/**
 * Fetches unique product names from my_reviews for comparison selectors.
 */
export const fetchUniqueProducts = async (): Promise<string[]> => {
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE');

  if (isDemoMode) {
    return ['Samsung Galaxy S25 Ultra', 'iPhone 16 Pro Max', 'Google Pixel 9 Pro', 'Xiaomi 15 Pro'];
  }

  const { data, error } = await supabase
    .from('my_reviews')
    .select('product_name');

  if (error) throw error;
  const names = data.map(d => d.product_name).filter(Boolean) as string[];
  return Array.from(new Set(names));
};

/**
 * Fetches a product by name.
 */
export const fetchProductByName = async (name: string): Promise<Product | null> => {
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                     process.env.NEXT_PUBLIC_SUPABASE_URL.includes('YOUR_SUPABASE');

  if (isDemoMode) {
    const term = name.toLowerCase();
    if (term.includes('s25') || term.includes('samsung')) {
      return {
        id: 'p1',
        name: 'Samsung Galaxy S25 Ultra',
        description: 'Le fleuron technologique de Samsung avec Snapdragon 8 Gen 4, écran 6.8" Dynamic AMOLED 2X et système photo 200MP.',
        price: 1449,
        category: 'Smartphone',
        image_url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&q=80&w=800',
        specs: { battery: '5000 mAh', camera: '200MP + 50MP + 12MP', screen: '6.8" QHD+', processor: 'SD 8 Gen 4' }
      };
    }
    if (term.includes('16') || term.includes('iphone')) {
      return {
        id: 'p2',
        name: 'iPhone 16 Pro Max',
        description: 'L\'expérience ultime d\'Apple avec le titane Grade 5, la puce A18 Pro et une autonomie record.',
        price: 1479,
        category: 'Smartphone',
        image_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=800',
        specs: { battery: '4676 mAh', camera: '48MP Pro System', screen: '6.9" ProMotion', processor: 'A18 Pro' }
      };
    }
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${name}%`)
    .maybeSingle();

  if (error) throw error;
  return data;
};
