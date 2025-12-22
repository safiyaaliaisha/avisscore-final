
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export const fetchProductByNameWithReviews = async (name: string): Promise<{ data: Product | null; error: any }> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return getMockProduct(name);
  }

  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      reviews (
        *
      )
    `)
    .ilike('name', name)
    .maybeSingle();

  return { data, error };
};

const getMockProduct = async (name: string): Promise<{ data: Product | null; error: any }> => {
  await new Promise(r => setTimeout(r, 600));

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Écran UltraLarge Série Pro',
      description: 'Une clarté exceptionnelle alliée à un design minimaliste. Conçu pour les professionnels exigeants en quête de précision chromatique.',
      price: 1249.00,
      category: 'Informatique',
      image_url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=1200',
      created_at: new Date().toISOString(),
      reviews: [
        // Changed content to review_text to match Review interface
        { id: 'r1', product_id: '1', rating: 5, review_text: 'Une dalle magnifique. Idéal pour le montage vidéo et la retouche photo.', author_name: 'Marc Lefebvre', created_at: '2023-12-01', source: 'Fnac' },
        { id: 'r2', product_id: '1', rating: 4, review_text: 'Très bon produit, mais attention à la connectivité sur Mac.', author_name: 'Sophie Dubois', created_at: '2023-12-05', source: 'Amazon' },
        { id: 'r3', product_id: '1', rating: 5, review_text: 'Le summum du confort visuel. Livraison impeccable.', author_name: 'Jean-Pierre', created_at: '2023-12-10', source: 'Boulanger' },
        { id: 'r4', product_id: '1', rating: 4, review_text: 'Design épuré qui s\'intègre parfaitement dans mon bureau.', author_name: 'Claire V.', created_at: '2023-12-12', source: 'Rakuten' }
      ]
    },
    {
      id: '2',
      name: 'Casque Audio Signature ANC',
      description: 'L\'immersion sonore absolue. Une réduction de bruit active de pointe combinée à des matériaux nobles pour un confort durable.',
      price: 399.00,
      category: 'Audio',
      image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1200',
      created_at: new Date().toISOString(),
      reviews: [
        // Changed content to review_text to match Review interface
        { id: 'r4', product_id: '2', rating: 5, review_text: 'Le silence est d\'or. Un rendu sonore cristallin.', author_name: 'Thomas R.', created_at: '2023-11-12', source: 'Fnac' },
        { id: 'r5', product_id: '2', rating: 3, review_text: 'Bon son mais un peu lourd lors de longues sessions.', author_name: 'Marie-Laure', created_at: '2023-11-15', source: 'Darty' },
        { id: 'r6', product_id: '2', rating: 5, review_text: 'L\'autonomie est impressionnante. Je recommande vivement.', author_name: 'Julien B.', created_at: '2023-11-20', source: 'Amazon' }
      ]
    }
  ];

  const found = mockProducts.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
  return { data: found || null, error: null };
};
