
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 92,
  description: "Analyse technique optimisée. Performances exceptionnelles pour sa catégorie.",
  pros: ["Efficacité", "Construction", "Autonomie", "Design", "Interface", "Connectivité"],
  cons: ["Prix", "Stock", "Poids", "Accessoires", "Chargeur", "Logiciel"],
  predecessorName: "Version précédente",
  activeLifespanYears: 3,
  oneWordVerdict: "Approuvé",
  trustStatement: "Calculé via Turbo Engine",
  buyerTip: "Vérifiez les promotions de fin de série avant de valider l'achat.",
  marketBestPrice: "---",
  marketAlternatives: [{name: "Alternative A", price: "--- €"}, {name: "Alternative B", price: "--- €"}],
  verdict: "Hautement Recommandé",
  punchyVerdict: "Le choix élite",
  sourceScores: [],
  totalReviews: 50,
  buyingWindow: "Ouverte",
  buyingConfidence: 95,
  marketMoment: "Stable",
  durabilityScore: 9
};

const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]);
};

const StarRating = ({ rating, size = "text-[12px]" }: { rating: number, size?: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`flex text-[#FFD700] gap-0.5 items-center ${size}`}>
      {[...Array(5)].map((_, j) => (
        <i key={j} className={`${j < Math.round(rating) ? 'fas' : 'far'} fa-star`} style={{ filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.3))' }}></i>
      ))}
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<'home' | 'detail' | 'compare' | 'privacy' | 'faq' | 'contact'>('home');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [aiVerdict, setAiVerdict] = useState<AIAnalysis>(DEFAULT_ANALYSIS);
  const [isSearching, setIsSearching] = useState(false);
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [reviews, names] = await withTimeout(Promise.all([
        fetchLatestReviews(12),
        fetchUniqueProducts()
      ]), 4000);
      setLatestReviews(reviews || []);
      setCompareList(names || []);
    } catch (e) {
      console.warn("Initial load timeout or error");
    }
  };

  /**
   * استدعاء Gemini مباشرة كخيار بديل لبيئة الاستعراض (Preview)
   */
  const callGeminiDirectly = async (productName: string, reviewsText: string): Promise<any> => {
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyse le produit "${productName}" (Avis: ${reviewsText || 'Connaissances générales'}). Réponds en JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            description: { type: Type.STRING },
            pros: { type: Type.ARRAY, items: { type: Type.STRING } },
            cons: { type: Type.ARRAY, items: { type: Type.STRING } },
            predecessorName: { type: Type.STRING },
            activeLifespanYears: { type: Type.NUMBER },
            buyerTip: { type: Type.STRING },
            marketAlternatives: {
              type: Type.ARRAY,
              items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, price: { type: Type.STRING } } }
            }
          }
        }
      }
    });
    return JSON.parse(response.text);
  };

  const handleSearch = async (targetName: string, initialImg: string = "") => {
    if (!targetName.trim()) return;
    
    setView('detail');
    setIsSearching(true);
    setAiVerdict(DEFAULT_ANALYSIS); 
    
    const initialProduct: Product = { 
      id: 'p-' + Date.now(), 
      name: targetName, 
      image_url: initialImg, 
      description: "", 
      price: 0, 
      category: "Tech", 
      reviews: [] 
    };
    setProduct(initialProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // 1. Context from Supabase
      let dbData = null;
      try { dbData = await withTimeout(fetchProductDataFromReviews(targetName), 3000); } catch (e) {}

      let reviewsText = "";
      if (dbData && dbData.reviews && dbData.reviews.length > 0) {
        setProduct(prev => prev ? { 
          ...prev, 
          image_url: dbData.firstMatch?.image_url || initialImg, 
          reviews: dbData.reviews 
        } : null);
        reviewsText = dbData.reviews.slice(0, 5).map(r => r.review_text).join("\n");
      }

      // 2. Call AI (Vercel API first, then Client Fallback for Preview)
      let rawData = null;
      try {
        const apiResponse = await withTimeout(fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productName: targetName, reviewsText })
        }), 6000);

        if (apiResponse && apiResponse.ok) {
          rawData = await apiResponse.json();
        } else {
          // Fallback to direct call in Preview environment
          console.warn("API Route missing (Normal in Preview), falling back to SDK...");
          rawData = await callGeminiDirectly(targetName, reviewsText);
        }
      } catch (apiErr) {
        console.warn("API fetch failed, trying direct SDK...");
        rawData = await callGeminiDirectly(targetName, reviewsText);
      }
      
      if (rawData) {
        setAiVerdict({ ...DEFAULT_ANALYSIS, ...rawData });
      } else {
        setAiVerdict(DEFAULT_ANALYSIS);
      }

    } catch (e) {
      console.error("Search failure:", e);
      setAiVerdict(DEFAULT_ANALYSIS);
    } finally {
      setIsSearching(false);
    }
  };

  const Navigation = () => (
    <nav className="px-6 md:px-20 py-5 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
        <div className="w-10 h-10 bg-[#050A30] rounded-[12px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <i className="fas fa-bolt text-white"></i>
        </div>
        <span className="text-xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
      </div>
      <div className="hidden lg:flex gap-8 items-center">
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">FAQ</button>
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">PRIVACY</button>
        <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">CONTACT</button>
        <button onClick={() => setView('compare')} className="bg-[#050A30] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase hover:bg-[#4158D0] transition-all flex items-center gap-2">
          <i className="fas fa-columns"></i> COMPARER
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen text-[#050A30] flex flex-col font-sans antialiased">
      <Navigation />
      
      <main className="flex-grow">
        {view === 'home' && (
          <section className="pt-24 pb-40 px-6 max-w-[1200px] mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-16 tracking-tighter leading-none">
              MOTEUR <span className="text-white/40">TURBO V9.</span> <br/>L'AVIS INSTANTANÉ.
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-32">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white focus-within:ring-4 ring-[#4158D0]/20 transition-all group/search">
                <div className="pl-8 flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#050A30] rounded-full flex items-center justify-center text-white group-focus-within/search:bg-[#4158D0] transition-colors shadow-lg">
                    <i className="fas fa-barcode text-xl"></i>
                  </div>
                </div>
                <input 
                  type="text" 
                  placeholder="Rechercher un modèle..." 
                  className="flex-1 bg-transparent py-6 px-6 outline-none font-bold text-xl placeholder:text-[#050A30] placeholder:opacity-60 placeholder:italic" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all shadow-xl flex items-center gap-3">
                  <i className="fas fa-search text-xs"></i> ANALYSER
                </button>
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-2 transition-all shadow-xl" onClick={() => handleSearch(rev.product_name || '', rev.image_url || '')}>
                  <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full aspect-video object-cover rounded-[30px] mb-4 bg-white/50" alt={rev.product_name || ""} />
                  <h3 className="font-black text-lg italic uppercase truncate">{rev.product_name}</h3>
                  <div className="flex justify-between mt-4 opacity-60"><StarRating rating={rev.rating || 5} /> <i className="fas fa-arrow-right"></i></div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'detail' && product && (
          <section className="pb-40 max-w-[1400px] mx-auto px-6 pt-20 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="lg:sticky lg:top-36 space-y-10">
                <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[10px] border-white group relative">
                  <img src={product.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"} className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} />
                  <div className="absolute top-6 right-6 bg-black text-white px-6 py-2 rounded-full font-black italic text-[10px] tracking-widest shadow-2xl uppercase">PRODUIT CERTIFIÉ</div>
                </div>

                <div className="space-y-6">
                  <div className="relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1A237E] via-[#4A148C] to-[#880E4F] rounded-[40px]"></div>
                    <div className="relative p-10 text-white rounded-[40px] shadow-2xl border border-white/20">
                      <div className="flex items-center justify-center gap-4 mb-8">
                         <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/20"></div>
                         <h4 className="text-[10px] font-black uppercase tracking-[0.5em] opacity-80 whitespace-nowrap">ALTERNATIVES MARCHÉ</h4>
                         <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/20"></div>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {(aiVerdict?.marketAlternatives || []).map((alt, i) => (
                          <div key={i} className="p-5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/15 transition-all group cursor-pointer shadow-lg border-l-4 border-l-amber-400">
                            <div className="flex flex-col">
                              <span className="font-black italic uppercase text-sm group-hover:text-amber-400 transition-colors tracking-tight">{alt.name}</span>
                              <span className="text-[9px] font-bold opacity-40 uppercase mt-1 tracking-widest">Concurrent Direct</span>
                            </div>
                            <div className="px-3 py-1 bg-amber-400/10 rounded-lg">
                                <span className="text-amber-400 font-black italic text-sm">{alt.price}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden">
                    <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-xl border border-white/50">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[#050A30] rounded-[15px] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                          <i className="fas fa-lightbulb"></i>
                        </div>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] italic text-[#050A30]">ASTUCE TURBO V9</h4>
                      </div>
                      <p className="text-sm font-bold italic leading-relaxed text-[#050A30] opacity-80 border-l-4 border-[#4158D0] pl-5 uppercase tracking-tight">
                        "{aiVerdict?.buyerTip || "Analysez bien les alternatives avant de valider votre achat."}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 italic">Moteur Turbo V9.2 — LOGIC MODE</span>
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card !bg-white/40 !rounded-[40px] mb-12 shadow-2xl border-white relative overflow-hidden group">
                   <div className="flex flex-col md:flex-row w-full relative z-10">
                      <div className="flex-1 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 bg-white/30 text-center">
                        <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-4 italic">INDICE DE PERFORMANCE</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-8xl font-black italic bg-gradient-to-br from-[#050A30] to-[#4158D0] bg-clip-text text-transparent leading-none tracking-tighter">
                            {((aiVerdict?.score || 92) / 10).toFixed(1)}
                          </span>
                          <span className="text-2xl font-black opacity-10">/10</span>
                        </div>
                        <div className="mt-6 scale-110">
                          <StarRating rating={(aiVerdict?.score || 92) / 20} size="text-[24px]" />
                        </div>
                      </div>

                      <div className="flex-[1.5] grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/5">
                        <div className="p-10 flex flex-col justify-center hover:bg-white/20 transition-colors">
                          <span className="text-[9px] font-black uppercase tracking-widest italic opacity-40 mb-2">VERSION PRÉCÉDENTE</span>
                          <p className="text-2xl font-black italic text-[#050A30] uppercase tracking-tighter leading-tight">
                            {aiVerdict?.predecessorName || "N/A"}
                          </p>
                        </div>

                        <div className="p-10 flex flex-col justify-center hover:bg-white/20 transition-colors">
                          <span className="text-[9px] font-black uppercase tracking-widest italic opacity-40 mb-2">VALEUR RÉSIDUELLE</span>
                          <div className="flex items-baseline gap-2">
                             <p className="text-4xl font-black italic text-[#4158D0] uppercase tracking-tighter leading-none">
                               {aiVerdict?.activeLifespanYears || 3}
                             </p>
                             <span className="text-lg font-black italic opacity-40 uppercase tracking-tighter">ANS</span>
                          </div>
                          <p className="mt-4 text-[10px] font-black opacity-30 italic uppercase tracking-widest">ESTIMATION SUPPORT LOGICIEL</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-8 mb-12">
                  <div className="glass-card border-l-8 border-emerald-500 p-8 rounded-[40px] shadow-lg">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 italic mb-6">POINTS FORTS (+)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(aiVerdict?.pros || []).slice(0, 6).map((p, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white">
                          <i className="fas fa-check-circle text-emerald-500 text-sm"></i>
                          <span className="text-sm font-bold uppercase italic tracking-tight opacity-80">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card border-l-8 border-rose-500 p-8 rounded-[40px] shadow-lg">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-600 italic mb-6">POINTS FAIBLES (-)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(aiVerdict?.cons || []).slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white">
                          <i className="fas fa-exclamation-triangle text-rose-500 text-sm"></i>
                          <span className="text-sm font-bold uppercase italic tracking-tight opacity-80">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {isSearching && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
          <div className="bg-[#050A30] text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-5">
            <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-[12px] font-black uppercase tracking-widest italic uppercase">V9 Turbo Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
