
import React, { useMemo } from 'react';
import { Sparkles, Star, Quote, CheckCircle2, AlertCircle } from 'lucide-react';
import { Product, ProductSummary } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
}

const ReviewItem: React.FC<{ text: string; index: number }> = ({ text, index }) => {
  const sources = ['Amazon Customer', 'Verified Buyer', 'Tech Expert', 'Community Member', 'Pro Reviewer'];
  const source = sources[index % sources.length];
  
  return (
    <div className="flex flex-col bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-6 opacity-5 text-slate-900 group-hover:scale-110 transition-transform"><Quote size={80} /></div>
      <div className="flex items-center gap-5 mb-8 relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg text-white font-black text-sm group-hover:rotate-6 transition-transform">
          {source.charAt(0)}
        </div>
        <div>
          <h4 className="font-black text-slate-900 text-base">{source}</h4>
          <div className="flex text-amber-500 gap-0.5 mt-1">
             {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-500" />)}
          </div>
        </div>
      </div>
      <p className="text-slate-700 text-lg leading-relaxed font-medium italic flex-1 relative z-10">"{text.trim()}"</p>
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary }) => {
  const baseScore = product.score || 8.5;

  const reviewsList = useMemo(() => {
    const raw = product.review_text;
    if (Array.isArray(raw)) {
      return raw.map(r => {
        if (typeof r === 'string') return r;
        if (typeof r === 'object') return r.content || r.text || JSON.stringify(r);
        return String(r);
      }).filter(s => s.length > 5);
    }
    if (typeof raw === 'string' && raw.length > 5) return [raw];
    return [];
  }, [product.review_text]);

  const pros = Array.isArray(product.points_forts) ? product.points_forts : [];
  const cons = Array.isArray(product.points_faibles) ? product.points_faibles : [];

  const clean = (val: any) => String(val).replace(/[\[\]{}"]/g, '').trim();

  return (
    <div className="space-y-12">
      <div className="bg-white p-10 md:p-16 rounded-[3.5rem] border border-slate-100 shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-1000"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Synthèse des Avis</h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="w-3 h-3 bg-emerald-500 animate-pulse rounded-full"></span>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Analyses Neurales 2025</span>
            </div>
          </div>
          <div className="bg-[#0F172A] px-12 py-8 rounded-[3rem] shadow-2xl border border-white/5 text-center transform hover:scale-105 transition-transform">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-2">Score Global IA</span>
            <span className="text-6xl font-black text-white tracking-tighter leading-none">{baseScore.toFixed(1)}</span>
          </div>
        </div>

        {/* Mise à jour en 2 colonnes (lg:grid-cols-2) pour une meilleure lisibilité des textes longs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {reviewsList.length > 0 ? reviewsList.map((text, i) => (
            <ReviewItem key={i} text={text} index={i} />
          )) : (
            <div className="col-span-full py-24 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
               <p className="text-slate-400 font-black uppercase tracking-widest italic text-lg">Aucun témoignage textuel à afficher pour le moment.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-emerald-50/50 rounded-[3.5rem] border border-emerald-100 p-12 space-y-8 shadow-lg">
          <h3 className="text-[12px] font-black text-emerald-600 uppercase tracking-[0.4em] flex items-center gap-3">
            <CheckCircle2 size={24} /> Avantages Clés
          </h3>
          <ul className="space-y-5">
            {pros.map((p, i) => (
              <li key={i} className="flex items-start gap-5 text-slate-800 font-bold text-lg bg-white p-7 rounded-3xl shadow-sm border border-emerald-50 hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <i className="fas fa-check text-[12px]"></i>
                </div>
                <span>{clean(p)}</span>
              </li>
            ))}
            {pros.length === 0 && <p className="text-slate-400 italic font-medium">Liste des points forts non renseignée.</p>}
          </ul>
        </div>
        
        <div className="bg-rose-50/50 rounded-[3.5rem] border border-rose-100 p-12 space-y-8 shadow-lg">
          <h3 className="text-[12px] font-black text-rose-600 uppercase tracking-[0.4em] flex items-center gap-3">
            <AlertCircle size={24} /> Inconvénients
          </h3>
          <ul className="space-y-5">
            {cons.map((p, i) => (
              <li key={i} className="flex items-start gap-5 text-slate-800 font-bold text-lg bg-white p-7 rounded-3xl shadow-sm border border-rose-50 hover:shadow-md transition-all">
                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-md">
                  <i className="fas fa-times text-[12px]"></i>
                </div>
                <span>{clean(p)}</span>
              </li>
            ))}
            {cons.length === 0 && <p className="text-slate-400 italic font-medium">Aucun point faible majeur identifié.</p>}
          </ul>
        </div>
      </div>
    </div>
  );
};
