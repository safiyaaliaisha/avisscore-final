import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Product, ProductSummary } from '../types';
import { ReviewCard } from '../components/ReviewCard';

interface ProductDetailsProps {
  product: Product;
  summary: ProductSummary | null;
  popularProducts: Product[];
  onBack: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, summary, popularProducts, onBack }) => {
  if (!product) return null;

  const faqs = useMemo(() => {
    const rawData = product.faq;
    if (!rawData) return [];
    let items: any[] = [];
    try {
      if (typeof rawData === 'string') {
        const parsed = JSON.parse(rawData);
        items = Array.isArray(parsed) ? parsed : [parsed];
      } else if (Array.isArray(rawData)) {
        items = rawData;
      } else if (typeof rawData === 'object' && rawData !== null) {
        items = [rawData];
      }
    } catch (e) { return []; }
    return items
      .map((item: any) => ({
        q: String(item?.question || item?.q || ""),
        a: String(item?.answer || item?.a || "")
      }))
      .filter(item => item.q.trim().length > 0 && item.a.trim().length > 0);
  }, [product.faq]);

  return (
    <div className="space-y-0 animate-in fade-in duration-1000">
      <Helmet>
        <title>{product.name} - Avis Experts & Score IA | Avisscore</title>
      </Helmet>

      <section className="pb-16">
        <ReviewCard 
          product={product} 
          summary={summary}
          faqs={faqs}
          relatedProducts={popularProducts.filter(p => p.id !== product.id).slice(0, 3)}
        />
      </section>
      
      <div className="flex justify-center pt-24 pb-32">
        <button 
          onClick={onBack} 
          className="bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] px-12 py-5 rounded-[2rem] hover:text-blue-600 hover:border-blue-600 shadow-xl hover:shadow-2xl transition-all flex items-center gap-5 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-2 transition-transform" />
          Retour au Catalogue
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;