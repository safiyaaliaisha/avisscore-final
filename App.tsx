
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

const deepNavy = '#050A30';

const EXPERT_PHOTOS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop"
];

const AvatarStack = ({ images = EXPERT_PHOTOS, count = 5, size = "h-8 w-8" }: { images?: string[], count?: number, size?: string }) => (
  <div className="flex items-center -space-x-4 hover:-space-x-2 transition-all duration-500 group/stack py-1">
    {images.slice(0, count).map((src, i) => (
      <div key={i} className="relative transition-transform duration-300 hover:scale-110 hover:z-50 cursor-pointer">
        <img 
          src={src} 
          className={`${size} rounded-full object-cover shadow-lg border-[2.5px] border-white ring-1 ring-black/5`} 
          style={{ zIndex: 10 - i }} 
          alt={`Expert ${i + 1}`} 
        />
      </div>
    ))}
    <div className={`${size} rounded-full bg-[#4158D0] border-[2.5px] border-white flex items-center justify-center shadow-lg z-0 -ml-4 transform group-hover/stack:translate-x-1 transition-transform`}>
      <span className="text-[8px] font-black text-white italic">+10</span>
    </div>
  </div>
);

const ProductImage = ({ src, alt, className }: { src?: string; alt: string; className?: string }) => {
  if (!src) return <div className={`${className} bg-white/10 flex items-center justify-center text-[#050A30]/20 backdrop-blur-md border border-white/30`}><i className="fas fa-image text-6xl"></i></div>;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      className={`${className} object-cover bg-white transition-all duration-700 shadow-2xl`}
      onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.7'; }}
    />
  );
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
  const [aiVerdict, setAiVerdict] = useState<AIAnalysis | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  // États pour la comparaison
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const reviews = await fetchLatestReviews(6);
      setLatestReviews(reviews);
      const names = await fetchUniqueProducts();
      setAllProductNames(names);
    } catch (err) {
      console.error(err);
    }
  };

  const performAISearchAndAnalysis = async (productName: string): Promise<AIAnalysis | null> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyse ultra-détaillée : "${productName}". Réponds uniquement en JSON: { "score": 0-100, "description": "Synthèse", "pros": [], "cons": [], "predecessorName": "Ancien", "activeLifespanYears": 3.0, "oneWordVerdict": "Verdict", "trustStatement": "Source", "buyerTip": "Conseil", "marketBestPrice": "Prix€", "marketAlternatives": ["A-100€","B-200€","C-300€","D-400€"] }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      return JSON.parse(response.text || "{}");
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSearch = async (targetQuery?: string) => {
    const sQuery = targetQuery || query;
    if (!sQuery.trim()) return;

    setIsSearching(true);
    setSearchStatus("Recherche...");
    
    const { reviews, firstMatch } = await fetchProductDataFromReviews(sQuery);

    const initialProduct: Product = {
      id: 'prod-' + Date.now(),
      name: firstMatch?.product_name || sQuery,
      image_url: firstMatch?.image_url,
      description: "Chargement de l'analyse IA...",
      price: 0,
      category: "Tech",
      reviews: reviews
    };
    setProduct(initialProduct);
    setView('detail');
    setIsSearching(false);

    performAISearchAndAnalysis(firstMatch?.product_name || sQuery).then(analysis => {
      if (analysis) {
        setAiVerdict(analysis);
        setProduct(p => p ? { ...p, description: analysis.description } : null);
      }
    });
  };

  const handleCompare = async () => {
    if (!compareA || !compareB) return;
    setIsComparing(true);
    setComparisonResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Compare "${compareA}" et "${compareB}". Réponds UNIQUEMENT en JSON : { "summary": "Bref résumé", "winner": "${compareA}", "criteria": [{ "label": "Performance", "productA": "Note A", "productB": "Note B", "better": "A" }] }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      setComparisonResult(JSON.parse(response.text || "{}"));
    } catch (e) {
      console.error(e);
    } finally {
      setIsComparing(false);
    }
  };

  const Navigation = () => (
    <nav className="px-6 md:px-20 py-5 sm:py-7 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
      <div className="flex-1">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setView('home'); setAiVerdict(null); }}>
          <div className="w-10 h-10 bg-[#050A30] rounded-[15px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-bolt text-white"></i></div>
          <span className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
        </div>
      </div>
      <div className="flex-1 hidden lg:flex gap-10 items-center justify-end">
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">PRIVACY</button>
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">FAQ</button>
        <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">CONTACT</button>
        <button 
          onClick={() => { setView('compare'); setComparisonResult(null); }}
          className={`${view === 'compare' ? 'bg-[#4158D0]' : 'bg-[#050A30]'} text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-lg transition-all flex items-center gap-3`}
        >
          <i className="fas fa-barcode"></i>
          <span>COMPARER</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen text-[#050A30] flex flex-col font-sans antialiased">
      <Navigation />

      <main className="flex-grow">
        {view === 'home' && (
          <section className="pt-32 pb-40 px-6 max-w-[1200px] mx-auto text-center animate-fade-in">
            <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black italic uppercase mb-16 tracking-tighter leading-[0.85] drop-shadow-2xl">
              LA VÉRITÉ BRUTE <br/>
              <span className="text-white/40">SUR LA TECH.</span>
            </h1>
            
            <div className="max-w-3xl mx-auto relative group">
              <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex flex-col gap-6">
                <div className="relative glass-card !rounded-[50px] p-2 flex items-center group-focus-within:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all">
                  <input 
                    type="text" 
                    placeholder="Modèle (ex: iPhone 16 Pro)..." 
                    className="flex-1 bg-transparent py-7 px-10 outline-none font-bold text-2xl placeholder:text-[#050A30]/30"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="submit" className="mr-6 text-[#050A30]/30 hover:text-[#4158D0] transition-colors">
                    <i className="fas fa-barcode text-3xl"></i>
                  </button>
                </div>
                <button type="submit" className="bg-[#050A30] text-white px-20 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-xl hover:bg-[#4158D0] shadow-2xl transition-all active:scale-95">
                  Analyser maintenant
                </button>
              </form>
            </div>

            <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-10">
              {latestReviews.map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-4 transition-all duration-500" onClick={() => handleSearch(rev.product_name || '')}>
                  <ProductImage src={rev.image_url || undefined} alt={rev.product_name || ''} className="w-full aspect-video rounded-[30px] mb-6" />
                  <h3 className="font-black text-lg italic uppercase truncate mb-4">{rev.product_name}</h3>
                  <div className="flex items-center justify-between border-t border-black/5 pt-4">
                    <StarRating rating={rev.rating || 5} />
                    <AvatarStack count={3} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'detail' && product && (
          <section className="pb-40 max-w-[1450px] mx-auto px-6 pt-20 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start mb-16">
              <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[15px] border-white lg:sticky lg:top-36">
                <ProductImage src={product.image_url} alt={product.name} className="w-full aspect-[4/5]" />
              </div>

              <div className="flex flex-col items-start w-full">
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-tight mb-8">{product.name}</h2>
                
                <div className="w-full flex items-center justify-between gap-8 px-10 py-6 bg-white/40 backdrop-blur-xl rounded-[30px] border border-white/60 shadow-xl mb-6">
                  <div className="flex items-center gap-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-black italic text-[#050A30]">
                        {aiVerdict ? (aiVerdict.score / 10).toFixed(1) : "—"}
                      </span>
                      <span className="text-[9px] font-black text-[#050A30]/40 uppercase tracking-[0.2em]">SCORE IA</span>
                    </div>
                    <div className="h-12 w-[1.5px] bg-[#050A30]/10"></div>
                    <StarRating rating={aiVerdict ? aiVerdict.score / 20 : 0} size="text-[20px]" />
                  </div>
                  <AvatarStack count={7} size="h-10 w-10" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mb-12">
                  <div className="glass-card p-10 rounded-[45px] bg-emerald-50/10 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-emerald-600 italic">POINTS FORTS</h3>
                    <ul className="space-y-4">
                      {aiVerdict?.pros?.map((p, i) => <li key={i} className="text-[13px] font-bold flex gap-4"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5"></span> {p}</li>)}
                    </ul>
                  </div>
                  <div className="glass-card p-10 rounded-[45px] bg-rose-50/10 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-rose-600 italic">POINTS FAIBLES</h3>
                    <ul className="space-y-4">
                      {aiVerdict?.cons?.map((c, i) => <li key={i} className="text-[13px] font-bold flex gap-4"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5"></span> {c}</li>)}
                    </ul>
                  </div>
                </div>

                <div className="w-full mb-12">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-[#050A30]/30 italic pl-2">DONNÉES HISTORIQUES</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/40 p-8 rounded-[30px] border border-white/60">
                      <span className="text-[10px] font-black opacity-30 uppercase block mb-1">PRÉDÉCESSEUR</span>
                      <p className="text-xl font-black italic">{aiVerdict?.predecessorName || '—'}</p>
                    </div>
                    <div className="bg-white/40 p-8 rounded-[30px] border border-white/60">
                      <span className="text-[10px] font-black opacity-30 uppercase block mb-1">VIE ACTIVE</span>
                      <p className="text-xl font-black italic text-[#4158D0]">{aiVerdict?.activeLifespanYears || '—'} ANS</p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-[#050A30]/30 italic pl-2">CONSTAT TECHNIQUE</h3>
                  <div className="px-10 py-8 bg-white/20 rounded-[40px] border border-white/40 border-dashed">
                    <p className="text-[#050A30]/60 font-light italic leading-relaxed">{product.description}</p>
                  </div>
                </div>
              </div>
            </div>

            {aiVerdict && (
              <div className="mt-24 space-y-12">
                <div className="glass-card rounded-[60px] overflow-hidden bg-white/10 p-10">
                   <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-12 text-[#050A30]/30 italic pl-2">PRODUITS RELATIFS</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {aiVerdict.marketAlternatives?.map((alt, idx) => (
                        <div key={idx} className="bg-white/50 p-6 rounded-[35px] border border-white/60 shadow-sm flex flex-col justify-between">
                           <p className="font-bold italic text-lg mb-4">{alt.split('-')[0].trim()}</p>
                           <span className="text-2xl font-black text-[#4158D0]">{alt.split('-')[1]?.trim()}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="glass-card p-10 rounded-[60px] bg-gradient-to-r from-[#4158D0]/10 to-[#C850C0]/10 border-white shadow-2xl flex items-center gap-12">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-xl shrink-0"><i className="fas fa-lightbulb text-3xl text-[#FFCC70]"></i></div>
                  <p className="text-2xl font-bold italic text-[#050A30]/80 leading-relaxed">{aiVerdict.buyerTip}</p>
                </div>
              </div>
            )}
          </section>
        )}

        {view === 'compare' && (
          <section className="pt-20 pb-40 px-6 max-w-[1200px] mx-auto animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-16 text-center">DUEL DE <span className="text-white/40">TECH.</span></h2>
            
            <div className="glass-card p-12 rounded-[60px] mb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">PRODUIT A</label>
                  <select 
                    className="w-full bg-white/50 py-5 px-8 rounded-[30px] border border-white/60 font-bold outline-none appearance-none"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                  >
                    <option value="">Sélectionner un produit...</option>
                    {allProductNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">PRODUIT B</label>
                  <select 
                    className="w-full bg-white/50 py-5 px-8 rounded-[30px] border border-white/60 font-bold outline-none appearance-none"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                  >
                    <option value="">Sélectionner un produit...</option>
                    {allProductNames.map((n, i) => <option key={i} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 text-center pt-8">
                  <button 
                    onClick={handleCompare}
                    disabled={!compareA || !compareB || isComparing}
                    className="bg-[#050A30] text-white px-20 py-6 rounded-full font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-xl disabled:opacity-30 transition-all"
                  >
                    {isComparing ? 'Analyse du duel...' : 'Lancer le Duel'}
                  </button>
                </div>
              </div>
            </div>

            {comparisonResult && (
              <div className="animate-fade-in space-y-12">
                <div className="text-center">
                  <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-4">VAINQUEUR : <span className="text-[#4158D0]">{comparisonResult.winner}</span></h3>
                  <p className="text-xl font-medium italic opacity-60 max-w-2xl mx-auto">"{comparisonResult.summary}"</p>
                </div>

                <div className="glass-card rounded-[60px] overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/50">
                        <th className="p-8 text-[10px] font-black uppercase tracking-widest opacity-40 italic">CRITÈRES</th>
                        <th className="p-8 text-xl font-black italic uppercase">{compareA}</th>
                        <th className="p-8 text-xl font-black italic uppercase">{compareB}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {comparisonResult.criteria.map((c, i) => (
                        <tr key={i} className="hover:bg-white/20 transition-colors">
                          <td className="p-8 font-black uppercase tracking-tighter italic text-[#050A30]/50">{c.label}</td>
                          <td className={`p-8 font-bold text-lg ${c.better === 'A' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productA}</td>
                          <td className={`p-8 font-bold text-lg ${c.better === 'B' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productB}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {(view === 'privacy' || view === 'faq' || view === 'contact') && (
          <section className="py-40 px-6 max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-6xl font-black italic uppercase mb-16">{view}</h2>
            <div className="glass-card p-16 rounded-[60px]">
              <p className="text-2xl font-medium italic opacity-60">Section {view} en cours de synchronisation...</p>
            </div>
          </section>
        )}
      </main>

      <footer className="py-20 glass-card !rounded-none !border-x-0 !border-b-0 text-center">
         <span className="text-4xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
         <p className="text-[12px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8">© 2025 AvisScore — Optimized v29.0</p>
      </footer>
    </div>
  );
}
