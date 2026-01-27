
import React from 'react';
import { Sparkles, ShoppingBag, Star, Layout } from 'lucide-react';
import { Product, ProductSummary, Review } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
}

const StarRating = ({ rating, size = 12 }: { rating: number; size?: number }) => {
  return (
    <div className="flex text-amber-500 gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={size} className={i < Math.floor(rating) ? "fill-amber-500" : "text-slate-200"} />
      ))}
    </div>
  );
};

const getMerchantLogo = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('fnac')) return { color: 'bg-[#F29100]', icon: 'F', name: 'Fnac' };
  if (s.includes('darty')) return { color: 'bg-[#E30613]', icon: 'D', name: 'Darty' };
  if (s.includes('boulanger')) return { color: 'bg-[#F06C00]', icon: 'B', name: 'Boulanger' };
  if (s.includes('amazon')) return { color: 'bg-[#232F3E]', icon: 'A', name: 'Amazon' };
  return { color: 'bg-slate-500', icon: 'W', name: 'Web' };
};

const ReviewItem: React.FC<{ rev: Partial<Review>; affiliate?: string }> = ({ rev, affiliate }) => {
  const merchant = getMerchantLogo(rev.source || 'Web');
  return (
    <div className="flex flex-col bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs ${merchant.color}`}>
          {merchant.icon}
        </div>
        <div>
          <h4 className="font-bold text-slate-900 text-[11px] leading-tight">Avis {merchant.name}</h4>
          <StarRating rating={rev.rating || 4} size={10} />
        </div>
      </div>
      <p className="text-slate-500 text-[11px] leading-relaxed italic flex-1 mb-6 line-clamp-4">
        "{rev.review_text?.replace(/[""«»]/g, '')}"
      </p>
      {affiliate && (
        <a href={affiliate} target="_blank" className="flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors">
          <ShoppingBag size={10} /> Voir sur {merchant.name}
        </a>
      )}
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary }) => {
  // Calcul du score final sur 10 (sans doubling)
  const baseScore = summary?.rating || product?.score || 8.5;
  const ratingText = baseScore.toFixed(1);

  const merchantReviews: Partial<Review>[] = [];
  if (product.fnac_rev) merchantReviews.push({ source: 'Fnac', review_text: product.fnac_rev, rating: product.rating || 4 });
  if (product.darty_rev) merchantReviews.push({ source: 'Darty', review_text: product.darty_rev, rating: product.rating || 4 });
  if (product.boulanger_rev) merchantReviews.push({ source: 'Boulanger', review_text: product.boulanger_rev, rating: product.rating || 4 });
  if (product.amazon_rev) merchantReviews.push({ source: 'Amazon', review_text: product.amazon_rev, rating: product.rating || 4 });

  return (
    <div className="space-y-12">
      {/* Header avec Score AVISSCORE 10/10 + Stars */}
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Résumé web</h2>
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 bg-emerald-500 animate-pulse rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Verdict Intelligence Artificielle</span>
            </div>
          </div>
          
          {/* Badge de Score Premium */}
          <div className="flex items-center gap-6 p-6 bg-[#0F172A] rounded-[2rem] shadow-2xl border border-white/10 ring-1 ring-blue-500/20">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-2">AVISSCORE</span>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={12} 
                    className={i < Math.floor(baseScore / 2) ? "fill-blue-500 text-blue-500" : "text-slate-700"} 
                  />
                ))}
              </div>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex items-baseline gap-0.5">
               <span className="text-4xl font-black text-white tracking-tighter leading-none">{ratingText}</span>
               <span className="text-blue-500 font-bold text-sm">/10</span>
            </div>
          </div>
        </div>

        {summary?.design_analysis && (
          <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-start gap-4">
             <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shrink-0">
                <Layout size={20} />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2">Analyse du Design & Ergonomie</h4>
                <p className="text-sm text-slate-600 leading-relaxed italic">{summary.design_analysis}</p>
             </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          {merchantReviews.length > 0 ? merchantReviews.map((rev, i) => (
            <ReviewItem key={i} rev={rev} affiliate={product.affiliate_link} />
          )) : (
            <div className="col-span-full py-12 bg-slate-50 rounded-2xl text-center text-slate-400 font-bold italic">
              Aucun résumé marchand disponible pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Pros & Cons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100 p-8 space-y-6">
          <h3 className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em] flex items-center gap-2">
            <Sparkles size={14} /> Points Forts
          </h3>
          <ul className="space-y-3">
            {(product.points_forts || summary?.points_forts || []).map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-slate-700 font-bold text-sm bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fas fa-check text-[10px]"></i>
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-50/30 rounded-[2.5rem] border border-rose-100 p-8 space-y-6">
          <h3 className="text-sm font-black text-rose-600 uppercase tracking-[0.3em] flex items-center gap-2">
            <i className="fas fa-times-circle"></i> Points Faibles
          </h3>
          <ul className="space-y-3">
            {(product.points_faibles || summary?.points_faibles || []).map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-slate-700 font-bold text-sm bg-white p-4 rounded-xl shadow-sm border border-slate-50">
                <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fas fa-times text-[10px]"></i>
                </div>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
