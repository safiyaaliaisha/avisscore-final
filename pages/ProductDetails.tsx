
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, ShoppingCart, Sparkles, Star, Zap, Clock, Milestone, 
  Calendar, HelpCircle, Wallet, TrendingDown, Flame, BarChart3
} from 'lucide-react';
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

  const expertStats = useMemo(() => {
    const verdict = summary?.verdict || "ANALYSE EN COURS";
    const economie = summary?.economie || "Stable";
    const scoreOpp = summary?.score_opportunite || "7/10";
    const healthValue = parseInt(scoreOpp.split('/')[0]) * 10 || 70;

    const isUrgent = verdict.includes("URGENCE");
    const isWait = verdict.includes("ATTENDRE");
    const isBuy = verdict.includes("ACHETER") || isUrgent;

    return {
      verdict,
      economie,
      scoreOpp,
      healthValue,
      statusConfig: {
        label: verdict,
        color: isUrgent ? "bg-rose-600" : isWait ? "bg-amber-500" : isBuy ? "bg-emerald-500" : "bg-blue-600",
        icon: isUrgent ? <Flame size={24} className="animate-pulse" /> : isWait ? <Clock size={24} /> : <Zap size={24} />,
        desc: isUrgent ? "PRIX AU PLUS BAS" : isWait ? "Attendez une baisse" : "C'est le moment d'acheter"
      }
    };
  }, [summary]);

  const bestPrice = useMemo(() => {
    const pList = [product.fnac_price, product.darty_price, product.amazon_price, product.boulanger_price, product.current_price].filter(v => v && v > 0);
    return pList.length > 0 ? Math.min(...pList as number[]) : product.current_price || 0;
  }, [product]);

  const renderValueSafe = (val: any) => {
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') return val.content || val.text || val.value || JSON.stringify(val);
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in duration-700">
      <Helmet>
        <title>{product.seo_title || `${product.name} - Verdict Expert`}</title>
        <meta name="description" content={product.seo_description || product.description} />
      </Helmet>

      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Retour au catalogue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-start">
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center p-8">
             <AnimatePresence mode="wait">
               <motion.img 
                key={activeImage}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                src={images[activeImage]} 
                className="max-h-full max-w-full object-contain drop-shadow-2xl" 
                alt={product.name}
               />
             </AnimatePresence>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-20 rounded-2xl bg-white border-2 flex items-center justify-center p-2 shrink-0 transition-all ${activeImage === i ? 'border-blue-600 shadow-lg' : 'border-slate-100'}`}>
                <img src={img} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 flex flex-col h-full justify-center">
          <div className="space-y-4">
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{product.category}</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <StarRating rating={product.rating || 4.5} count={142} />
              <div className="h-4 w-px bg-slate-200"></div>
              <span className="text-blue-600 font-black text-lg">Score Global: {(product.score || 8.5).toFixed(1)}/10</span>
            </div>
          </div>

          <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Meilleur prix web</span>
                <span className="text-4xl font-black text-slate-900">{bestPrice.toFixed(2)}€</span>
              </div>
              <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg">EN STOCK</div>
            </div>
            {product.affiliate_link && (
              <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all">
                DÉCOUVRIR L'OFFRE <ShoppingCart size={18} />
              </a>
            )}
          </div>
          
          <div className="p-8 bg-[#0F172A] rounded-[2rem] text-white shadow-2xl">
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">Verdict Technique Final</h3>
            <p className="text-lg font-bold italic leading-relaxed">"{renderValueSafe(product.verdict_technique) || "Le verdict de nos experts est en cours de finalisation."}"</p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 flex gap-8 mb-12 overflow-x-auto scrollbar-hide">
        {['summary', 'specs', 'faq'].map(id => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`pb-6 text-[11px] font-black uppercase tracking-[0.2em] relative shrink-0 ${activeTab === id ? 'text-blue-600' : 'text-slate-400'}`}>
            {id === 'summary' ? 'Analyse Web' : id === 'specs' ? 'Fiche Technique' : 'FAQ & Price Index'}
            {activeTab === id && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'summary' && <ReviewCard product={product} summary={summary} />}
        
        {activeTab === 'specs' && (
          <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-slate-50">
             <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3"><Milestone className="text-blue-600" /> Spécifications techniques</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(Array.isArray(product.fiche_technique) ? product.fiche_technique : []).map((s: any, i: number) => {
                  const rawText = renderValueSafe(s);
                  return (
                    <div key={i} className="flex justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-colors">
                      <span className="text-[10px] font-black text-slate-400 uppercase">{rawText.includes(':') ? rawText.split(':')[0] : 'Caractéristique'}</span>
                      <span className="text-sm font-black text-slate-900">{rawText.includes(':') ? rawText.split(':')[1] : rawText}</span>
                    </div>
                  );
                })}
                {(!product.fiche_technique || product.fiche_technique.length === 0) && (
                  <p className="text-slate-400 italic">Données techniques en cours de mise à jour.</p>
                )}
             </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-10">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`${expertStats.statusConfig.color} p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden`}>
                  <div className="relative z-10 flex flex-col items-center text-center gap-6">
                     <div className="bg-white/20 px-6 py-2 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                        {expertStats.statusConfig.icon} Price Index
                     </div>
                     <h2 className="text-5xl font-black tracking-tighter leading-none">{expertStats.statusConfig.label}</h2>
                     <p className="text-white/80 font-black italic text-lg leading-tight">"{expertStats.statusConfig.desc}"</p>
                  </div>
               </motion.div>
            </div>
            <div className="lg:col-span-7 bg-white rounded-[4rem] p-12 shadow-2xl border border-slate-50">
               <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4"><HelpCircle className="text-blue-600" /> Questions Fréquentes</h2>
               <div className="space-y-6">
                 {(Array.isArray(product.faq) ? product.faq : []).map((item: any, i: number) => (
                   <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 transition-all group">
                      <h4 className="font-black text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{renderValueSafe(item.question || item.q || "Question")}</h4>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed">{renderValueSafe(item.answer || item.a || "Réponse non disponible")}</p>
                   </div>
                 ))}
                 {(!product.faq || product.faq.length === 0) && (
                   <p className="text-slate-400 italic">Aucune question fréquente disponible pour le moment.</p>
                 )}
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
