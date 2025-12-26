
import React, { useState, useEffect } from 'react';
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { analyzeProductWithWebSearch, WebSource } from './services/geminiService';
import { Product, Review, AIAnalysis } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 90,
  description: "Démarrage du moteur nifaç (Turbo Groq V9)...",
  pros: ["Vitesse Extrême", "Llama 3.3 Ready", "Analyse Flash", "Multi-Thread", "Groq Powered", "V9 Turbo"],
  cons: ["Syncing...", "Syncing...", "Syncing...", "Syncing...", "Syncing...", "Syncing..."],
  predecessorName: "---",
  activeLifespanYears: 3,
  oneWordVerdict: "Turbo",
  trustStatement: "Calculé via Turbo Engine V9 (Groq)",
  buyerTip: "Le moteur Groq analyse les données en millisecondes...",
  marketBestPrice: "---",
  marketAlternatives: [],
  verdict: "Analyse Instantanée",
  punchyVerdict: "V9 Ready",
  sourceScores: [],
  totalReviews: 500,
  buyingWindow: "Optimale",
  buyingConfidence: 95,
  marketMoment: "Nifaç Mode",
  durabilityScore: 9
};

const StarRating = ({ rating, size = "text-[12px]" }: { rating: number, size?: string }) => (
  <div className="flex items-center gap-1">
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
  const [webSources, setWebSources] = useState<WebSource[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    const reviews = await fetchLatestReviews(12);
    setLatestReviews(reviews || []);
  };

  const handleSearch = async (targetName: string) => {
    if (!targetName.trim()) return;
    
    setView('detail');
    setIsSearching(true);
    setAiVerdict(DEFAULT_ANALYSIS); 
    
    setProduct({ 
      id: 'p-' + Date.now(), 
      name: targetName, 
      image_url: "", 
      description: "", 
      price: 0, 
      category: "Tech", 
      reviews: [] 
    });
    
    window.scrollTo({ top: 0 });

    // Parallel processing: Supabase (Local) + Groq (Turbo Analysis)
    const supabaseCall = fetchProductDataFromReviews(targetName);
    const groqCall = analyzeProductWithWebSearch(targetName);

    try {
      const [dbData, result] = await Promise.all([supabaseCall, groqCall]);
      
      if (dbData?.firstMatch) {
        setProduct(prev => prev ? { 
          ...prev, 
          image_url: dbData.firstMatch?.image_url || prev.image_url, 
          reviews: dbData.reviews 
        } : null);
      }

      if (result.data) {
        setAiVerdict({ ...DEFAULT_ANALYSIS, ...result.data });
      }
      setWebSources(result.sources);
    } catch (e) {
      console.error("Engine failure", e);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen text-[#050A30] flex flex-col font-sans antialiased">
      {/* Navigation */}
      <nav className="px-6 md:px-20 py-5 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-[#050A30] rounded-[12px] flex items-center justify-center shadow-lg">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <span className="text-xl font-black italic uppercase tracking-tighter">
            Avis<span className="text-[#4158D0]">Score</span> 
            <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] ml-2 animate-pulse">TURBO GROQ V9</span>
          </span>
        </div>
      </nav>
      
      <main className="flex-grow">
        {view === 'home' && (
          <section className="pt-24 pb-40 px-6 max-w-[1200px] mx-auto text-center">
            <h1 className="text-6xl md:text-9xl font-black italic uppercase mb-12 tracking-tighter leading-none">
              GROQ <span className="text-white/30">TURBO.</span> <br/>SCORE NIFAÇ
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-24">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white ring-[#4158D0]/20 transition-all">
                <input 
                  type="text" 
                  placeholder="Rechercher (iPhone 16, PS5 Pro...)" 
                  className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl placeholder:text-[#050A30]/40" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all">
                  SCAN V9
                </button>
              </div>
              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Moteur de recherche Llama 3.3 Ultra-Rapide</p>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:scale-105 transition-all shadow-xl group" onClick={() => handleSearch(rev.product_name || '')}>
                  <div className="relative aspect-video mb-4 overflow-hidden rounded-[30px] bg-white">
                    <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full h-full object-cover" />
                    <div className="absolute top-4 left-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[9px] font-bold tracking-widest">FLASH SCAN</div>
                  </div>
                  <h3 className="font-black text-lg italic uppercase truncate">{rev.product_name}</h3>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'detail' && product && (
          <section className="pb-40 max-w-[1400px] mx-auto px-6 pt-20 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="space-y-10">
                <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[10px] border-white relative">
                  <img src={product.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"} className="w-full aspect-square object-cover" alt={product.name} />
                  <div className="absolute top-6 right-6 bg-[#050A30] text-white px-6 py-2 rounded-full font-black italic text-[10px] tracking-widest uppercase">GROQ ANALYSED</div>
                </div>

                {webSources.length > 0 && (
                  <div className="glass-card p-8 rounded-[40px] shadow-xl border-white">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 italic">Sources Web Scannées par V9</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {webSources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl hover:bg-white transition-all group">
                          <div className="w-10 h-10 bg-[#050A30] rounded-xl flex items-center justify-center text-white text-xs">
                            <i className="fas fa-search-plus"></i>
                          </div>
                          <span className="text-xs font-black truncate flex-1 uppercase tracking-tight group-hover:text-[#4158D0]">{s.title}</span>
                          <i className="fas fa-external-link-alt text-[10px] opacity-20"></i>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-emerald-500 text-white px-3 py-1 rounded text-[9px] font-black tracking-widest uppercase">V9 Turbo Engine</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Groq • Llama 3.3 Versatile</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card !bg-white/40 !rounded-[45px] mb-12 shadow-2xl p-12 flex flex-col md:flex-row items-center gap-10">
                   <div className="flex flex-col items-center">
                      <div className="text-7xl font-black italic bg-gradient-to-br from-[#050A30] to-[#4158D0] bg-clip-text text-transparent">
                        {(aiVerdict.score / 10).toFixed(1)}
                      </div>
                      <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mt-2 italic">NIFAÇ SCORE</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-lg font-black italic leading-tight text-[#050A30] uppercase tracking-tighter">
                        "{aiVerdict.description}"
                      </p>
                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                         <i className="fas fa-bolt text-emerald-600"></i>
                         <p className="text-[11px] font-bold italic uppercase">{aiVerdict.buyerTip}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="glass-card border-l-8 border-emerald-500 p-10 rounded-[40px] shadow-xl">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 mb-6 italic">Points Forts Scan V9</h4>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                      {aiVerdict.pros.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-black opacity-80 uppercase italic tracking-tighter">
                          <i className="fas fa-check text-emerald-500"></i> {p}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="glass-card border-l-8 border-rose-500 p-10 rounded-[40px] shadow-xl">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-600 mb-6 italic">Points Faibles Scan V9</h4>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                      {aiVerdict.cons.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-black opacity-80 uppercase italic tracking-tighter">
                          <i className="fas fa-times text-rose-500"></i> {c}
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

      <footer className="py-20 glass-card !rounded-none !border-0 text-center mt-20">
         <span className="text-3xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span> V9 TURBO</span>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8">POWERED BY GROQ & LLAMA 3.3 — 2025</p>
      </footer>

      {isSearching && (
        <div className="fixed top-0 left-0 w-full h-1.5 z-[100] overflow-hidden bg-white/20">
           <div className="h-full bg-emerald-500 animate-[loading_1s_infinite_linear]"></div>
        </div>
      )}
      
      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
