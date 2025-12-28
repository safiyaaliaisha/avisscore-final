
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
  reviews?: Review[];
  analysis?: Analysis;
}

export interface ProductSummary {
  rating: number;
  sentiment: string;
  review_text: string[]; // Tableau de 4 chaînes
  cycle_de_vie: string[]; // Tableau de 4 chaînes
  points_forts: string[]; // Tableau de 4 chaînes
  points_faibles: string[]; // Tableau de 2 à 4 chaînes
  fiche_technique: string[]; // Tableau de 4 à 6 chaînes
  alternative: string;
  image_url: string;
  seo_title: string;
  seo_description: string;
}
