
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

export interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price?: number;
  category?: string;
  created_at?: string;
  // Nouveaux champs intégrés dans la table products
  rating?: number;
  review_text?: string;
  points_forts?: string[];
  points_faibles?: string[];
  fiche_technique?: string[];
  score?: number;
  reviews?: Review[];
  analysis?: Analysis;
}

export interface ProductSummary {
  rating: number;
  sentiment: string;
  review_text: string[];
  cycle_de_vie: string[];
  points_forts: string[];
  points_faibles: string[];
  fiche_technique: string[];
  alternative: string;
  image_url: string;
  seo_title: string;
  seo_description: string;
}
