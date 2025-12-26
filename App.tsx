
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 80,
  description: "Analyse technique optimisée. Performances équilibrées pour sa catégorie.",
  pros: ["Efficacité", "Construction", "Autonomie"],
  cons: ["Prix", "Stock"],
  predecessorName: "Version précédente",
  activeLifespanYears: 3,
  oneWordVerdict: "Approuvé",
  trustStatement: "Calculé via Turbo Engine",
  buyerTip: "Achat recommandé.",
  marketBestPrice: "---",
  marketAlternatives: ["Alternative A", "Alternative B"],
  verdict: "Recommandé",
  punchyVerdict: "Le choix sûr",
  sourceScores: [],
  totalReviews: 50,
  buyingWindow: "Ouverte",
  buyingConfidence: 85,
  marketMoment: "Stable",
  durabilityScore: 7
};

const StarRating = ({ rating, size = "text-[12px]" }: { rating: number, size?: string }) => (
  <div className="flex items-center gap-1.5">
    <div className={`flex text-[#FFD700] gap-0.5 items-center ${size}`}>
      {[...Array(5)].map((_, j) => (
        <i key={j} className={`${j < Math.round(rating) ? 'fas' : 'far'} fa-star`}></i>
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
      const [reviews, names] = await Promise.all([
        fetchLatestReviews(12),
        fetchUniqueProducts()
      ]);
      setLatestReviews(reviews || []);
      setCompareList(names || []);
    } catch (e) {
      console.error("Data load error", e);
    }
  };

  const handleSearch = async (targetName: string) => {
    if (!targetName.trim()) return;
    
    setView('detail');
    setIsSearching(true);
    setAiVerdict(DEFAULT_ANALYSIS); 
    
    const initialProduct: Product = { 
      id: 'p-' + Date.now(), 
      name: targetName, 
      image_url: "", 
      description: "", 
      price: 0, 
      category: "Tech", 
      reviews: [] 
    };
    setProduct(initialProduct);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchProductDataFromReviews(targetName).then(dbData => {
      if (dbData?.firstMatch) {
        setProduct(prev => prev ? { 
          ...prev, 
          image_url: dbData.firstMatch?.image_url || "", 
          reviews: dbData.reviews 
        } : null);
      }
    });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const fastPrompt = `STRICT JSON (TOUS LES TEXTES EN FRANÇAIS): {"score":number,"description":"phrase_courte_fr","pros":["point_fort_fr","point_fort_fr","point_fort_fr"],"cons":["point_faible_fr","point_faible_fr"],"predecessorName":"nom_fr","activeLifespanYears":number,"marketAlternatives":["nom_fr","nom_fr"],"verdict":"verdict_fr"} for "${targetName}". NO MARKDOWN.`;

    try {
      const res = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fastPrompt,
        config: { 
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.1 
        }
      });

      const rawData = JSON.parse(res.text || "{}");
      
      setAiVerdict({
        ...DEFAULT_ANALYSIS,
        ...rawData,
        pros: Array.isArray(rawData.pros) ? rawData.pros : DEFAULT_ANALYSIS.pros,
        cons: Array.isArray(rawData.cons) ? rawData.cons : DEFAULT_ANALYSIS.cons,
        marketAlternatives: Array.isArray(rawData.marketAlternatives) ? rawData.marketAlternatives : DEFAULT_ANALYSIS.marketAlternatives
      });
    } catch (e) {
      console.error("AI Turbo Error", e);
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
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">FAQ</button>
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">PRIVACY</button>
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
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white focus-within:ring-4 ring-[#4158D0]/20 transition-all">
                <input type="text" placeholder="Entrez un modèle..." className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl" value={query} onChange={(e) => setQuery(e.target.value)} />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all">ANALYSER</button>
              </div>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-2 transition-all shadow-xl" onClick={() => handleSearch(rev.product_name || '')}>
                  <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full aspect-video object-cover rounded-[30px] mb-4 bg-white/50" />
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
                <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[10px] border-white">
                  {product.image_url ? (
                    <img src={product.image_url} className="w-full aspect-square object-cover" alt={product.name} />
                  ) : (
                    <div className="aspect-square bg-slate-100 flex items-center justify-center">
                      <i className="fas fa-image text-4xl text-slate-300"></i>
                    </div>
                  )}
                </div>

                {/* Section Alternatives déplacée ici */}
                <div className="p-10 bg-black text-white rounded-[40px] shadow-2xl">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 opacity-40 text-center">ALTERNATIVES MARCHÉ</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {(aiVerdict?.marketAlternatives || []).map((alt, i) => (
                      <div key={i} className="p-5 border border-white/10 rounded-2xl flex justify-between items-center hover:bg-white/5 transition-all group cursor-pointer">
                        <span className="font-bold italic uppercase text-sm group-hover:text-[#4158D0]">{alt}</span>
                        <i className="fas fa-external-link-alt text-[10px] opacity-20"></i>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 italic">Vitesse de réponse optimisée v9.2</span>
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card p-8 rounded-[40px] flex items-center justify-between mb-10 shadow-2xl border-white">
                   <div className="flex items-center gap-6">
                      <div className="text-6xl font-black italic">{((aiVerdict?.score || 80) / 10).toFixed(1)}</div>
                      <div className="h-12 w-[2px] bg-black/10"></div>
                      <div>
                        <StarRating rating={(aiVerdict?.score || 80) / 20} size="text-[20px]" />
                        <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest block mt-1">SCORE CALCULÉ PAR IA</span>
                      </div>
                   </div>
                   <div className="text-right">
                     <span className="text-xl font-black italic text-[#4158D0] uppercase">
                       {aiVerdict?.verdict || "Analyse..."}
                     </span>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-emerald-500/10 p-8 rounded-[35px] border border-emerald-500/20">
                    <h4 className="text-[10px] font-black uppercase text-emerald-600 mb-6 italic">POINTS FORTS</h4>
                    {(aiVerdict?.pros || []).map((p, i) => (
                      <p key={i} className="text-sm font-bold mb-3 flex gap-3 text-emerald-900/80">
                        <i className="fas fa-check-circle mt-0.5 opacity-40"></i> {p}
                      </p>
                    ))}
                  </div>
                  <div className="bg-rose-500/10 p-8 rounded-[35px] border border-rose-500/20">
                    <h4 className="text-[10px] font-black uppercase text-rose-600 mb-6 italic">POINTS FAIBLES</h4>
                    {(aiVerdict?.cons || []).map((c, i) => (
                      <p key={i} className="text-sm font-bold mb-3 flex gap-3 text-rose-900/80">
                        <i className="fas fa-times-circle mt-0.5 opacity-40"></i> {c}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-white/40 p-8 rounded-[35px] border border-white shadow-sm">
                    <span className="text-[9px] font-black opacity-30 block mb-1 uppercase tracking-widest">PRÉDÉCESSEUR</span>
                    <p className="text-xl font-black italic truncate">{aiVerdict?.predecessorName || "N/A"}</p>
                  </div>
                  <div className="bg-white/40 p-8 rounded-[35px] border border-white shadow-sm">
                    <span className="text-[9px] font-black opacity-30 block mb-1 uppercase tracking-widest">CYCLE DE VIE</span>
                    <p className="text-xl font-black italic text-[#4158D0]">{aiVerdict?.activeLifespanYears || 3} ANS</p>
                  </div>
                </div>

                <div className="p-10 glass-card rounded-[40px] mb-10 shadow-lg border-white relative">
                  <h4 className="text-[10px] font-black opacity-30 uppercase mb-4 italic">SYNTHÈSE TECHNIQUE</h4>
                  <p className="text-lg font-medium italic opacity-80 leading-relaxed italic">
                    "{aiVerdict?.description || "Analyse Turbo en cours..."}"
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'compare' && (
          <section className="py-24 px-6 max-w-[1000px] mx-auto animate-fade-in">
             <h2 className="text-5xl font-black italic uppercase text-center mb-16 tracking-tighter">DUEL <span className="text-white/40">V9.</span></h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                <select className="glass-card p-6 rounded-3xl font-black italic uppercase outline-none focus:ring-4 ring-[#4158D0]/20" value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                  <option value="">PRODUIT A</option>
                  {compareList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="glass-card p-6 rounded-3xl font-black italic uppercase outline-none focus:ring-4 ring-[#4158D0]/20" value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                  <option value="">PRODUIT B</option>
                  {compareList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
             {compareA && compareB && (
               <div className="text-center">
                 <button onClick={() => handleSearch(compareA)} className="bg-black text-white px-12 py-5 rounded-full font-black uppercase shadow-2xl hover:scale-105 transition-all">LANCER LE DUEL</button>
               </div>
             )}
          </section>
        )}

        {(view === 'faq' || view === 'privacy' || view === 'contact') && (
          <section className="py-24 px-6 max-w-[800px] mx-auto animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-16 tracking-tighter">{view}</h2>
            <div className="glass-card p-12 rounded-[50px] shadow-2xl border-white font-medium opacity-80 leading-relaxed italic">
               {view === 'faq' && "Nous utilisons le moteur Turbo V9 basé sur Gemini 3 Flash pour des analyses en moins de 5 secondes. Les données proviennent de sources vérifiées via Supabase."}
               {view === 'privacy' && "Aucune donnée personnelle n'est stockée. Vos recherches sont traitées en temps réel."}
               {view === 'contact' && "Support technique : support@avisscore.tech"}
            </div>
          </section>
        )}
      </main>

      <footer className="py-20 glass-card !rounded-none !border-0 text-center shadow-inner mt-20">
         <span className="text-4xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8">© 2025 — ENGINE V9.2 TURBO</p>
      </footer>

      {isSearching && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
          <div className="bg-[#050A30] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4">
            <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-[11px] font-black uppercase tracking-widest italic">V9 Engine Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}
