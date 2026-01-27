
export interface Review {
  id: string;
  product_id: string;
  rating: number;
  review_text: string;
  author_name: string;
  created_at: string;
  source?: string;
}

export interface Analysis {
  id: string;
  product_id: string;
  score: number;
  description: string;
  points_forts: string[];
  points_faibles: string[];
  conseil_achat?: string;
  duree_vie_estimee?: number;
  version_precedente?: string;
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
  price?: number;
  current_price?: number;
  reference_price?: number;
  affiliate_link?: string;
  category?: string;
  product_slug?: string;
  created_at?: string;
  rating?: number;
  review_text?: string;
  points_forts?: string[];
  points_faibles?: string[];
  fiche_technique?: string[];
  cycle_de_vie?: string[];
  alternative?: string; 
  score?: number;
  reviews?: Review[];
  analysis?: Analysis;
  faq?: FAQItem[] | string | null;
  // Merchants Reviews
  fnac_rev?: string;
  darty_rev?: string;
  boulanger_rev?: string;
  rakuten_rev?: string;
  amazon_rev?: string;
  // Merchants Prices
  fnac_price?: number;
  darty_price?: number;
  amazon_price?: number;
  boulanger_price?: number;
  // SEO & External
  seo_title?: string;
  seo_description?: string;
  external_rating?: number;
  external_review_count?: number;
}

export interface ProductSummary {
  rating: number; 
  sentiment: string;
  review_text: string[];
  cycle_de_vie: string[];
  points_forts: string[];
  points_faibles: string[];
  fiche_technique: string[];
  alternatives: string[]; 
  design_analysis: string; 
  image_url: string;
  seo_title: string;
  seo_description: string;
}
