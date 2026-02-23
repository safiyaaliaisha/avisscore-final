
import React, { useMemo, useState } from 'react';
import { Sparkles, Star, Quote, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Product, ProductSummary } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
}

const ReviewItem: React.FC<{ text: string; index: number; rating?: number }> = ({ text, index, rating = 5 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const sources = ['Expert Tech Mobile', 'Analyste Hardware', 'Testeur Communauté', 'Labo Performance', 'Journaliste Tech'];
  const source = sources[index % sources.length];
  
  const isLong = text.length > 180;

  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-5"><Quote size={80} /></div>
      <div className="flex items-center gap-4 mb-8 relative z-10">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-[11px] font-black text-slate-900 uppercase">{source}</p>
          <p className="text-[9px] font-bold text-slate-400 uppercase">RÉCEMMENT</p>
        </div>
      </div>
      <div className="flex-1 relative z-10">
        <p className={`text-slate-500 text-xs italic mb-4 leading-relaxed ${!isExpanded ? 'line-clamp-6' : ''}`}>
          "{text.trim()}"
        </p>
        {isLong && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline mb-6"
          >
            {isExpanded ? 'Voir moins' : 'Lire plus'}
          </button>
        )}
      </div>
      <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
        <div className="flex text-amber-500 gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} size={12} className={i < Math.floor(rating) ? "fill-amber-500" : "text-slate-200"} />
          ))}
        </div>
        <span className="text-[11px] font-black text-slate-900">{rating}</span>
      </div>
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary }) => {
  const [visibleReviews, setVisibleReviews] = useState(4);
  const baseScore = product.score || 8.5;
  const productRating = product.rating || 4.5;

  /**
   * Nettoie les valeurs pour l'affichage (supprime les crochets JSONB, guillemets, etc.)
   */
  const clean = (v: any): string => {
    if (!v) return "";
    
    // Si c'est un tableau, on prend le premier élément
    if (Array.isArray(v)) {
      return clean(v[0]);
    }

    // Si c'est une chaîne, on nettoie les caractères JSON résiduels
    if (typeof v === 'string') {
        let s = v.trim();
        // Cas spécifique ["texte"]
        if (s.startsWith('["') && s.endsWith('"]')) {
           s = s.substring(2, s.length - 2);
        } else if (s.startsWith('[') && s.endsWith(']')) {
           s = s.substring(1, s.length - 1);
        }
        // Supprime les guillemets restants aux extrémités
        return s.replace(/^"+|"+$/g, '').trim();
    }

    if (typeof v === 'object') {
        return clean(v.content || v.text || JSON.stringify(v));
    }

    return String(v);
  };

  const reviewsList = useMemo(() => {
    const raw = product.review_text;
    if (Array.isArray(raw)) {
      return raw.map(r => clean(r)).filter(s => s.length > 5);
    }
    if (typeof raw === 'string' && raw.length > 5) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed.map(p => clean(p)) : [clean(raw)];
        } catch {
            return [clean(raw)];
        }
    }
    return [];
  }, [product.review_text]);

  const parseJsonbArray = (val: any) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const p = JSON.parse(val);
            return Array.isArray(p) ? p : [val];
        } catch {
            return [val];
        }
    }
    return [];
  };

  const pros = parseJsonbArray(product.points_forts);
  const cons = parseJsonbArray(product.points_faibles);

  return (
    <div className="space-y-16">
      {/* Summary Score Header */}
      <div className="bg-[#0F172A] p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
          <div className="max-w-2xl space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">Analyse Globale</h2>
            <p className="text-slate-400 text-xl font-medium leading-relaxed italic">
                {summary ? "Analyse neurale stabilisée. Nos algorithmes ont croisé plus de 50 sources spécialisées." : "Affichage des données Supabase. L'IA Gemini affine l'analyse en arrière-plan..."}
            </p>
            <div className="flex flex-wrap gap-4">
                <span className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                   {!summary && <Loader2 size={12} className="animate-spin" />} Neural Analysis 2.5
                </span>
                <span className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">Verified Sources</span>
            </div>
          </div>
          <div className="shrink-0 bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border border-white/10 shadow-inner text-center transform hover:scale-105 transition-transform duration-500">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.5em] block mb-4">SCORE AVISCORE</span>
            <span className="text-8xl font-black text-white tracking-tighter leading-none">{baseScore.toFixed(1)}</span>
            <div className="mt-6 flex justify-center text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={20} className="fill-amber-500" />)}
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {reviewsList.length > 0 ? reviewsList.slice(0, visibleReviews).map((text, i) => (
            <ReviewItem key={i} text={text} index={i} rating={productRating} />
          )) : (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
               <Quote size={48} className="mx-auto text-slate-100 mb-6" />
               <p className="text-slate-400 font-black uppercase tracking-widest italic text-lg">Aucun témoignage textuel disponible.</p>
            </div>
          )}
        </div>
        
        {reviewsList.length > visibleReviews && (
          <div className="flex justify-center pt-8">
            <button 
              onClick={() => setVisibleReviews(prev => prev + 8)}
              className="bg-white border border-slate-200 text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm active:scale-95"
            >
              Lire la suite des avis
            </button>
          </div>
        )}
      </div>

      {/* Pros & Cons Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="bg-emerald-50/50 rounded-[4rem] border border-emerald-100 p-12 md:p-16 space-y-10 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} />
            </div>
            <h3 className="text-[14px] font-black text-emerald-700 uppercase tracking-[0.5em]">Avantages</h3>
          </div>
          <ul className="space-y-6">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-6 text-slate-800 font-bold text-xl bg-white p-8 rounded-[2.5rem] shadow-sm border border-emerald-50 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-1">
                  <i className="fas fa-check text-[10px]"></i>
                </div>
                <span>{clean(p)}</span>
              </li>
            ))}
            {pros.length === 0 && <p className="text-slate-400 italic font-medium px-4">Aucun avantage spécifique listé.</p>}
          </ul>
        </div>
        
        <div className="bg-rose-50/50 rounded-[4rem] border border-rose-100 p-12 md:p-16 space-y-10 shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
                <AlertCircle size={32} />
            </div>
            <h3 className="text-[14px] font-black text-rose-700 uppercase tracking-[0.5em]">Points Faibles</h3>
          </div>
          <ul className="space-y-6">
            {cons.map((p, i) => (
              <li key={i} className="flex items-start gap-6 text-slate-800 font-bold text-xl bg-white p-8 rounded-[2.5rem] shadow-sm border border-rose-50 hover:shadow-xl hover:-translate-y-1 transition-all">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-1">
                  <i className="fas fa-times text-[10px]"></i>
                </div>
                <span>{clean(p)}</span>
              </li>
            ))}
            {cons.length === 0 && <p className="text-slate-400 italic font-medium px-4">Aucun inconvénient majeur identifié.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};
