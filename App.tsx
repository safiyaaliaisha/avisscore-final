
import React, { useState, useEffect } from 'react';
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { analyzeProductWithWebSearch, WebSource } from './services/geminiService';
import { Product, Review, AIAnalysis } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 85,
  description: "Initialisation du moteur Turbo V9...",
  pros: ["Sync Web", "Multi-Source", "Real-time", "Fast Sync", "V9 Engine", "Pro Analysis"],
  cons: ["Searching...", "Searching...", "Searching...", "Searching...", "Searching...", "Searching..."],
  predecessorName: "---",
  activeLifespanYears: 3,
  oneWordVerdict: "Turbo",
  trustStatement: "Calculé via Turbo Engine V9",
  buyerTip: "Analyse des sites Amazon, Fnac et Darty en cours...",
  marketBestPrice: "---",
  marketAlternatives: [],
  verdict: "Analyse Flash",
  punchyVerdict: "V9 Ready",
  sourceScores: [],
  totalReviews: 100,
  buyingWindow: "Stable",
  buyingConfidence: 90,
  marketMoment: "Optimisé",
  durabilityScore: 8
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
  const [compareList, setCompareList] = useState<string[]>([]);

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
      console.warn("Sync error, using local buffer.");
    }
  };

  const handleSearch = async (targetName: string) => {
    if (!targetName.trim()) return;
    
    setView('detail');
    setIsSearching(true);
    setAiVerdict(DEFAULT_ANALYSIS); 
    setWebSources([]);
    
    setProduct({ 
      id: 'p-' + Date.now(), 
      name: targetName, 
      image_url: "", 
      description: "", 
      price: 0, 
      category: "Tech", 
      reviews: [] 
    });
    
    window.scrollTo({ top: 0 }); // Fast scroll

    // Execution Parallèle: Supabase Cache + Web Grounding
    const supabaseCall = fetchProductDataFromReviews(targetName);
    const turboEngineCall = analyzeProductWithWebSearch(targetName);

    try {
      const [dbData, result] = await Promise.all([supabaseCall, turboEngineCall]);
      
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
      console.error("Critical Engine Failure", e);
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
        <span className="text-xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span> <span className="bg-[#050A30] text-white px-2 py-0.5 rounded text-[10px] ml-1">V9 TURBO</span></span>
      </div>
      <div className="hidden lg:flex gap-8 items-center">
        <button onClick={() => setView('home')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">ACCUEIL</button>
        <button onClick={() => setView('compare')} className="bg-[#050A30] text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase hover:bg-[#4158D0] transition-all flex items-center gap-2">
          <i className="fas fa-microchip"></i> COMPARER
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
            <h1 className="text-6xl md:text-9xl font-black italic uppercase mb-12 tracking-tighter leading-none">
              TURBO <span className="text-white/30">ENGINE.</span> <br/>SCORE V9.2
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-24">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white focus-within:ring-4 ring-[#4158D0]/20 transition-all">
                <input 
                  type="text" 
                  placeholder="Rechercher (ex: iPhone 16 Pro)..." 
                  className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl placeholder:text-[#050A30]/40" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all flex items-center gap-3">
                  SCANNER
                </button>
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.4em] opacity-30 italic">Sources: Amazon • Fnac • Boulanger • Darty • Rakuten</p>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.slice(0, 9).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:scale-105 transition-all shadow-xl group" onClick={() => handleSearch(rev.product_name || '')}>
                  <div className="relative aspect-video mb-4 overflow-hidden rounded-[30px] bg-white">
                    <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-[#050A30] text-white px-3 py-1 rounded-full text-[9px] font-bold">LIVE SCORE</div>
                  </div>
                  <h3 className="font-black text-lg italic uppercase truncate">{rev.product_name}</h3>
                  <div className="flex justify-between mt-4 items-center">
                    <StarRating rating={rev.rating || 5} /> 
                    <i className="fas fa-bolt text-xs text-[#4158D0]"></i>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'detail' && product && (
          <section className="pb-40 max-w-[1400px] mx-auto px-6 pt-20 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="lg:sticky lg:top-36 space-y-10">
                <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[10px] border-white relative group">
                  <img src={product.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"} className="w-full aspect-square object-cover" alt={product.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {webSources.length > 0 && (
                  <div className="glass-card p-8 rounded-[40px] shadow-xl border-white animate-fade-in">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 italic">Sources Directes (Engine V9)</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {webSources.slice(0, 6).map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl hover:bg-white transition-all group">
                          <div className="w-10 h-10 bg-[#050A30] rounded-xl flex items-center justify-center text-white text-xs">
                            <i className="fas fa-external-link-alt"></i>
                          </div>
                          <span className="text-xs font-black truncate flex-1 uppercase tracking-tight group-hover:text-[#4158D0]">{s.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-[#050A30] text-white px-3 py-1 rounded text-[9px] font-black tracking-widest">TURBO SYNC</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Moteur Gemini 3 Flash</span>
                </div>
                <h2 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card !bg-white/40 !rounded-[45px] mb-12 shadow-2xl p-12 flex flex-col md:flex-row items-center gap-10">
                   <div className="flex flex-col items-center">
                      <div className="relative">
                        <svg className="w-32 h-32 transform -rotate-90">
                          <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/20" />
                          <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-[#4158D0]" strokeDasharray={377} strokeDashoffset={377 - (377 * aiVerdict.score) / 100} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                           <span className="text-4xl font-black italic">{(aiVerdict.score / 10).toFixed(1)}</span>
                        </div>
                      </div>
                      <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mt-4 italic">IA SCORE</span>
                   </div>
                   <div className="flex-1 space-y-4">
                      <p className="text-lg font-black italic leading-tight text-[#050A30] uppercase tracking-tighter">
                        "{aiVerdict.description}"
                      </p>
                      <div className="p-5 bg-white/50 border border-white rounded-2xl flex items-start gap-4">
                         <i className="fas fa-bolt text-[#4158D0] mt-1"></i>
                         <p className="text-xs font-bold italic leading-relaxed uppercase">{aiVerdict.buyerTip}</p>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="glass-card border-l-8 border-emerald-500 p-10 rounded-[40px] shadow-xl">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 mb-6 flex items-center gap-2">
                       <i className="fas fa-check-double"></i> POINTS FORTS
                    </h4>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                      {aiVerdict.pros.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-black opacity-80 uppercase italic tracking-tighter">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card border-l-8 border-rose-500 p-10 rounded-[40px] shadow-xl">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-600 mb-6 flex items-center gap-2">
                       <i className="fas fa-exclamation-triangle"></i> POINTS FAIBLES
                    </h4>
                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                      {aiVerdict.cons.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-black opacity-80 uppercase italic tracking-tighter">
                          <div className="w-2 h-2 bg-rose-500 rounded-full"></div> {c}
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

      <footer className="py-20 glass-card !rounded-none !border-0 text-center shadow-inner mt-20 relative overflow-hidden">
         <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
         </div>
         <span className="text-3xl font-black italic uppercase tracking-tighter relative z-10">Avis<span className="text-[#4158D0]">Score</span> V9 TURBO</span>
         <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8 relative z-10">© 2025 — ENGINE OPTIMIZED FOR VERCEL — GOOGLE SEARCH ENABLED</p>
      </footer>

      {isSearching && (
        <div className="fixed top-0 left-0 w-full h-1 z-[100] overflow-hidden bg-white/20">
           <div className="h-full bg-gradient-to-r from-[#4158D0] via-[#C850C0] to-[#FFCC70] animate-turbo-progress"></div>
        </div>
      )}
      
      {isSearching && (
        <div className="fixed bottom-10 right-10 z-[100]">
          <div className="bg-[#050A30] text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 animate-pulse">
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-[10px] font-black uppercase tracking-widest italic">Turbo Engine Syncing...</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes turbo-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-turbo-progress {
          animation: turbo-progress 1.5s infinite linear;
          width: 200%;
        }
      `}</style>
    </div>
  );
}
