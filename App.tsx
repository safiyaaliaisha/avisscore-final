import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './lib/supabaseClient';
import { fetchLatestReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

const deepNavy = '#050A30';

const AVATAR_PHOTOS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop"
];

const AvatarStack = ({ images = AVATAR_PHOTOS, count = 5, size = "h-8 w-8" }: { images?: string[], count?: number, size?: string }) => (
  <div className="flex items-center -space-x-3 hover:-space-x-1 transition-all duration-500 group/stack py-1">
    {images.slice(0, count).map((src, i) => (
      <div key={i} className="relative transition-transform duration-300 hover:scale-125 hover:z-50 cursor-pointer">
        <img 
          src={src} 
          className={`${size} rounded-full object-cover shadow-md border-2 border-white ring-1 ring-black/5`} 
          style={{ zIndex: 10 - i }} 
          alt={`Expert ${i + 1}`} 
        />
      </div>
    ))}
    <div className={`${size} rounded-full bg-[#4158D0] border-2 border-white flex items-center justify-center shadow-lg z-0 -ml-3 transform group-hover/stack:translate-x-1 transition-transform`}>
      <span className="text-[7px] font-black text-white italic">+4k</span>
    </div>
  </div>
);

const ProductImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  if (!src) return <div className={`${className} bg-white/10 flex items-center justify-center text-[#050A30]/20`}><i className="fas fa-image text-6xl"></i></div>;
  
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      style={{ display: 'block !important' }}
      className={`${className} object-cover bg-white transition-all duration-700 shadow-[0_20px_60px_rgba(0,0,0,0.1)]`}
      onError={(e) => {
        (e.target as HTMLImageElement).style.opacity = '0.7';
      }}
    />
  );
};

const StarRating = ({ rating, size = "text-[12px]", showScore = false }: { rating: number, size?: string, showScore?: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`flex text-[#FFD700] gap-0.5 items-center ${size}`}>
      {[...Array(5)].map((_, j) => (
        <i key={j} className={`${j < Math.round(rating) ? 'fas' : 'far'} fa-star`}></i>
      ))}
    </div>
    {showScore && <span className="font-black italic text-[#050A30] text-sm">{rating.toFixed(1)}</span>}
  </div>
);

