import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, ChevronDown, Sparkles, ExternalLink, Flame, Info, Globe } from 'lucide-react';
import { Product, ProductSummary, Review } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
  isAnalyzing?: boolean;
  relatedProducts?: Product[];
  recentReviews?: Product[];
  faqs?: { q: string, a: string }[];
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

const getMerchantLogo = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('fnac')) return { color: 'bg-[#F29100]', icon: 'F', name: 'Fnac' };
  if (s.includes('darty')) return { color: 'bg-[#E30613]', icon: 'D', name: 'Darty' };
  if (s.includes('boulanger')) return { color: 'bg-[#F06C00]', icon: 'B', name: 'Boulanger' };
  if (s.includes('rakuten')) return { color: 'bg-[#BF0000]', icon: 'R', name: 'Rakuten' };
  if (s.includes('amazon')) return { color: 'bg-[#232F3E]', icon: 'A', name: 'Amazon' };
  if (s.includes('ia') || s.includes('neural')) return { color: 'bg-blue-600', icon: <Sparkles size={14} />, name: 'Avisscore IA' };
  return { color: 'bg-slate-400', icon: 'W', name: 'Web' };
};

const ProductReviewCard: React.FC<{ review: Partial<Review> & { isAI?: boolean } }> = ({ review }) => {
  const sourceName = review.source || (review.isAI ? "Analyse IA" : "Web");
  const merchant = getMerchantLogo(sourceName);
  
  const sourceColors: Record<string, string> = {
    fnac: 'border-[#F29100]/30 hover:bg-[#F29100]/5',
    darty: 'border-[#E30613]/30 hover:bg-[#E30613]/5',
    boulanger: 'border-[#F06C00]/30 hover:bg-[#F06C00]/5',
    rakuten: 'border-[#BF0000]/30 hover:bg-[#BF0000]/5',
    'analyse ia': 'border-blue-500/30 bg-blue-50/30 hover:bg-blue-100/50',
  };

  const colorClass = sourceColors[sourceName.toLowerCase()] || 'border-slate-200 hover:bg-slate-50';

  return (
    <div className={`flex flex-col h-full rounded-2xl border p-5 transition-all duration-500 bg-white hover:shadow-xl hover:-translate-y-1 group ${colorClass}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-sm ${merchant.color}`}>
          {merchant.icon}
        </div>
        <div className="overflow-hidden">
          <h4 className="font-bold text-slate-800 text-sm truncate leading-tight">
            Résumé web
          </h4>
          <div className="flex items-center gap-1.5">
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">
              Source: {merchant.name}
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

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary, isAnalyzing, relatedProducts = [], recentReviews = [], faqs = [] }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  
  const expertScore = product?.score || product?.analysis?.score || 0;
  const userScore = product?.rating || summary?.rating || 0;
  const globalScore = expertScore > 0 ? (expertScore * 0.6 + userScore * 2 * 0.4) : (userScore > 0 ? userScore * 2 : 0);
  const ratingText = globalScore > 0 ? globalScore.toFixed(1) : "N/A";

  const curPrice = Number(product.current_price) || 0;
  const refPrice = Number(product.reference_price) || 0;
  const discount = (curPrice > 0 && refPrice > 0) ? Math.round(((refPrice - curPrice) / refPrice) * 100) : 0;
  const hasPriceError = discount >= 50 && curPrice > 0;

  const pointsForts = Array.isArray(summary?.points_forts) && summary.points_forts.length > 0 ? summary.points_forts : (Array.isArray(product?.points_forts) ? product.points_forts : []);
  const pointsFaibles = Array.isArray(summary?.points_faibles) && summary.points_faibles.length > 0 ? summary.points_faibles : (Array.isArray(product?.points_faibles) ? product.points_faibles : []);
  const ficheTechnique = Array.isArray(summary?.fiche_technique) && summary.fiche_technique.length > 0 ? summary.fiche_technique : (Array.isArray(product?.fiche_technique) ? product.fiche_technique : []);
  const cycleDeVie = Array.isArray(summary?.cycle_de_vie) && summary.cycle_de_vie.length > 0 ? summary.cycle_de_vie : (Array.isArray(product?.cycle_de_vie) ? product.cycle_de_vie : []);
  const alternativeStr = summary?.alternative || product?.alternative;

  const realReviews = Array.isArray(product?.reviews) ? product.reviews : [];
  let topReviews: any[] = [...realReviews];

  const merchantReviews = [
    { source: 'Fnac', text: product.fnac_rev },
    { source: 'Darty', text: product.darty_rev },
    { source: 'Boulanger', text: product.boulanger_rev },
    { source: 'Rakuten', text: product.rakuten_rev }
  ].filter(r => r.text && r.text.trim() !== '');

  merchantReviews.forEach((m, idx) => {
    topReviews.push({
      id: `merchant-${m.source}-${idx}`,
      review_text: m.text,
      rating: 4.5,
      source: m.source,
      isAI: false
    });
  });

  topReviews = topReviews.slice(0, 3);

  if (!product) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      {/* Disclaimer Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-center gap-4 shadow-sm">
        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
          <Info size={18} />
        </div>
        <p className="text-amber-800 text-xs md:text-sm font-bold">
          Informations collectées automatiquement depuis des sources web. Consultez les sites marchands pour les avis officiels.
        </p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.02] text-[15rem] text-slate-900 pointer-events-none -rotate-12 translate-x-20 -translate-y-20">
          <i className="fas fa-comments"></i>
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Avis du Produit</h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 ${topReviews.length > 0 ? 'bg-emerald-500' : 'bg-slate-300'} rounded-full`}></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">
                  {topReviews.length > 0 ? "Sources web identifiées" : "Aucune donnée web"}
                </span>
              </div>
              {product.external_rating && (
                <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-full flex items-center gap-2 shadow-sm">
                  <Globe size={12} className="text-slate-500" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Note Web: {product.external_rating}/5</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-6 p-5 bg-[#0F172A] rounded-2xl shadow-xl border border-white/5">
            <div className="flex flex-col items-center">
              <StarRating rating={globalScore / 2} size="xs" />
              <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest mt-1">Score AVISSCORE</span>
            </div>
            <div className="h-10 w-px bg-white/10"></div>
            <div className="flex flex-col">
               <span className="text-3xl font-black text-white tracking-tighter leading-none">{ratingText}<span className="text-blue-500 text-lg ml-0.5">/10</span></span>
            </div>
          </div>
        </div>
        
        {topReviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            {topReviews.map((rev) => (
              <ProductReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic bg-slate-50 rounded-3xl border border-slate-100">
            Aucun résumé disponible pour ce produit.
          </div>
        )}
      </div>

      {/* Rest of the component follows similarly but with cleaned up labels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 flex flex-col bg-[#f8f9fa] p-10 rounded-[3rem] border border-slate-200 shadow-2xl relative overflow-hidden group/pros">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 mb-10 flex items-center justify-between border-b border-slate-200 pb-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
              <i className="fas fa-layer-group text-blue-600"></i>
              Analyse <span className="text-blue-600 italic">Détaillée</span>
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
                  <p className="text-[9px] text-emerald-500 font-black uppercase tracking-[0.2em] leading-none mt-1">Avantages</p>
                </div>
              </div>
              <ul className="space-y-4">
                {pointsForts.length > 0 ? pointsForts.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-500/30 hover:shadow-emerald-500/10 transition-all duration-300 border-l-4 border-l-emerald-500">
                    <span className="text-sm font-bold text-slate-700 leading-tight">{String(p)}</span>
                  </li>
                )) : (
                  <li className="text-slate-400 text-xs italic font-bold uppercase tracking-widest p-4">Non renseigné</li>
                )}
              </ul>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-500/10 rounded-xl flex items-center justify-center border border-rose-500/20 text-rose-600 shadow-rose-500/20 shadow-lg">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Points Faibles</h3>
                  <p className="text-[9px] text-rose-500 font-black uppercase tracking-[0.2em] leading-none mt-1">Limites</p>
                </div>
              </div>
              <ul className="space-y-4">
                {pointsFaibles.length > 0 ? pointsFaibles.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-rose-500/30 hover:shadow-rose-500/10 transition-all duration-300 border-l-4 border-l-rose-500">
                    <span className="text-sm font-bold text-slate-700 leading-tight">{String(p)}</span>
                  </li>
                )) : (
                  <li className="text-slate-400 text-xs italic font-bold uppercase tracking-widest p-4">Non renseigné</li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col relative overflow-hidden group">
          
          <div className="relative w-full aspect-square flex items-center justify-center z-10 mb-8">
            {product?.image_url ? (
              <img 
                src={product.image_url} 
                alt={String(product?.name || 'Produit Avisscore')} 
                className="relative max-h-full max-w-full object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.15)] group-hover:scale-105 transition-transform duration-700" 
              />
            ) : (
              <div className="text-slate-200 text-6xl"><i className="fas fa-image"></i></div>
            )}
          </div>

          <div className="flex flex-col gap-6 w-full">
            {alternativeStr && (
              <div className="w-full bg-blue-50/80 border border-blue-100 p-4 rounded-2xl flex items-center justify-between group/alt animate-in slide-in-from-top-4 duration-1000">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                    <i className="fas fa-right-left text-xs"></i>
                  </div>
                  <div>
                    <span className="block text-[8px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Alternative</span>
                    <span className="block text-xs font-black text-slate-800 tracking-tight">{alternativeStr.split('-')[0].trim()}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="text-center w-full relative z-10">
              <h1 className="text-3xl font-black text-slate-900 tracking-tighter mb-1 line-clamp-2 leading-tight">
                {String(product?.name || 'Produit')}
              </h1>
              <span className="text-blue-600 font-black text-[10px] uppercase tracking-widest">
                {String(product?.category || "Technologie")}
              </span>
            </div>

            {curPrice > 0 && (
              <div className={`w-full p-5 rounded-[2rem] border-2 transition-all duration-500 ${hasPriceError ? 'border-red-500 bg-red-50/30 ring-4 ring-red-500/10' : 'border-slate-100 bg-slate-50/50'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Prix Actuel</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black tracking-tighter ${hasPriceError ? 'text-red-600' : 'text-slate-900'}`}>
                        {curPrice.toFixed(2)}€
                      </span>
                      {refPrice > 0 && (
                        <span className="text-slate-400 font-bold line-through text-sm">
                          {refPrice.toFixed(2)}€
                        </span>
                      )}
                    </div>
                  </div>
                  {hasPriceError && (
                    <div className="bg-red-600 text-white px-3 py-1.5 rounded-xl font-black text-[8px] uppercase tracking-tighter flex items-center gap-1.5 shadow-xl shadow-red-500/30 animate-pulse">
                      <Flame size={12} />
                      Erreur de Prix
                    </div>
                  )}
                </div>
                
                {hasPriceError && (
                  <p className="text-red-500 font-bold text-[9px] uppercase tracking-widest mb-3 italic animate-bounce text-center">
                    ⏳ Dépêchez-vous ! Offre limitée
                  </p>
                )}

                {product.affiliate_link && (
                  <a 
                    href={product.affiliate_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-full py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-xl transition-all hover:-translate-y-1 active:scale-95 ${hasPriceError ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'}`}
                  >
                    VOIR L'OFFRE AMAZON
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="relative py-24 overflow-hidden bg-slate-900 rounded-[3rem] shadow-2xl">
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full border border-blue-500/20"
            >
              <Sparkles size={14} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthèse IA Avisscore</span>
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-tight">
              Questions <span className="text-blue-500 italic">Fréquentes</span>
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div 
                key={`faq-${i}`}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`group rounded-3xl border transition-all duration-500 overflow-hidden ${openFaq === i ? "bg-slate-800/60 border-blue-500/50 shadow-blue-500/10 shadow-2xl" : "bg-slate-800/20 border-white/5 hover:border-white/10"}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full p-8 flex items-center justify-between text-left gap-6"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${openFaq === i ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500"}`}>
                      <HelpCircle size={20} />
                    </div>
                    <h3 className={`text-lg font-black transition-colors ${openFaq === i ? "text-white" : "text-slate-300"}`}>{faq.q}</h3>
                  </div>
                  <ChevronDown className={`text-slate-500 transition-transform duration-500 ${openFaq === i ? "rotate-180 text-blue-500" : ""}`} size={20} />
                </button>
                
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                    >
                      <div className="px-8 pb-8 pl-[5.5rem]">
                        <p className="text-slate-400 font-medium leading-relaxed italic text-lg border-l-2 border-blue-500/30 pl-6">
                          "{faq.a}"
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-[#0F172A] rounded-[3rem] p-10 shadow-2xl relative overflow-hidden border border-blue-500/20">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
          
          <div className="relative z-10 flex items-center justify-between mb-12 border-b border-white/5 pb-8">
            <h3 className="text-4xl font-black text-white tracking-tighter flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                <i className="fas fa-microchip text-blue-400 text-2xl"></i>
              </div>
              Spécifications
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10">
            {ficheTechnique.length > 0 ? ficheTechnique.map((f, i) => {
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
            }) : (
              <div className="col-span-full p-8 text-center text-slate-500 font-bold uppercase tracking-widest text-xs italic">Aucune fiche technique renseignée.</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-8 flex flex-col">
          <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-xl flex flex-col">
            <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
              <i className="fas fa-sync-alt text-blue-600"></i> Cycle de Vie
            </h3>
            
            {cycleDeVie.length > 0 ? (
              <div className="bg-blue-50/50 rounded-3xl p-6 border border-blue-100 mb-6 flex-1">
                <div className="space-y-3">
                  {cycleDeVie.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-1.5 shrink-0"></div>
                      <p className="text-slate-600 text-xs font-bold">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic font-bold flex-1">Non renseigné.</div>
            )}

            <div className="mt-2 pt-8 border-t border-slate-50">
              <p className="text-slate-600 leading-relaxed text-sm font-medium italic">
                {summary?.review_text?.[0] || product?.review_text || product?.description || "Aucune description détaillée n'est disponible pour le moment."}
              </p>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <i className="fas fa-fingerprint text-blue-500"></i> Données analysées par Avisscore
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
