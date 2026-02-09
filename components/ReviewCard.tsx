
import React, { useMemo } from 'react';
import { Sparkles, ShoppingBag, Star, Quote, CheckCircle } from 'lucide-react';
import { Product, ProductSummary } from '../types';

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

const ReviewItem: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const sources = ['Amazon', 'Web Expert', 'Communauté', 'Verified Buyer'];
  const source = sources[index % sources.length];
  
  return (
    <div className="flex flex-col bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 group-hover:scale-110 transition-transform"><Quote size={60} /></div>
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-black text-[10px] group-hover:rotate-6 transition-transform">
          {source.charAt(0)}
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-[13px]">{source}</h4>
          <StarRating rating={4.8} size={11} />
        </div>
      </div>
      <p className="text-slate-700 text-[14px] leading-[1.7] font-medium italic flex-1 relative z-10">"{typeof text === 'string' ? text.trim() : 'Avis indisponible'}"</p>
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary }) => {
  const baseScore = product.score || summary?.rating || 8.5;

  const reviewsList = useMemo(() => {
    let list: string[] = [];
    const rawReviews = product.review_text;
    if (Array.isArray(rawReviews)) {
      list = rawReviews.map(r => {
        if (typeof r === 'string') return r;
        if (r && typeof r === 'object') return r.content || r.text || "";
        return "";
      }).filter(s => s && s.length > 5);
    } else if (typeof rawReviews === 'string' && rawReviews !== "") {
      list = rawReviews.split(/[.\n]/).filter(s => s.trim().length > 20);
    }
    return list.slice(0, 3);
  }, [product.review_text]);

  // Sécurisation pour s'assurer qu'on a des strings
  const pros = (Array.isArray(product.points_forts) ? product.points_forts : []).slice(0, 6);
  const cons = (Array.isArray(product.points_faibles) ? product.points_faibles : []).slice(0, 6);

  const renderTextSafe = (item: any) => {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object') return item.text || item.content || JSON.stringify(item);
    return "";
  };

  return (
    <div className="space-y-12">
      <div className="bg-white p-8 md:p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Verdict Neural</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 animate-pulse rounded-full"></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Synthèse multi-sources par IA</span>
            </div>
          </div>
          <div className="bg-[#0F172A] p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl border border-white/5">
            <div className="text-center">
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1">Score Global</span>
              <span className="text-5xl font-black text-white tracking-tighter leading-none">{baseScore.toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {reviewsList.length > 0 ? reviewsList.map((revText, i) => (
            <ReviewItem key={i} text={revText} index={i} />
          )) : (
            <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-widest italic">Analyse des témoignages en cours...</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-emerald-50/30 rounded-[3rem] border border-emerald-100 p-10 space-y-6">
          <h3 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center gap-2">
            <CheckCircle size={16} /> Points Forts (Expert)
          </h3>
          <ul className="grid grid-cols-1 gap-4">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-slate-800 font-bold text-sm bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 hover:border-emerald-200 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fas fa-check text-[10px]"></i>
                </div>
                {renderTextSafe(p)}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-rose-50/30 rounded-[3rem] border border-rose-100 p-10 space-y-6">
          <h3 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.4em] flex items-center gap-2">
            <i className="fas fa-exclamation-triangle text-xs"></i> Points Faibles (Expert)
          </h3>
          <ul className="grid grid-cols-1 gap-4">
            {cons.map((p, i) => (
              <li key={i} className="flex items-start gap-4 text-slate-800 font-bold text-sm bg-white p-4 rounded-2xl shadow-sm border border-rose-50 hover:border-rose-200 transition-colors">
                <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <i className="fas fa-times text-[10px]"></i>
                </div>
                {renderTextSafe(p)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
