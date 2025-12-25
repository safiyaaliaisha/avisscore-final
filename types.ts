
export interface Review {
  id?: string | null;
  product_id?: string | null;
  product_name?: string | null;
  rating?: number | null;
  review_text?: string | null;
  author_name?: string | null;
  created_at?: string | null;
  source?: string | null;
  image_url?: string | null;
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
  description: string;
  verdict?: string;
  punchyVerdict?: string;
  pros: string[];
  cons: string[];
  score: number;
  sourceScores?: { site: string; score: number }[];
  totalReviews?: number;
  buyingWindow?: string;
  buyingConfidence?: number;
  marketMoment?: string;
  marketBestPrice: string;
  marketAlternatives: string[]; // Liste de 4 alternatives réelles avec prix
  durabilityScore?: number;
  trustStatement: string;
  oneWordVerdict: string;
  buyerTip: string;
  predecessorName: string;
  activeLifespanYears: number;
  groundingSources?: { title: string; uri: string }[];
}

export interface ComparisonData {
  summary: string;
  winner: string;
  criteria: {
    label: string;
    productA: string;
    productB: string;
    better: 'A' | 'B' | 'Equal';
  }[];
}

export interface ProductSummary {
  sentiment: string;
  summary: string;
  pros: string[];
  cons: string[];
}
