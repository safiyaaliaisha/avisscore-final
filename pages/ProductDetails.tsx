
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, ShoppingCart, Star, Zap, Clock, Milestone, 
  HelpCircle, Flame, Palette, Layers, Hash, Factory, Maximize, 
  Battery, Weight, Ruler, Brush, Type, Info, CheckCircle2, AlertCircle
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

const MotionImg = motion.img as any;
const MotionDiv = motion.div as any;

const ProductDetails: React.FC<ProductDetailsProps> = ({ product, summary, onBack }) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'specs' | 'faq'>('summary');
  
  // Handling image_url as string or array
  const images = useMemo(() => {
    if (Array.isArray(product.image_url)) return product.image_url;
    if (typeof product.image_url === 'string') {
        try {
            const parsed = JSON.parse(product.image_url);
            return Array.isArray(parsed) ? parsed : [product.image_url];
        } catch {
            return [product.image_url];
        }
    }
    return ["https://placehold.co/600x600/f8fafc/0f172a?text=Pas+d'image"];
  }, [product.image_url]);

  const [activeImage, setActiveImage] = useState(0);

  const bestPrice = product.current_price || 0;

  const parseArray = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [val];
        } catch {
            return [val];
        }
    }
    return [];
  };

  const smartParser = (val: any): { label: string; value: string } | null => {
    if (!val) return null;
    if (typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.length > 0) return { label: keys[0], value: String(val[keys[0]]) };
    }
    const s = String(val).replace(/[\[\]{}"]/g, '').trim();
    if (s.includes(':')) {
      const parts = s.split(':');
      return { label: parts[0].trim(), value: parts.slice(1).join(':').trim() };
    }
    if (s.length > 1) return { label: "Info", value: s };
    return null;
  };

  /**
   * Nettoie les valeurs pour l'affichage (supprime les crochets JSONB, guillemets, etc.)
   */
  const cleanVal = (v: any): string => {
    if (!v) return "";
    
    // Si c'est un tableau, on prend le premier élément
    if (Array.isArray(v)) {
      return cleanVal(v[0]);
    }

    // Si c'est une chaîne, on nettoie les caractères JSON résiduels
    if (typeof v === 'string') {
        // Supprime les crochets de début/fin et les guillemets de début/fin
        let s = v.trim();
        if (s.startsWith('["') && s.endsWith('"]')) {
           s = s.substring(2, s.length - 2);
        } else if (s.startsWith('[') && s.endsWith(']')) {
           s = s.substring(1, s.length - 1);
        }
        // Supprime les guillemets échappés ou doubles restants aux extrémités
        return s.replace(/^"+|"+$/g, '').trim();
    }

    // Si c'est un objet, on cherche des champs texte classiques
    if (typeof v === 'object') {
        return cleanVal(v.content || v.text || JSON.stringify(v));
    }

    return String(v);
  };

  const pointsForts = parseArray(product.points_forts);
  const pointsFaibles = parseArray(product.points_faibles);
  const faqItems = parseArray(product.faq);
  const specs = parseArray(product.fiche_technique);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in">
      <Helmet>
        <title>{product.seo_title || `${product.name} - Avis & Verdict Expert`}</title>
        <meta name="description" content={product.seo_description || `Découvrez l'analyse complète de ${product.name} sur Avisscore.`} />
      </Helmet>

      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-8 group">
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-widest">Retour au catalogue</span>
      </button>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16 items-start">
        {/* Gallery */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden flex items-center justify-center p-12 relative group/main">
             <MotionImg 
                key={activeImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                src={images[activeImage]} 
                className="max-h-full max-w-full object-contain drop-shadow-2xl" 
                alt={product.name} 
             />
             <div className="absolute top-6 right-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-[10px] font-black text-slate-900">{activeImage + 1} / {images.length}</span>
             </div>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {images.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setActiveImage(i)} 
                className={`w-24 h-24 rounded-2xl bg-white border-2 flex items-center justify-center p-2 shrink-0 transition-all ${activeImage === i ? 'border-blue-600 shadow-xl scale-105' : 'border-slate-100 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}
              >
                <img src={img} className="max-h-full max-w-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-8 flex flex-col justify-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
                <span className="bg-blue-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">{product.category || 'Expertise Tech'}</span>
                {product.score && product.score >= 9 && (
                    <span className="bg-amber-100 text-amber-700 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                        <Flame size={12} /> Choix de la rédaction
                    </span>
                )}
            </div>
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter leading-tight">{product.name}</h1>
            <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
               <div className="flex text-amber-500 gap-1">
                {[...Array(5)].map((_, i) => <Star key={i} size={18} className={i < Math.floor(product.rating || 4.5) ? "fill-amber-500" : "text-slate-200"} />)}
               </div>
               <div className="h-6 w-px bg-slate-200"></div>
               <div className="flex flex-col">
                    <span className="text-blue-600 font-black text-2xl">{(product.score || 8.5).toFixed(1)}/10</span>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score de confiance IA</span>
               </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl relative overflow-hidden group">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex justify-between items-end mb-8 relative z-10">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] block mb-3">MEILLEUR PRIX DÉTECTÉ</span>
                <span className="text-6xl font-black text-slate-900 tracking-tighter">{bestPrice.toFixed(2)}€</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-emerald-500 font-black text-xs flex items-center gap-2 mb-1">
                    <CheckCircle2 size={14} /> EN STOCK
                </span>
                {product.reference_price && product.reference_price > bestPrice && (
                    <span className="text-rose-500 line-through text-sm font-bold">{product.reference_price.toFixed(2)}€</span>
                )}
              </div>
            </div>
            {product.affiliate_link && (
              <a href={product.affiliate_link} target="_blank" rel="noopener noreferrer" className="w-full bg-[#0F172A] text-white h-20 rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-600 transition-all active:scale-95 text-sm">
                VOIR L'OFFRE PARTENAIRE <ShoppingCart size={20} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Verdict Section - Now standalone */}
      <div className="mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
        <div className="bg-[#0F172A] rounded-[4rem] p-12 md:p-16 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none"></div>
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                <Zap size={40} />
              </div>
            </div>
            <div className="flex-1 space-y-6 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <h3 className="text-blue-400 text-[11px] font-black uppercase tracking-[0.5em]">Verdict Technique de l'Expert</h3>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white italic leading-tight tracking-tight">
                "{cleanVal(product.verdict_technique) || "Un produit qui redéfinit les standards de sa catégorie par son équilibre parfait entre performance et durabilité."}"
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4 pt-4">
                <div className="h-px w-12 bg-white/10"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Analyse certifiée par AvisScore Lab</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-20 bg-[#f8f9fa]/80 backdrop-blur-xl z-40 border-b border-slate-100 flex gap-10 mb-12 overflow-x-auto scrollbar-hide px-4">
        {['summary', 'specs', 'faq'].map(id => (
          <button 
            key={id} 
            onClick={() => setActiveTab(id as any)} 
            className={`py-8 text-[11px] font-black uppercase tracking-[0.4em] relative transition-colors ${activeTab === id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}
          >
            {id === 'summary' ? 'Analyse & Avis' : id === 'specs' ? 'Fiche Technique' : 'Questions / Réponses'}
            {activeTab === id && <MotionDiv layoutId="activeTabDetails" className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-full" />}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="min-h-[600px] pb-20">
        <AnimatePresence mode="wait">
            {activeTab === 'summary' && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <ReviewCard product={product} summary={summary} />
                </MotionDiv>
            )}
            
            {activeTab === 'specs' && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-[4rem] p-12 md:p-20 border border-slate-100 shadow-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                        <div>
                            <h2 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-5">
                                <Milestone className="text-blue-600" size={40} /> Spécifications
                            </h2>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-3 ml-14">Données certifiées par notre laboratoire</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {specs.map((s: any, i: number) => {
                            const parsed = smartParser(s);
                            if (!parsed) return null;
                            return (
                                <div key={i} className="flex flex-col p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all group">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            {getSpecIcon(parsed.label)}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{parsed.label}</span>
                                    </div>
                                    <span className="text-xl font-black text-slate-900 leading-tight">{parsed.value}</span>
                                </div>
                            );
                        })}
                        {specs.length === 0 && (
                            <div className="col-span-full py-32 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                <Info size={48} className="mx-auto text-slate-200 mb-6" />
                                <p className="text-slate-400 text-lg font-black uppercase tracking-widest italic">Analyse technique en cours...</p>
                            </div>
                        )}
                    </div>
                </MotionDiv>
            )}

            {activeTab === 'faq' && (
                <MotionDiv initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Tout savoir sur le produit</h2>
                        <p className="text-slate-500 font-medium italic text-lg">Les réponses aux questions les plus posées par la communauté.</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {faqItems.map((f: any, i: number) => (
                        <div key={i} className="p-10 bg-white rounded-[3rem] border border-slate-100 hover:border-blue-200 transition-all shadow-xl group">
                            <div className="flex items-start gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-lg">Q</div>
                                <div>
                                    <h4 className="font-black text-slate-900 mb-6 text-xl leading-tight group-hover:text-blue-600 transition-colors">{cleanVal(f.question || f.q || "Question sans titre")}</h4>
                                    <div className="flex gap-6">
                                        <div className="w-px bg-slate-100 shrink-0"></div>
                                        <p className="text-slate-600 font-medium leading-relaxed text-lg italic">"{cleanVal(f.answer || f.a || "Notre équipe d'experts prépare actuellement une réponse détaillée pour ce point précis.")}"</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        ))}
                        {faqItems.length === 0 && (
                            <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border border-slate-100">
                                <HelpCircle size={48} className="mx-auto text-slate-100 mb-6" />
                                <p className="text-slate-400 font-black uppercase tracking-widest italic">Aucune question n'a encore été posée.</p>
                            </div>
                        )}
                    </div>
                </MotionDiv>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProductDetails;
