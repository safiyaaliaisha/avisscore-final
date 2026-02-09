
export interface Review {
  id: string;
  product_id: string;
  rating: number;
  review_text: string;
  author_name: string;
  created_at: string;
  source?: string;
}

export interface FAQItem {
  question?: string;
  answer?: string;
  q?: string;
  a?: string;
}

export interface Deal {
  id: string;
  title: string;
  current_price: number;
  reference_price: number;
  discount: number;
  link: string;
  image_url: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string | string[];
  current_price?: number;
  reference_price?: number;
  affiliate_link?: string;
  category?: string;
  product_slug?: string;
  created_at?: string;
  rating?: number;
  // review_text est maintenant un JSONB contenant une liste de chaînes (témoignages)
  review_text?: string[] | any; 
  reviews_txt?: string; // Ancien champ, conservé pour compatibilité si besoin
  points_forts?: string[];
  points_faibles?: string[];
  fiche_technique?: string[] | any;
  faq?: FAQItem[] | any;
  verdict_technique?: string; 
  alternative?: string; 
  score?: number;
  reviews?: Review[];
  fnac_price?: number;
  darty_price?: number;
  amazon_price?: number;
  boulanger_price?: number;
  seo_title?: string;
  seo_description?: string;
}

export interface ProductSummary {
  rating: number; 
  sentiment: string;
  review_text: string[];
  verdict_technique: string;
  points_forts: string[];
  points_faibles: string[];
  fiche_technique: string[];
  alternatives: string[]; 
  design_analysis: string; 
  seo_title: string;
  seo_description: string;
  score_opportunite: string; 
  verdict: 'ACHETER' | 'ATTENDRE' | 'EXTRÊME URGENCE';
  economie: string; 
}
