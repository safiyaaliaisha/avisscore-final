
export interface Review {
  id: string;
  product_id?: string;
  product_name?: string;
  rating: number;
  review_text: string;
  author_name: string;
  created_at: string;
  source?: string;
  image_url?: string; // Added for feed display
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  created_at?: string;
  specs?: {
    battery?: string;
    camera?: string;
    screen?: string;
    processor?: string;
  };
  reviews?: Review[];
}

export interface AIAnalysis {
  verdict: string;
  pros: string[];
  cons: string[];
  score: number;
}

export interface ComparisonData {
  summary: string;
  winner: string;
  criteria: {
    label: string;
    productA: string;
    productB: string;
  }[];
}

export interface ProductSummary {
  sentiment: string;
  summary: string;
  pros: string[];
  cons: string[];
}
