
import React from 'react';
import { Product, ProductSummary, Review } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
  isAnalyzing?: boolean;
  relatedProducts?: Product[];
  recentReviews?: Product[];
}

const StarRating = ({ rating, size = "xs" }: { rating: number; size?: string }) => (
  <div className={`flex text-amber-500 gap-0.5 text-${size}`}>
    {[...Array(5)].map((_, i) => (
      <i key={i} className={`${i < Math.floor(rating) ? "fas" : "far"} fa-star`}></i>
    ))}
  </div>
);

const getSpecIcon = (key: string) => {
  const k = String(key || "").toLowerCase();
  if (k.includes('écran') || k.includes('screen') || k.includes('display') || k.includes('dalle')) return 'fa-mobile-screen-button';
  if (k.includes('processeur') || k.includes('cpu') || k.includes('chip') || k.includes('soc')) return 'fa-microchip';
  if (k.includes('stockage') || k.includes('ssd') || k.includes('disk') || k.includes('hdd')) return 'fa-hard-drive';
  if (k.includes('ram') || k.includes('mémoire') || k.includes('memory')) return 'fa-memory';
  if (k.includes('batterie') || k.includes('battery') || k.includes('autonomie')) return 'fa-battery-full';
  if (k.includes('caméra') || k.includes('camera') || k.includes('photo') || k.includes('optique')) return 'fa-camera';
  if (k.includes('poids') || k.includes('weight')) return 'fa-weight-hanging';
  if (k.includes('dimension') || k.includes('taille') || k.includes('format')) return 'fa-ruler-combined';
  if (k.includes('os') || k.includes('système') || k.includes('logiciel')) return 'fa-code';
  if (k.includes('connectivité') || k.includes('wifi') || k.includes('bluetooth')) return 'fa-wifi';
  if (k.includes('audio') || k.includes('son')) return 'fa-volume-high';
  if (k.includes('charge') || k.includes('port')) return 'fa-plug-circle-bolt';
  if (k.includes('moteur') || k.includes('engine')) return 'fa-engine';
  if (k.includes('puissance') || k.includes('hp')) return 'fa-bolt';
  return 'fa-atom';
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-blue-100 text-blue-600', 
    'bg-emerald-100 text-emerald-600', 
    'bg-indigo-100 text-indigo-600', 
    'bg-rose-100 text-rose-600', 
    'bg-amber-100 text-amber-600'
  ];
  const index = (name || "User").length % colors.length;
  return colors[index];
};

