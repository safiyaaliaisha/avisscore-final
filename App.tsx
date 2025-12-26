import React, { useState, useEffect } from 'react';
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { fetchProductInfoFromWeb } from './services/geminiService';
import { Product, Review, AIAnalysis } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 85,
  description: "Analyse en cours via Turbo Engine V9...",
  pros: ["Performance", "Design", "Autonomie", "Ecran", "Photo", "Prix"],
  cons: ["Stock", "Poids", "Chargeur", "Logiciel", "Prix", "Accessoires"],
  predecessorName: "---",
  activeLifespanYears: 3,
  oneWordVerdict: "---",
  trustStatement: "Calculé via Turbo Engine",
  buyerTip: "---",
  marketBestPrice: "---",
  marketAlternatives: [],
  verdict: "Analyse en cours",
  punchyVerdict: "---",
  sourceScores: [],
  totalReviews: 0,
  buyingWindow: "---",
  buyingConfidence: 80,
  marketMoment: "---",
  durabilityScore: 8
};

// منتجات افتراضية تظهر في حال كانت قاعدة البيانات فارغة
const TRENDING_FALLBACK = [
  { product_name: "iPhone 16 Pro", rating: 5, image_url: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=400" },
  { product_name: "Meta Quest 3S", rating: 4, image_url: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?w=400" },
  { product_name: "PlayStation 5 Pro", rating: 5, image_url: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400" }
];

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
  const [webSources, setWebSources] = useState<{title: string, uri: string}[]>([]);
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
      setLatestReviews(reviews && reviews.length > 0 ? reviews : TRENDING_FALLBACK as any);
      setCompareList(names || []);
    } catch (e) {
      setLatestReviews(TRENDING_FALLBACK as any);
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
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // البحث المتزامن في Supabase وفي الويب
    const dbPromise = fetchProductDataFromReviews(targetName);
    const webPromise = fetchProductInfoFromWeb(targetName);

    const [dbData, webData] = await Promise.all([dbPromise, webPromise]);

    if (dbData?.firstMatch) {
      setProduct(prev => prev ? { 
        ...prev, 
        image_url: dbData.firstMatch?.image_url || prev.image_url, 
        reviews: dbData.reviews 
      } : null);
    }

    if (webData.aiData) {
      setAiVerdict({ ...DEFAULT_ANALYSIS, ...(webData.aiData as any) });
    }
    setWebSources(webData.sources);
    setIsSearching(false);
  };

  const Navigation = () => (
    <nav className="px-6 md:px-20 py-5 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
      <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
        <div className="w-10 h-10 bg-[#050A30] rounded-[12px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
          <i className="fas fa-bolt text-white"></i>
        </div>
        <span className="text-xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span> PRO</span>
      </div>
      <div className="hidden lg:flex gap-8 items-center">
        <button onClick={() => setView('home')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">HOME</button>
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">FAQ</button>
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
              MOTEUR <span className="text-white/40">WEB TURBO.</span> <br/>L'AVIS EN DIRECT.
            </h1>
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-32">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white focus-within:ring-4 ring-[#4158D0]/20 transition-all group/search">
                <input 
                  type="text" 
                  placeholder="iPhone 16, Meta Quest 3S..." 
                  className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl placeholder:text-[#050A30]/40" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all shadow-xl flex items-center gap-3">
                  <i className="fas fa-search text-xs"></i> ANALYSER
                </button>
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic">Connecté à Google Search Grounding — Données 2024/2025</p>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-2 transition-all shadow-xl overflow-hidden group" onClick={() => handleSearch(rev.product_name || '')}>
                  <div className="relative aspect-video mb-4 overflow-hidden rounded-[30px] bg-white">
                    <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-[9px] font-bold">TRENDING</div>
                  </div>
                  <h3 className="font-black text-lg italic uppercase truncate">{rev.product_name}</h3>
                  <div className="flex justify-between mt-4 items-center">
                    <StarRating rating={rev.rating || 5} /> 
                    <i className="fas fa-arrow-right text-xs opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all"></i>
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
                <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[10px] border-white group">
                  <img src={product.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"} className="w-full aspect-square object-cover" alt={product.name} />
                </div>

                {webSources.length > 0 && (
                  <div className="glass-card p-8 rounded-[40px] shadow-xl border-white">
                    <h4 className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-6 italic">Sources Web de l'Analyse</h4>
                    <div className="space-y-3">
                      {webSources.map((s, idx) => (
                        <a key={idx} href={s.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white/40 rounded-2xl hover:bg-white transition-colors group">
                          <div className="w-8 h-8 bg-[#050A30] rounded-lg flex items-center justify-center text-white text-[10px]">
                            <i className="fas fa-link"></i>
                          </div>
                          <span className="text-xs font-bold truncate flex-1 uppercase tracking-tight">{s.title}</span>
                          <i className="fas fa-external-link-alt text-[10px] opacity-0 group-hover:opacity-30 transition-opacity"></i>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 italic">Résultat de recherche Grounding</span>
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card !bg-white/40 !rounded-[40px] mb-12 shadow-2xl p-10 flex flex-col items-center justify-center">
                   <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-4 italic">SCORE GLOBAL IA</span>
                   <div className="flex items-baseline gap-2">
                     <span className="text-8xl font-black italic bg-gradient-to-br from-[#050A30] to-[#4158D0] bg-clip-text text-transparent leading-none tracking-tighter">
                       {(aiVerdict.score / 10).toFixed(1)}
                     </span>
                     <span className="text-2xl font-black opacity-10">/10</span>
                   </div>
                   <div className="mt-6 scale-125">
                     <StarRating rating={aiVerdict.score / 20} size="text-[20px]" />
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-8">
                  <div className="glass-card border-l-8 border-emerald-500 p-8 rounded-[40px]">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 mb-6 italic">Points Forts</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiVerdict.pros.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold opacity-80 uppercase italic">
                          <i className="fas fa-check text-emerald-500"></i> {p}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card border-l-8 border-rose-500 p-8 rounded-[40px]">
                    <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-600 mb-6 italic">Points Faibles</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {aiVerdict.cons.map((c, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm font-bold opacity-80 uppercase italic">
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

      <footer className="py-20 glass-card !rounded-none !border-0 text-center shadow-inner mt-20">
         <span className="text-3xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span> PRO</span>
         <p className="text-[9px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8">© 2025 — POWERED BY GOOGLE SEARCH GROUNDING — TOUS DROITS RÉSERVÉS</p>
      </footer>

      {isSearching && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
          <div className="bg-[#050A30] text-white px-10 py-5 rounded-full shadow-2xl flex items-center gap-5">
            <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <span className="text-[11px] font-black uppercase tracking-widest italic">Exploration du Web...</span>
          </div>
        </div>
      )}
    </div>
  );
}