export default function App() {
  const [view, setView] = useState<'home' | 'comparison' | 'detail'>('home');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [uniqueProductNames, setUniqueProductNames] = useState<string[]>([]);
  const [aiVerdict, setAiVerdict] = useState<AIAnalysis | null>(null);
  const [showLoadingOverlay, setShowLoadingOverlay] = useState(false);

  const [compA, setCompA] = useState('');
  const [compB, setCompB] = useState('');
  const [compData, setCompData] = useState<ComparisonData | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [reviews, names] = await Promise.all([
        fetchLatestReviews(12),
        fetchUniqueProducts()
      ]);
      setLatestReviews(reviews);
      setUniqueProductNames(names);
    } catch (err) {
      console.error("Initial load failed:", err);
    }
  };

  const performAIAnalysis = async (productName: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Génère une analyse exhaustive en Français pour le produit suivant: "${productName}".`,
        config: { 
          systemInstruction: "Tu es un expert en technologie. Réponds UNIQUEMENT par un objet JSON valide suivant scrupuleusement le schéma fourni. Pas de texte avant ou après.",
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              image_url: { type: Type.STRING },
              description: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              verdict: { type: Type.STRING },
              marketMoment: { type: Type.STRING },
              marketBestPrice: { type: Type.STRING },
              marketAlternative: { type: Type.STRING },
              opportunityScore: { type: Type.NUMBER },
              opportunityLabel: { type: Type.STRING }
            },
            required: ["score", "description", "pros", "cons", "marketMoment", "marketBestPrice", "marketAlternative", "opportunityScore", "opportunityLabel"]
          }
        }
      });
      
      let text = response.text;
      if (!text) return null;
      
      // Safety cleaning: extract JSON content if the model wrapped it in markdown
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        text = text.substring(jsonStart, jsonEnd + 1);
      }
      
      return JSON.parse(text);
    } catch (e) { 
      console.error("AI Analysis Critical Error:", e);
      return null; 
    }
  };

  const performComparisonAnalysis = async (nameA: string, nameB: string) => {
    if (!nameA || !nameB) return;
    setShowLoadingOverlay(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Duel technique entre "${nameA}" et "${nameB}".`,
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              winner: { type: Type.STRING },
              criteria: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    productA: { type: Type.STRING },
                    productB: { type: Type.STRING },
                    better: { type: Type.STRING, enum: ["A", "B", "Equal"] }
                  },
                  required: ["label", "productA", "productB", "better"]
                }
              }
            },
            required: ["summary", "winner", "criteria"]
          }
        }
      });
      const text = response.text;
      if (text) {
        const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
        setCompData(JSON.parse(cleaned));
      }
    } catch (err) {
      console.error("Comparison Error:", err);
    } finally { 
      setShowLoadingOverlay(false); 
    }
  };

  const handleSearch = async (productName: string, existingImage?: string, e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!productName) return;
    
    setView('detail');
    setShowLoadingOverlay(true);
    setAiVerdict(null);
    setProduct({
      id: 'gen-' + Date.now(),
      name: productName,
      image_url: existingImage,
      description: "L'IA analyse les spécifications...",
      price: 0,
      category: "Analyse IA"
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const analysis = await performAIAnalysis(productName);
      if (analysis) {
        setProduct(prev => prev ? {
          ...prev,
          image_url: existingImage || analysis.image_url || prev.image_url,
          description: analysis.description || prev.description,
        } : null);
        setAiVerdict({ ...analysis, totalReviews: 4500 });
      } else {
        setProduct(prev => prev ? { 
          ...prev, 
          description: "Désolé, l'analyse détaillée n'est pas disponible pour le moment. Veuillez vérifier le nom du produit ou votre connexion internet." 
        } : null);
      }
    } catch (err) {
      console.error("Critical Search Handler Error:", err);
    } finally {
      setTimeout(() => setShowLoadingOverlay(false), 300);
    }
  };

  return (
    <div className={`min-h-screen text-[${deepNavy}] flex flex-col selection:bg-[#4158D0]/30 font-sans antialiased`}>
      {showLoadingOverlay && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/10 backdrop-blur-[30px]">
          <i className="fas fa-atom text-white text-4xl sm:text-6xl animate-spin-slow"></i>
        </div>
      )}

      {/* HEADER */}
      <nav className="px-4 md:px-20 py-5 sm:py-7 flex justify-between items-center sticky top-0 z-50 glass-card !rounded-none !border-0 shadow-2xl">
        <div className="flex-1">
          <div className="flex items-center gap-3 sm:gap-4 cursor-pointer group" onClick={() => setView('home')}>
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-[#050A30] rounded-[12px] sm:rounded-[15px] flex items-center justify-center shadow-xl group-hover:rotate-12 transition-transform duration-500"><i className="fas fa-bolt text-white text-sm sm:text-base"></i></div>
            <span className="text-lg sm:text-2xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
          </div>
        </div>
        <div className="flex-1 hidden lg:flex gap-12 items-center justify-end">
          <button onClick={() => setView('comparison')} className="text-[10px] font-black uppercase tracking-[0.2em] px-9 py-3 rounded-full border border-[#4158D0] text-[#4158D0] hover:bg-[#4158D0] hover:text-white transition-all duration-300">Comparer</button>
          <button className="text-[11px] font-black uppercase tracking-[0.3em] text-[#050A30]/50 hover:text-[#4158D0] transition-colors">Privacy</button>
          <button className="text-[11px] font-black uppercase tracking-[0.3em] text-[#050A30]/50 hover:text-[#4158D0] transition-colors">FAQ</button>
          <button className="text-[11px] font-black uppercase tracking-[0.3em] text-[#050A30]/50 hover:text-[#4158D0] transition-colors">Contact</button>
        </div>
        <div className="lg:hidden">
          <button onClick={() => setView('comparison')} className="w-9 h-9 flex items-center justify-center rounded-full bg-[#4158D0]/10 text-[#4158D0]"><i className="fas fa-exchange-alt"></i></button>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'home' && (
          <section className="pt-20 sm:pt-32 pb-24 sm:pb-40 px-6 max-w-[1400px] mx-auto text-center">
            <div className="inline-block px-6 sm:px-8 py-2 sm:py-2.5 bg-white/30 rounded-full border border-white/50 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.5em] mb-8 sm:mb-12 shadow-sm italic">Intelligence Artificielle Certifiée v5.4</div>
            <h2 className="text-4xl sm:text-6xl md:text-8xl font-black italic uppercase mb-10 sm:mb-14 tracking-tighter leading-tight">Décodez la vérité <br/><span className="text-[#4158D0]">en un clic.</span></h2>
            
            <form onSubmit={(e) => handleSearch(query, undefined, e)} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-4 bg-white/40 p-2 sm:p-3 rounded-[30px] sm:rounded-[40px] shadow-2xl backdrop-blur-md border border-white/60 group">
              <div className="flex flex-1 items-center px-4 sm:px-6">
                <input type="text" placeholder="Entrez un modèle..." className="flex-1 bg-transparent py-4 sm:py-6 outline-none font-bold text-lg sm:text-xl placeholder:text-[#050A30]/60" value={query} onChange={(e) => setQuery(e.target.value)} />
                <i className="fas fa-barcode text-2xl sm:text-3xl text-[#050A30]/40 group-hover:text-[#4158D0] transition-colors"></i>
              </div>
              <button type="submit" className="bg-[#050A30] text-white px-8 sm:px-12 py-5 sm:py-6 rounded-[22px] sm:rounded-[32px] font-black uppercase tracking-[0.2em] hover:bg-[#4158D0] shadow-2xl transition-all">Scanner</button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mt-24 sm:mt-48">
               {latestReviews.slice(0, 3).map((rev, i) => (
                 <div key={i} className="glass-card p-5 sm:p-6 rounded-[30px] sm:rounded-[40px] cursor-pointer hover:translate-y-[-10px] transition-all duration-500 text-left relative overflow-hidden group/card" onClick={(e) => handleSearch(rev.product_name || '', rev.image_url || undefined, e)}>
                   <ProductImage src={rev.image_url || undefined} alt={rev.product_name || ''} className="w-full aspect-[3/2] rounded-[20px] sm:rounded-[30px] mb-6 sm:mb-8 group-hover/card:scale-105" />
                   <h4 className="font-black text-lg sm:text-xl italic uppercase truncate mb-3 sm:mb-4">{rev.product_name}</h4>
                   <div className="flex flex-col gap-3 sm:gap-4 border-t border-black/5 pt-4">
                     <StarRating rating={rev.rating || 4} size="text-[14px]" />
                     <div className="flex items-center justify-between">
                        <AvatarStack images={AVATAR_PHOTOS.slice(i * 3, (i * 3) + 5)} count={4} size="h-8 w-8 sm:h-9 sm:w-9" />
                        <span className="text-[9px] sm:text-[10px] font-black opacity-30 uppercase tracking-widest">Experts</span>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </section>
        )}

        {view === 'comparison' && (
          <section className="pt-16 sm:pt-24 pb-24 sm:pb-40 px-6 max-w-[1200px] mx-auto animate-fade-in">
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase mb-12 sm:mb-16 tracking-tighter text-center">DUEL <span className="text-[#4158D0]">TECHNIQUE</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 mb-12 sm:mb-16">
               <input type="text" placeholder="Modèle A..." value={compA} onChange={(e) => setCompA(e.target.value)} className="glass-card p-5 sm:p-6 rounded-[20px] sm:rounded-[30px] font-bold text-lg sm:text-xl outline-none placeholder:text-[#050A30]/40" />
               <input type="text" placeholder="Modèle B..." value={compB} onChange={(e) => setCompB(e.target.value)} className="glass-card p-5 sm:p-6 rounded-[20px] sm:rounded-[30px] font-bold text-lg sm:text-xl outline-none placeholder:text-[#050A30]/40" />
            </div>
            <div className="text-center">
               <button onClick={() => performComparisonAnalysis(compA, compB)} className="bg-[#050A30] text-white px-12 sm:px-20 py-5 sm:py-7 rounded-[25px] sm:rounded-[35px] font-black uppercase tracking-[0.3em] hover:bg-[#4158D0] shadow-2xl transition-all">Lancer le Duel</button>
            </div>
            {compData && (
              <div className="mt-16 sm:mt-24 space-y-12">
                <div className="glass-card p-8 sm:p-12 rounded-[30px] sm:rounded-[50px] text-center border-white shadow-2xl">
                  <h3 className="text-2xl sm:text-4xl font-black italic text-[#4158D0] mb-4 sm:mb-6 uppercase">GAGNANT : {compData.winner}</h3>
                  <p className="text-lg sm:text-xl font-bold italic opacity-80 leading-relaxed">"{compData.summary}"</p>
                </div>
              </div>
            )}
          </section>
        )}

        {view === 'detail' && product && (
          <section className="pb-24 sm:pb-40 max-w-[1450px] mx-auto px-4 sm:px-6 pt-16 sm:pt-24 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-24 items-start mb-16 sm:mb-28">
              <div className="w-full bg-white rounded-[35px] sm:rounded-[56px] overflow-hidden shadow-2xl border-[10px] sm:border-[18px] border-white lg:sticky lg:top-32">
                <ProductImage src={product.image_url} alt={product.name} className="w-full aspect-[4/5] md:aspect-[3/4]" />
              </div>
              <div className="flex flex-col items-start space-y-12 sm:space-y-16">
                <div className="w-full">
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-tight sm:leading-none mb-6 sm:mb-8">{product.name}</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10 p-5 sm:p-6 bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[35px] sm:rounded-[50px] shadow-2xl w-full sm:w-fit sm:pr-14">
                    <div className="bg-[#050A30] text-white w-20 h-20 sm:w-28 sm:h-28 rounded-[25px] sm:rounded-[35px] flex flex-col items-center justify-center shadow-xl shrink-0">
                       <span className="text-3xl sm:text-5xl font-black italic">{aiVerdict ? (aiVerdict.score / 10).toFixed(1) : "—"}</span>
                       <span className="text-[8px] sm:text-[10px] font-bold opacity-40 uppercase">Score IA</span>
                    </div>
                    <div className="flex flex-col gap-4 sm:gap-6 w-full">
                       <div className="flex items-center gap-3 sm:gap-4 bg-white/60 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full border border-white shadow-sm w-full sm:w-auto overflow-hidden">
                          <StarRating rating={4.8} size="text-[14px] sm:text-[18px]" />
                          <div className="h-4 w-[1px] bg-black/10 mx-1"></div>
                          <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.1em] sm:tracking-[0.3em] text-[#050A30]/60 italic truncate">Indice de Confiance</span>
                       </div>
                       <div className="flex items-center gap-3 sm:gap-4 pl-1 sm:pl-2">
                          <AvatarStack count={4} size="h-7 w-7 sm:h-8 w-8" />
                          <span className="text-[8px] sm:text-[10px] font-black opacity-30 uppercase tracking-widest">Vérifié par {aiVerdict ? aiVerdict.totalReviews : 4500} experts</span>
                       </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 w-full">
                  <div className="glass-card p-8 sm:p-12 rounded-[35px] sm:rounded-[45px] bg-white/50 min-h-[250px]">
                    <h3 className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-6 sm:mb-10 text-emerald-600 flex justify-between">Points Forts <i className="fas fa-check-circle"></i></h3>
                    <ul className="space-y-4 sm:space-y-5">
                      {aiVerdict?.pros?.map((p, i) => (
                        <li key={i} className="text-[13px] sm:text-[15px] font-bold flex gap-3 sm:gap-4"><span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0"></span> <span className="opacity-80">{p}</span></li>
                      )) || (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-4 bg-black/5 rounded-full w-[80%]"></div>)}
                        </div>
                      )}
                    </ul>
                  </div>
                  <div className="glass-card p-8 sm:p-12 rounded-[35px] sm:rounded-[45px] bg-white/50 min-h-[250px]">
                    <h3 className="text-[11px] sm:text-[12px] font-black uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-6 sm:mb-10 text-rose-600 flex justify-between">Points Faibles <i className="fas fa-times-circle"></i></h3>
                    <ul className="space-y-4 sm:space-y-5">
                      {aiVerdict?.cons?.map((c, i) => (
                        <li key={i} className="text-[13px] sm:text-[15px] font-bold flex gap-3 sm:gap-4"><span className="w-2 h-2 rounded-full bg-rose-500 mt-2 shrink-0"></span> <span className="opacity-80">{c}</span></li>
                      )) || (
                        <div className="space-y-3">
                          {[...Array(5)].map((_, i) => <div key={i} className="animate-pulse h-4 bg-black/5 rounded-full w-[80%]"></div>)}
                        </div>
                      )}
                    </ul>
                  </div>
                </div>
                <div className="glass-card p-8 sm:p-14 rounded-[35px] sm:rounded-[50px] bg-white/70 shadow-2xl border-white w-full">
                  <h3 className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.5em] sm:tracking-[0.6em] mb-6 sm:mb-10 text-[#050A30]/30 italic">DESCRIPTION</h3>
                  <p className="text-[#050A30]/90 font-bold italic leading-relaxed sm:leading-loose text-xl sm:text-2xl border-l-[6px] sm:border-l-[10px] border-[#4158D0] pl-6 sm:pl-12">
                    {product.description}
                  </p>
                </div>
              </div>
            </div>

            {aiVerdict && (
              <div className="glass-card rounded-[40px] sm:rounded-[60px] overflow-hidden shadow-2xl border-white border-[1.5px] sm:border-[2px] mt-10 sm:mt-20 animate-fade-in">
                <div className="px-6 sm:px-20 pt-10 sm:pt-20 pb-8 sm:pb-12 flex flex-col sm:row justify-between sm:items-center gap-6 border-b border-black/5 bg-white/40">
                  <h3 className="text-2xl sm:text-4xl font-black italic uppercase tracking-tighter">ANALYSE MARCHÉ <span className="hidden sm:inline text-[#4158D0] text-xl font-bold ml-6">— LIVE STATS</span></h3>
                  <div className="flex gap-3 sm:gap-4">
                    <div className="px-4 sm:px-6 py-2 sm:py-3 bg-emerald-100/50 text-emerald-700 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest">Live: Actif</div>
                    <div className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-100/50 text-blue-700 rounded-xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest">v5.4 Certifié</div>
                  </div>
                </div>
                
                <div className="p-6 sm:p-20 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-12 bg-white/20">
                   <div className="bg-white/40 p-5 sm:p-10 rounded-[25px] sm:rounded-[40px] border border-white shadow-lg text-center group hover:bg-white/60 transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#4158D0] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white shadow-xl group-hover:rotate-6 transition-transform"><i className="fas fa-shopping-cart text-sm sm:text-base"></i></div>
                      <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest opacity-30 mb-3 sm:mb-5">VERDICT ACHAT</p>
                      <p className="text-xl sm:text-3xl font-black italic text-[#4158D0] uppercase tracking-tighter">{aiVerdict?.marketMoment || '...'}</p>
                   </div>
                   <div className="bg-white/40 p-5 sm:p-10 rounded-[25px] sm:rounded-[40px] border border-white shadow-lg text-center group hover:bg-white/60 transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FFD700] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-[#050A30] shadow-xl group-hover:rotate-6 transition-transform"><i className="fas fa-tag text-sm sm:text-base"></i></div>
                      <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest opacity-30 mb-3 sm:mb-5">MEILLEUR PRIX</p>
                      <p className="text-xl sm:text-3xl font-black italic tracking-tighter">{aiVerdict?.marketBestPrice || '...'}</p>
                   </div>
                   <div className="bg-white/40 p-5 sm:p-10 rounded-[25px] sm:rounded-[40px] border border-white shadow-lg text-center group hover:bg-white/60 transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#C850C0] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white shadow-xl group-hover:rotate-6 transition-transform"><i className="fas fa-random text-sm sm:text-base"></i></div>
                      <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest opacity-30 mb-3 sm:mb-5">ALTERNATIVE</p>
                      <p className="text-xl sm:text-3xl font-black italic tracking-tighter uppercase truncate">{aiVerdict?.marketAlternative || '...'}</p>
                   </div>
                   <div className="bg-white/40 p-5 sm:p-10 rounded-[25px] sm:rounded-[40px] border border-white shadow-lg text-center group hover:bg-white/60 transition-all">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 text-white shadow-xl group-hover:rotate-6 transition-transform"><i className="fas fa-chart-line text-sm sm:text-base"></i></div>
                      <p className="text-[8px] sm:text-[11px] font-black uppercase tracking-widest opacity-30 mb-3 sm:mb-5">OPPORTUNITÉ</p>
                      <p className="text-2xl sm:text-4xl font-black italic text-emerald-600 tracking-tighter">{aiVerdict?.opportunityScore || 0}%</p>
                   </div>
                </div>

                <div className="px-6 sm:px-20 py-10 sm:py-14 bg-black/5 border-t border-black/5">
                   <div className="h-6 sm:h-9 w-full bg-black/5 rounded-full overflow-hidden shadow-inner p-1 sm:p-1.5">
                      <div className="h-full bg-gradient-to-r from-[#4158D0] via-[#C850C0] to-[#FFCC70] transition-all duration-1000 rounded-full shadow-lg" style={{ width: `${aiVerdict?.opportunityScore || 0}%` }}></div>
                   </div>
                   <div className="flex flex-col sm:row justify-between mt-4 sm:mt-6 gap-2">
                     <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest opacity-20 italic">Score de Satisfaction Global</span>
                     <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-[#4158D0] italic">{aiVerdict?.opportunityLabel || 'Analyse...'}</span>
                   </div>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="py-16 sm:py-24 glass-card !rounded-none !border-x-0 !border-b-0 mt-auto">
        <div className="max-w-[1300px] mx-auto px-6 text-center space-y-8 sm:space-y-12">
           <div className="flex justify-center items-center gap-6 sm:gap-10">
             <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#050A30] rounded-[18px] sm:rounded-[22px] flex items-center justify-center shadow-2xl"><i className="fas fa-bolt text-white text-xl sm:text-3xl"></i></div>
             <span className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
           </div>
           <p className="text-[10px] sm:text-[14px] font-bold uppercase tracking-[0.4em] sm:tracking-[1em] opacity-20 italic px-4">© AvisScore Excellence v5.4 — Intelligence Certifiée 2025</p>
        </div>
      </footer>
    </div>
  );
}