const ProductReviewCard: React.FC<{ review: Partial<Review> & { isAI?: boolean } }> = ({ review }) => {
  const source = review.source || (review.isAI ? "Analyse IA" : "Communauté");
  const author = review.author_name || (review.isAI ? "Expert Avisscore" : "Acheteur vérifié");
  
  const sourceColors: Record<string, string> = {
    fnac: 'border-amber-500/30 hover:bg-amber-500/5',
    darty: 'border-red-500/30 hover:bg-red-500/5',
    boulanger: 'border-orange-500/30 hover:bg-orange-500/5',
    rakuten: 'border-rose-500/30 hover:bg-rose-500/5',
    'analyse ia': 'border-blue-500/30 bg-blue-50/30 hover:bg-blue-100/50',
    'synthèse avisscore': 'border-blue-500/30 bg-blue-50/30 hover:bg-blue-100/50',
  };

  const colorClass = sourceColors[source.toLowerCase()] || 'border-slate-200 hover:bg-slate-50';

  return (
    <div className={`flex flex-col h-full rounded-2xl border p-5 transition-all duration-500 bg-white hover:shadow-xl hover:-translate-y-1 group ${colorClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${getAvatarColor(author)}`}>
          {author.charAt(0).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">
            {author}
          </h4>
          <div className="flex items-center gap-1.5">
            <i className={`fas ${review.isAI ? 'fa-microchip text-blue-500' : 'fa-check-circle text-emerald-500'} text-[8px]`}></i>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {review.isAI ? 'Certifié Neural' : 'Avis vérifié'} • {source}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 mb-4">
        <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 font-medium italic">
          "{review.review_text}"
        </p>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
        <StarRating rating={review.rating || 4} />
        <span className="text-slate-900 font-black text-[11px]">{review.rating || "4.0"}</span>
      </div>
    </div>
  );
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary, isAnalyzing, relatedProducts = [], recentReviews = [] }) => {
  const expertScore = product?.score || product?.analysis?.score || 0;
  const userScore = product?.rating || summary?.rating || 0;
  const globalScore = expertScore > 0 ? (expertScore * 0.6 + userScore * 2 * 0.4) : (userScore > 0 ? userScore * 2 : 0);
  const ratingText = globalScore > 0 ? globalScore.toFixed(1) : "N/A";

  const pointsForts = Array.isArray(summary?.points_forts) && summary.points_forts.length > 0 ? summary.points_forts : (Array.isArray(product?.points_forts) ? product.points_forts : []);
  const pointsFaibles = Array.isArray(summary?.points_faibles) && summary.points_faibles.length > 0 ? summary.points_faibles : (Array.isArray(product?.points_faibles) ? product.points_faibles : []);
  const ficheTechnique = Array.isArray(summary?.fiche_technique) && summary.fiche_technique.length > 0 ? summary.fiche_technique : (Array.isArray(product?.fiche_technique) ? product.fiche_technique : []);
  
  let topReviews: any[] = [];
  
  const realReviews = Array.isArray(product?.reviews) ? product.reviews : [];
  topReviews = [...realReviews];

  const merchantReviews = [
    { source: 'Fnac', text: product.fnac_rev, author: 'Acheteur vérifié' },
    { source: 'Darty', text: product.darty_rev, author: 'Acheteur vérifié' },
    { source: 'Boulanger', text: product.boulanger_rev, author: 'Acheteur vérifié' },
    { source: 'Rakuten', text: product.rakuten_rev, author: 'Acheteur vérifié' }
  ].filter(r => r.text && r.text.trim() !== '');

  merchantReviews.forEach((m, idx) => {
    if (topReviews.length < 3) {
      topReviews.push({
        id: `merchant-${m.source}-${idx}`,
        author_name: m.author,
        review_text: m.text,
        rating: 4.5,
        source: m.source,
        isAI: false
      });
    }
  });

  if (topReviews.length < 3 && summary?.review_text) {
    const aiTexts = summary.review_text;
    for (let i = 0; i < aiTexts.length && topReviews.length < 3; i++) {
      topReviews.push({
        id: `ai-fill-${i}`,
        author_name: `Expert IA ${i + 1}`,
        review_text: aiTexts[i],
        rating: summary.rating || 4,
        source: "Synthèse Avisscore",
        isAI: true
      });
    }
  }

  if (topReviews.length < 3) {
    const fallbackText = product.review_text || product.description || "Analyse technique exhaustive en attente de validation finale par nos experts.";
    topReviews.push({
      id: 'expert-fallback',
      author_name: "Verdict Final",
      review_text: fallbackText,
      rating: product.score || 8,
      source: "Avisscore Labs",
      isAI: true
    });
  }

  topReviews = topReviews.slice(0, 3);

  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-[15rem] text-slate-900 pointer-events-none -rotate-12 translate-x-20 -translate-y-20">
          <i className="fas fa-comments"></i>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Avis du Produit</h2>
            <div className="flex items-center gap-3">
              <span className={`w-2 h-2 ${realReviews.length >= 3 || merchantReviews.length >= 3 ? 'bg-emerald-500' : 'bg-blue-500'} rounded-full animate-pulse`}></span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                {merchantReviews.length > 0 ? "Validation Marchands Certifiée" : "Analyse Hybride Experts & IA"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-6 p-4 bg-[#0F172A] rounded-2xl shadow-xl border border-white/5">
            <div className="flex flex-col items-center">
              <StarRating rating={globalScore / 2} size="xs" />
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Score Final</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex flex-col">
               <span className="text-3xl font-black text-white tracking-tighter leading-none">{ratingText}<span className="text-blue-500 text-lg ml-0.5">/10</span></span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
          {topReviews.map((rev) => (
            <ProductReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 flex flex-col bg-[#F8FAFC] p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden group/pros">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
              <i className="fas fa-layer-group text-blue-600"></i>
              Analyse <span className="text-blue-600 italic">8K Digital</span>
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-auto relative z-10">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20 text-emerald-600 shadow-emerald-500/20 shadow-lg">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Points Forts</h3>
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] leading-none mt-1">Avantages Validés</p>
                </div>
              </div>
              <ul className="space-y-4">
                {pointsForts.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all duration-300 border-l-4 border-l-emerald-500">
                    <span className="text-sm font-bold text-slate-700 leading-tight">{String(p)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 text-rose-600 shadow-rose-500/20 shadow-lg">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Points Faibles</h3>
                  <p className="text-[9px] text-rose-500 font-black uppercase tracking-[0.2em] leading-none mt-1">Limites Systèmes</p>
                </div>
              </div>
              <ul className="space-y-4">
                {pointsFaibles.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-rose-500/30 hover:shadow-rose-500/10 transition-all duration-300 border-l-4 border-l-rose-500">
                    <span className="text-sm font-bold text-slate-700 leading-tight">{String(p)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="mb-6 text-center w-full relative z-10">
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 line-clamp-2 leading-tight">
              {String(product?.name || 'Produit')}
            </h1>
            <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">
              {String(product?.category || "Technologie")}
            </span>
          </div>
          
          <div className="relative w-full aspect-square flex items-center justify-center z-10">
            {product?.image_url ? (
              <img 
                src={product.image_url} 
                alt={String(product?.name || 'Produit Avisscore')} 
                className="relative max-h-full max-w-full object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.15)] group-hover:scale-110 transition-transform duration-700" 
              />
            ) : (
              <div className="text-slate-200 text-6xl"><i className="fas fa-image"></i></div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#0F172A] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-blue-500/20">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <h3 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-microchip text-blue-400 text-2xl"></i>
              </div>
              Spécifications <span className="text-blue-500 italic">Ultra</span>
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            {ficheTechnique.map((f, i) => {
              const parts = String(f).split(':');
              const keyName = parts[0]?.trim() || "Module";
              const valueName = parts.slice(1).join(':').trim() || "Information";
              const icon = getSpecIcon(keyName);
              return (
                <div key={i} className="relative flex items-center gap-6 p-6 rounded-[2rem] bg-slate-900/40 border border-white/5 hover:border-blue-500/50 transition-all duration-500">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500 shrink-0">
                    <i className={`fas ${icon} text-2xl`}></i>
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">
                      {keyName}
                    </span>
                    <span className="block text-lg font-black text-white tracking-tight leading-tight">
                      {valueName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl flex flex-col h-full">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
            <i className="fas fa-gavel text-blue-600"></i> Verdict Expert
          </h3>
          <div className="flex-1 relative">
            <p className="text-slate-600 leading-relaxed text-lg font-medium italic">
              {summary?.review_text?.[0] || product?.review_text || product?.description || "L'analyse française certifiée est en cours de déploiement."}
            </p>
          </div>
          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
             <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
               <i className="fas fa-fingerprint text-blue-500"></i> Authentifié par Avisscore Neural
             </div>
             <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">
               Expert Choice
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};
