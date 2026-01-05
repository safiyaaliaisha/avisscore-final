
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Product, ProductSummary, FAQItem } from '../types';
import { ReviewCard } from '../components/ReviewCard';

interface ProductDetailsProps {
  product: Product;
  summary: ProductSummary | null;
  popularProducts: Product[];
  onBack: () => void;
}

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, summary, popularProducts, onBack }) => {
  if (!product) return null;

  // Rating Logic
  const ratingValue = product.score || (product.rating ? product.rating * 2 : 8.5);
  const reviewCount = (product.reviews?.length || 0) > 0 ? product.reviews!.length : 100;

  // FAQ Data Logic: Prioritize DB faq column, then fallback to generated content
  let faqs: { q: string; a: string }[] = [];

  try {
    if (product.faq) {
      const rawFaqs = typeof product.faq === 'string' ? JSON.parse(product.faq) : product.faq;
      if (Array.isArray(rawFaqs) && rawFaqs.length > 0) {
        faqs = rawFaqs.map((item: any) => ({
          q: item.question || item.q || "Question sans titre",
          a: item.answer || item.a || "Réponse non disponible"
        }));
      }
    }
  } catch (e) {
    console.error("Error parsing product.faq:", e);
  }

  // Fallback to generated questions if DB faq is empty or missing
  if (faqs.length === 0) {
    faqs = [
      {
        q: `Quelle est la note de ${product.name} ?`,
        a: `L'IA Avisscore lui attribue une note de ${ratingValue.toFixed(1)}/10 basée sur l'analyse de ${reviewCount} avis.`
      },
      {
        q: `${product.name} est-il un bon choix ?`,
        a: `Oui, avec un score de ${ratingValue.toFixed(1)}/10, ce produit est considéré comme ${ratingValue > 7 ? 'excellent' : 'moyen'} par notre algorithme.`
      },
      {
        q: `Où trouver le meilleur prix pour ${product.name} ?`,
        a: `Nous analysons plusieurs marchands pour vous offrir la meilleure comparaison en temps réel sur Avisscore.`
      }
    ];
  }

  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.image_url,
    "description": product.seo_description || summary?.seo_description || product.description,
    "brand": {
      "@type": "Brand",
      "name": product.category || "Avisscore"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": ratingValue.toFixed(1),
      "bestRating": "10",
      "worstRating": "1",
      "reviewCount": String(reviewCount)
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <div className="space-y-12">
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(productSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <ReviewCard 
        product={product} 
        summary={summary}
        relatedProducts={popularProducts.filter(p => p.id !== product.id).slice(0, 3)}
      />

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto pt-12 pb-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="text-center mb-12 space-y-2">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
            Questions Fréquentes sur <span className="text-blue-600 italic">{product.name}</span>
          </h2>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em]">Expertise IA & Consensus Consommateurs</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:border-blue-100 transition-all duration-500"
            >
              <div className="flex gap-5">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-inner">
                  {i + 1}
                </div>
                <div className="space-y-3">
                  <h3 className="text-lg font-black text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">{faq.q}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed italic">"{faq.a}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      <div className="flex justify-center pb-24">
        <button 
          onClick={onBack} 
          className="bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] px-12 py-5 rounded-[2rem] hover:text-blue-600 hover:border-blue-600 shadow-lg hover:shadow-2xl transition-all flex items-center gap-5 group"
        >
          <i className="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> Retour au Catalogue
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
