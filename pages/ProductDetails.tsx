
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, ShoppingCart, Star, Zap, Clock, Milestone, 
  HelpCircle, Flame, Palette, Layers, Hash, Factory, Maximize, 
  Battery, Weight, Ruler, Brush, Type, Info
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

const getSpecIcon = (label: string) => {
  const l = label.toLowerCase();
  if (l.includes('fabricant') || l.includes('marque')) return <Factory size={16} />;
  if (l.includes('poids')) return <Weight size={16} />;
  if (l.includes('dimension') || l.includes('taille')) return <Maximize size={16} />;
  if (l.includes('watt') || l.includes('puissance') || l.includes('tension')) return <Zap size={16} />;
  if (l.includes('matière') || l.includes('matériau')) return <Layers size={16} />;
  if (l.includes('couleur')) return <Palette size={16} />;
  if (l.includes('référence') || l.includes('modèle')) return <Hash size={16} />;
  if (l.includes('batterie') || l.includes('pile')) return <Battery size={16} />;
  if (l.includes('style')) return <Brush size={16} />;
  if (l.includes('type')) return <Type size={16} />;
  return <Info size={16} />;
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, summary, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'specs' | 'faq'>('summary');
  const images = Array.isArray(product.image_url) ? product.image_url : [product.image_url || ""];
  const [activeImage, setActiveImage] = useState(0);

  const bestPrice = product.current_price || 0;

  const smartParser = (val: any): { label: string; value: string } | null => {
    if (!val) return null;
    
    // Si c'est un objet genre { "Processeur": "M3" }
    if (typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.length > 0) {
        const k = keys[0];
        return { label: k, value: String(val[k]) };
      }
    }
    
    // Si c'est un string "Couleur: Noir"
    const s = String(val).replace(/[\[\]{}"]/g, '').trim();
    if (s.includes(':')) {
      const parts = s.split(':');
      return { label: parts[0].trim(), value: parts.slice(1).join(':').trim() };
    }
    
    if (s.length > 1) return { label: "Spécification", value: s };
    return null;
  };

  const cleanVal = (v: any) => String(v || "").replace(/[\[\]{}"]/g, '').trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in">
      <Helmet><title>{product.name} - AvisScore</title></Helmet>

      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Retour au catalogue</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-start">
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center p-8">
             <img src={images[activeImage]} className="max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-500" alt={product.name} />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-20 rounded-2xl bg-white border-2 flex items-center justify-center p-2 shrink-0 transition-all ${activeImage === i ? 'border-blue-600 shadow-lg' : 'border-slate-100'}`}>
                <img src={img} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-8 flex flex-col justify-center">
          <div className="space-y-4">
            <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{product.category || 'Tech'}</span>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-tight">{product.name}</h1>
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
               <div className="flex text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => <Star key={i} size={16} className={i < Math.floor(product.rating || 4.5) ? "fill-amber-500" : "text-slate-200"} />)}
               </div>
               <div className="h-4 w-px bg-slate-200"></div>
               <span className="text-blue-600 font-black text-lg">Note: {(product.score || 8.5).toFixed(1)}/10</span>
            </div>
          </div>

          <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-2">PRIX ACTUEL</span>
                <span className="text-5xl font-black text-slate-900">{bestPrice.toFixed(2)}€</span>
              </div>
              <div className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black text-[10px] shadow-lg">DISPONIBLE</div>
            </div>
            {product.affiliate_link && (
              <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white h-16 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 transition-all active:scale-95">
                DÉCOUVRIR LE PRODUIT <ShoppingCart size={18} />
              </a>
            )}
          </div>
          
          <div className="p-8 bg-[#0F172A] rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Zap size={40} /></div>
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3 relative z-10">Verdict de nos experts</h3>
            <p className="text-xl font-bold italic leading-relaxed relative z-10">
              "{cleanVal(product.verdict_technique) || "L'analyse complète confirme l'excellence de ce modèle sur son segment."}"
            </p>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-100 flex gap-12 mb-12 overflow-x-auto scrollbar-hide">
        {['summary', 'specs', 'faq'].map(id => (
          <button key={id} onClick={() => setActiveTab(id as any)} className={`pb-6 text-[12px] font-black uppercase tracking-[0.3em] relative transition-colors ${activeTab === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {id === 'summary' ? 'Analyse & Avis' : id === 'specs' ? 'Fiche Technique' : 'FAQ & Info'}
            {activeTab === id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'summary' && <ReviewCard product={product} summary={summary} />}
        
        {activeTab === 'specs' && (
          <div className="bg-emerald-50/50 rounded-[3.5rem] p-10 md:p-16 border border-emerald-100 shadow-xl">
             <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4"><Milestone className="text-emerald-600" size={32} /> Spécifications techniques</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Array.isArray(product.fiche_technique) ? product.fiche_technique : []).map((s: any, i: number) => {
                  const parsed = smartParser(s);
                  if (!parsed) return null;
                  return (
                    <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-emerald-100 hover:border-emerald-300 transition-all shadow-sm group">
                      <div className="flex items-center gap-5 flex-1">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
                          {getSpecIcon(parsed.label)}
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{parsed.label}</span>
                      </div>
                      <span className="text-base font-black text-slate-900 ml-4 text-right flex-1">{parsed.value}</span>
                    </div>
                  );
                })}
                {(!product.fiche_technique || product.fiche_technique.length === 0) && (
                  <div className="col-span-full py-24 text-center">
                    <p className="text-slate-400 text-lg font-bold italic">Données techniques non disponibles pour ce modèle.</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'faq' && (
          <div className="bg-white rounded-[3.5rem] p-10 md:p-16 border border-slate-100 shadow-2xl">
             <h2 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-4"><HelpCircle className="text-blue-600" size={32} /> Questions Fréquentes</h2>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {(Array.isArray(product.faq) ? product.faq : []).map((f: any, i: number) => (
                  <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 hover:bg-white hover:border-blue-200 transition-all shadow-sm">
                    <h4 className="font-black text-slate-900 mb-4 text-lg">{cleanVal(f.question || f.q || "Question")}</h4>
                    <p className="text-slate-600 font-medium leading-relaxed">{cleanVal(f.answer || f.a || "Réponse en attente d'expertise.")}</p>
                  </div>
                ))}
                {(!product.faq || product.faq.length === 0) && (
                  <p className="col-span-full text-center text-slate-400 font-bold py-12">Aucune FAQ disponible pour ce produit.</p>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
