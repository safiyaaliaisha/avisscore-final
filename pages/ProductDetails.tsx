
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ShoppingCart, Info, Sparkles, CheckCircle, Layout, HelpCircle, ChevronRight, Star, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product, ProductSummary } from '../types';
import { ReviewCard } from '../components/ReviewCard';

interface ProductDetailsProps {
  product: Product;
  summary: ProductSummary | null;
  popularProducts: Product[];
  onBack: () => void;
}

const StarRating = ({ rating, count }: { rating: number; count?: number }) => {
  return (
    <div className="flex items-center gap-2">
      <div className="flex text-amber-500 gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} className={i < Math.floor(rating) ? "fill-amber-500" : "text-slate-200"} />
        ))}
      </div>
      {count && <span className="text-[10px] font-bold text-slate-400">({count} avis)</span>}
    </div>
  );
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, summary, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'specs' | 'faq'>('summary');
  const images = Array.isArray(product.image_url) ? product.image_url : [product.image_url || ""];
  const [activeImage, setActiveImage] = useState(0);

  // Best Price Logic
  const bestPrice = useMemo(() => {
    const prices = [
      { val: product.fnac_price, name: 'Fnac' },
      { val: product.darty_price, name: 'Darty' },
      { val: product.amazon_price, name: 'Amazon' },
      { val: product.boulanger_price, name: 'Boulanger' },
      { val: product.current_price, name: 'Direct' }
    ].filter(p => p.val && p.val > 0);
    
    if (prices.length === 0) return null;
    return prices.reduce((prev, curr) => (prev.val! < curr.val! ? prev : curr));
  }, [product]);

  const alternatives = useMemo(() => {
    const list = summary?.alternatives || (product.alternative ? [product.alternative] : []);
    return list.filter(Boolean);
  }, [summary, product]);

  const faqs = useMemo(() => {
    const rawData = product.faq;
    if (!rawData) return [];
    try {
      const items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      return (Array.isArray(items) ? items : [items]).map((i: any) => ({
        q: i.question || i.q || "",
        a: i.answer || i.a || ""
      })).filter(f => f.q && f.a);
    } catch (e) { return []; }
  }, [product.faq]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-700">
      <Helmet>
        <title>{product.seo_title || `${product.name} - Verdict Expert`}</title>
        <meta name="description" content={product.seo_description} />
      </Helmet>

      {/* Breadcrumb / Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Retour au catalogue</span>
      </button>

      {/* Hero Section: Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-start">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center p-8 group relative">
             <AnimatePresence mode="wait">
               <motion.img 
                key={activeImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                src={images[activeImage]} 
                className="max-h-full max-w-full object-contain drop-shadow-2xl" 
                alt={product.name}
               />
             </AnimatePresence>
             <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Angle {activeImage + 1} / {images.length}
             </div>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(i)}
                className={`w-20 h-20 rounded-2xl bg-white border-2 flex items-center justify-center p-2 shrink-0 transition-all ${activeImage === i ? 'border-blue-600 shadow-lg scale-105' : 'border-slate-100 hover:border-slate-300'}`}
              >
                <img src={img} className="max-h-full max-w-full object-contain" alt={`Thumbnail ${i}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="space-y-8 flex flex-col h-full justify-center">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.category}</span>
              {bestPrice && <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">En Stock</span>}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <StarRating rating={product.external_rating || 4.5} count={product.external_review_count || 128} />
              <div className="h-4 w-px bg-slate-200"></div>
              <span className="text-blue-600 font-black text-lg">Score IA: {(product.score || 8.5).toFixed(1)}/10</span>
            </div>
          </div>

          {/* Enhanced Alternatives Cards Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                <Sparkles size={12} className="text-blue-500" /> Alternatives recommandées
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {alternatives.length > 0 ? alternatives.map((alt, i) => (
                <div key={i} className="group relative overflow-hidden bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-blue-500/20 transition-all duration-500 cursor-pointer">
                  {/* Decorative background element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -translate-y-12 translate-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-500">
                          <Zap size={18} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Top Alternative</span>
                          <span className="font-black text-slate-900 text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">{alt}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="flex items-center gap-1.5">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-bold text-slate-400">Choix Premium</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-slate-300 group-hover:text-blue-600 transition-colors uppercase tracking-widest">
                        Détails <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-2 py-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin"></div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Recherche d'alternatives...</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meilleur prix trouvé</span>
                {bestPrice ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-slate-900">{bestPrice.val?.toFixed(2)}€</span>
                    <span className="text-slate-400 text-sm font-bold">via {bestPrice.name}</span>
                  </div>
                ) : (
                  <span className="text-xl font-black text-blue-600 italic">Prix en cours de mise à jour</span>
                )}
              </div>
              {product.reference_price && product.current_price && product.reference_price > product.current_price && (
                <div className="bg-rose-600 text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg">
                  -{Math.round(((product.reference_price - product.current_price) / product.reference_price) * 100)}%
                </div>
              )}
            </div>

            {product.affiliate_link ? (
              <a 
                href={product.affiliate_link} 
                target="_blank" 
                className="w-full bg-blue-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all group"
              >
                ACHETER MAINTENANT <ShoppingCart size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            ) : (
              <div className="w-full bg-slate-200 text-slate-400 h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 cursor-not-allowed shadow-inner">
                BIENTÔT DISPONIBLE <Info size={18} />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <CheckCircle size={14} className="text-emerald-500" /> Livraison gratuite
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <CheckCircle size={14} className="text-emerald-500" /> Garantie 2 ans
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-100 flex gap-8 mb-12 overflow-x-auto scrollbar-hide">
        {[
          { id: 'summary', label: 'RÉSUMÉ IA & WEB', icon: Sparkles },
          { id: 'specs', label: 'SPÉCIFICATIONS', icon: Layout },
          { id: 'faq', label: 'FAQ & CYCLE', icon: HelpCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 pb-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative shrink-0 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon size={16} />
            {tab.label}
            {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'summary' && (
          <div className="space-y-12">
            <ReviewCard product={product} summary={summary} />
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Fiche Technique</h3>
                <div className="space-y-4">
                  {(product.fiche_technique || summary?.fiche_technique || []).map((spec, i) => {
                    const parts = spec.split(':');
                    const k = parts[0];
                    const v = parts.slice(1).join(':');
                    return (
                      <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k}</span>
                        <span className="text-sm font-black text-slate-900">{v || "N/A"}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-8">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Comparaison Directe</h3>
                <div className="space-y-4">
                  {alternatives.map((alt, i) => (
                    <div key={i} className="flex items-center justify-between p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100 group cursor-pointer hover:bg-blue-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm"><Sparkles className="text-blue-600" size={20} /></div>
                        <span className="font-black text-slate-900">{alt}</span>
                      </div>
                      <ChevronRight size={20} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl">
              <h3 className="text-3xl font-black tracking-tighter mb-12">Questions fréquentes</h3>
              <div className="space-y-6">
                {faqs.map((f, i) => (
                  <div key={i} className="space-y-3 p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="font-black text-blue-400 uppercase tracking-widest text-[10px]">Question {i+1}</p>
                    <p className="font-black text-lg">{f.q}</p>
                    <p className="text-slate-400 font-medium italic border-l border-white/20 pl-4">{f.a}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-[3rem] border border-slate-100 p-12 shadow-2xl">
               <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-12">Cycle de vie du produit</h3>
               <div className="relative pl-8 space-y-12">
                  <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                  {(product.cycle_de_vie || summary?.cycle_de_vie || []).map((step, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[37px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-lg"></div>
                      <p className="font-black text-slate-900 leading-relaxed italic text-lg">{step}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
