
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

const deepNavy = '#050A30';

// Configuration du Webhook n8n
const N8N_WEBHOOK_URL = 'https://n8n.your-production-url.com/webhook/product-sync';

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

// Added key to props type to fix TS error when using Skeleton in map()
const Skeleton = ({ className }: { className: string; key?: React.Key }) => (
  <div className={`animate-pulse bg-white/10 rounded-xl ${className}`}></div>
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
  const [queryA, setQueryA] = useState('');
  const [queryB, setQueryB] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [aiVerdict, setAiVerdict] = useState<AIAnalysis | null>(null);
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState('');

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const reviews = await fetchLatestReviews(6);
      setLatestReviews(reviews);
    } catch (err) {
      console.error(err);
    }
  };

  const performAISearchAndAnalysis = async (productName: string): Promise<AIAnalysis | null> => {
    try {
      // Create a new instance for each call as per guidelines
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Analyse ultra-détaillée pour le produit : "${productName}". 
      Cherche les spécifications réelles, le cycle de vie et les alternatives.
      Réponds UNIQUEMENT en JSON avec cette structure :
      {
        "score": 0-100,
        "description": "Synthèse technique experte",
        "pros": ["8 points forts précis"],
        "cons": ["8 points faibles précis"],
        "predecessorName": "Nom du modèle précédent",
        "activeLifespanYears": X.X,
        "oneWordVerdict": "Un seul mot percutant",
        "trustStatement": "Preuve de source (ex: 50 tests analysés)",
        "buyerTip": "Conseil d'achat stratégique",
        "marketBestPrice": "Prix constaté en €",
        "marketAlternatives": ["Modèle 1 - Prix€", "Modèle 2 - Prix€", "Modèle 3 - Prix€", "Modèle 4 - Prix€"]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          systemInstruction: "Tu es le moteur de recherche technique AvisScore. Tes données doivent être basées sur des sources réelles du web. Si une info est manquante, mets 'Information en cours de mise à jour'.",
          responseMimeType: "application/json"
        }
      });
      
      // Property access .text instead of .text() as per guidelines
      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error("Format JSON invalide");
      
      const rawData = JSON.parse(match[0]);
      
      // Sécurisation des données avec valeurs par défaut
      const data: AIAnalysis = {
        score: rawData.score ?? 0,
        description: rawData.description ?? "Analyse technique en cours d'affinement...",
        pros: Array.isArray(rawData.pros) ? rawData.pros : ["Information en cours de mise à jour"],
        cons: Array.isArray(rawData.cons) ? rawData.cons : ["Information en cours de mise à jour"],
        predecessorName: rawData.predecessorName ?? "Modèle précédent non répertorié",
        activeLifespanYears: typeof rawData.activeLifespanYears === 'number' ? rawData.activeLifespanYears : 2.5,
        oneWordVerdict: rawData.oneWordVerdict ?? "Inconnu",
        trustStatement: rawData.trustStatement ?? "Analyse basée sur les spécifications constructeur.",
        buyerTip: rawData.buyerTip ?? "Comparez les prix avant tout achat.",
        marketBestPrice: rawData.marketBestPrice ?? "Prix non disponible",
        marketAlternatives: Array.isArray(rawData.marketAlternatives) ? rawData.marketAlternatives : ["Recherche d'alternatives..."]
      };

      // Extract grounding sources as required by Gemini API guidelines
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.groundingSources = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
      }

      // Sync avec n8n en tâche de fond (Fire and forget)
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, productName, timestamp: new Date().toISOString() })
      }).catch(() => {});

      return data;
    } catch (e) {
      console.error("Erreur Analyse IA:", e);
      return null;
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchStatus("Vérification locale...");
    setAiVerdict(null); // Reset analysis to show skeletons
    
    // 1. Appel immédiat Supabase
    const { reviews, firstMatch } = await fetchProductDataFromReviews(query);

    if (firstMatch) {
      // 2. Produit trouvé : Affichage direct
      setProduct({
        id: 'db-' + Date.now(),
        name: firstMatch.product_name || query,
        image_url: firstMatch.image_url,
        description: "Chargement de l'expertise IA...",
        price: 0,
        category: "Tech",
        reviews: reviews
      });
      setView('detail');
      setIsSearching(false);

      // 3. Enrichissement IA en arrière-plan
      performAISearchAndAnalysis(firstMatch.product_name || query).then(analysis => {
        if (analysis) setAiVerdict(analysis);
      });
    } else {
      // 4. Nouveau produit : On affiche une structure vide et on lance l'IA
      setProduct({
        id: 'temp-' + Date.now(),
        name: query,
        description: "Analyse en direct de l'appareil...",
        price: 0,
        category: "Tech",
        reviews: []
      });
      setView('detail');
      setIsSearching(false);

      performAISearchAndAnalysis(query).then(analysis => {
        if (analysis) setAiVerdict(analysis);
      });
    }
  };

  const Navigation = () => (
    <nav className="px-6 md:px-20 py-5 sm:py-7 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
      <div className="flex-1">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => { setView('home'); setComparisonResult(null); }}>
          <div className="w-10 h-10 bg-[#050A30] rounded-[15px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><i className="fas fa-bolt text-white"></i></div>
          <span className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
        </div>
      </div>
      <div className="flex-1 hidden lg:flex gap-10 items-center justify-end">
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">PRIVACY</button>
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">FAQ</button>
        <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 transition-opacity">CONTACT</button>
        <button 
          onClick={() => setView('compare')}
          className={`bg-[#050A30] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-lg transition-all flex items-center gap-3 ${view === 'compare' ? 'ring-2 ring-white' : ''}`}
        >
          <i className="fas fa-barcode text-[10px]"></i>
          <span>COMPARER</span>
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen text-[#050A30] flex flex-col font-sans antialiased">
      {/* Overlay de chargement ultra-rapide uniquement pour l'initialisation */}
      {isSearching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050A30]/40 backdrop-blur-3xl animate-fade-in">
          <div className="w-16 h-16 border-4 border-[#4158D0] border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <Navigation />

      <main className="flex-grow">
        {view === 'home' && (
          <section className="pt-32 pb-40 px-6 max-w-[1200px] mx-auto text-center animate-fade-in">
            <h1 className="text-6xl sm:text-8xl md:text-[10rem] font-black italic uppercase mb-16 tracking-tighter leading-[0.85] drop-shadow-2xl">
              LA VÉRITÉ BRUTE <br/>
              <span className="text-white/40">SUR LA TECH.</span>
            </h1>
            
            <div className="max-w-3xl mx-auto relative group">
              <form onSubmit={handleSearch} className="flex flex-col gap-6">
                <div className="relative glass-card !rounded-[50px] p-2 flex items-center group-focus-within:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all">
                  <input 
                    type="text" 
                    placeholder="Modèle (ex: iPhone 16 Pro)..." 
                    className="flex-1 bg-transparent py-7 px-10 outline-none font-bold text-2xl placeholder:text-[#050A30]/30"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button type="button" className="mr-6 text-[#050A30]/30 hover:text-[#4158D0] transition-colors">
                    <i className="fas fa-barcode text-3xl"></i>
                  </button>
                </div>
                <button 
                  type="submit" 
                  className="bg-[#050A30] text-white px-20 py-8 rounded-[40px] font-black uppercase tracking-[0.3em] text-xl hover:bg-[#4158D0] shadow-2xl hover:scale-[1.02] transition-all active:scale-95"
                >
                  Analyser maintenant
                </button>
              </form>
            </div>

            <div className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-10">
              {latestReviews.map((rev, i) => (
                <div 
                  key={i} 
                  className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-4 transition-all duration-500 border-white/50"
                  onClick={() => { setQuery(rev.product_name || ''); handleSearch(); }}
                >
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
                
                {/* ROW 1: SCORE & AVATARS */}
                <div className="w-full flex items-center justify-between gap-8 px-10 py-6 bg-white/40 backdrop-blur-xl rounded-[30px] border border-white/60 shadow-xl mb-6">
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-start">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black italic text-[#050A30] leading-none">
                          {aiVerdict ? (aiVerdict.score / 10).toFixed(1) : <span className="animate-pulse opacity-20">?.?</span>}
                        </span>
                        <span className="text-[9px] font-black text-[#050A30]/40 uppercase tracking-[0.2em]">SCORE IA</span>
                      </div>
                    </div>
                    <div className="h-12 w-[1.5px] bg-[#050A30]/10"></div>
                    <StarRating rating={4.8} size="text-[20px]" />
                  </div>
                  <AvatarStack count={7} size="h-10 w-10" />
                </div>

                {/* TABLEAU: DONNÉES HISTORIQUES */}
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden bg-white/20 backdrop-blur-md rounded-[30px] border border-white/40 shadow-lg mb-12">
                  <div className="p-8 border-b md:border-b-0 md:border-r border-white/40">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-3 italic">SOURCE ANALYSE</h4>
                    {aiVerdict ? (
                      <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-[#050A30]/70 italic">
                        {aiVerdict.trustStatement}
                      </p>
                    ) : (
                      <Skeleton className="h-10 w-full" />
                    )}
                  </div>
                  <div className="p-8 flex flex-col justify-center bg-white/10">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-2 italic">DONNÉES HISTORIQUES</h4>
                    <div className="flex items-center gap-5 group">
                      <div className="w-12 h-12 bg-[#4158D0] rounded-full flex items-center justify-center text-white shadow-xl group-hover:rotate-180 transition-transform duration-1000 shrink-0">
                        <i className="fas fa-arrows-rotate text-lg"></i>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-4xl font-black italic text-[#050A30] leading-none uppercase tracking-tighter">
                          {aiVerdict ? (
                             <span className="text-[#4158D0] drop-shadow-[0_0_8px_rgba(65,88,208,0.3)] font-black">{aiVerdict.activeLifespanYears} ANS</span>
                          ) : (
                             <span className="animate-pulse opacity-20">? ANS</span>
                          )}
                        </p>
                        <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mt-1">CYCLE DE VIE MOYEN</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* POINTS FORTS / FAIBLES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mb-12">
                  <div className="glass-card p-10 rounded-[45px] bg-emerald-50/10 border-emerald-100/20 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-emerald-600 italic border-b border-emerald-500/10 pb-4">POINTS FORTS</h3>
                    <ul className="space-y-4">
                      {aiVerdict ? aiVerdict.pros.map((p, i) => (
                        <li key={i} className="text-[13px] font-bold flex gap-4 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span> <span className="opacity-80">{p}</span></li>
                      )) : [...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </ul>
                  </div>
                  <div className="glass-card p-10 rounded-[45px] bg-rose-50/10 border-rose-100/20 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-rose-600 italic border-b border-rose-500/10 pb-4">POINTS FAIBLES</h3>
                    <ul className="space-y-4">
                      {aiVerdict ? aiVerdict.cons.map((c, i) => (
                        <li key={i} className="text-[13px] font-bold flex gap-4 items-start"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span> <span className="opacity-80">{c}</span></li>
                      )) : [...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                    </ul>
                  </div>
                </div>

                {/* CONSTAT TECHNIQUE */}
                <div className="w-full pt-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-[#050A30]/30 italic pl-2">CONSTAT TECHNIQUE FINAL</h3>
                  <div className="px-10 py-8 bg-white/20 rounded-[40px] border border-white/40 border-dashed min-h-[100px]">
                    {aiVerdict ? (
                      <div className="flex flex-col gap-4">
                        <p className="text-[#050A30]/60 font-light italic leading-relaxed text-sm sm:text-base border-l-[3px] border-[#4158D0]/40 pl-8">
                          {aiVerdict.description}
                        </p>
                        {/* Rendering grounding sources as required by Gemini API guidelines for googleSearch */}
                        {aiVerdict.groundingSources && aiVerdict.groundingSources.length > 0 && (
                          <div className="mt-4 pl-8">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-3 italic">SOURCES ANALYSÉES</h4>
                            <div className="flex flex-wrap gap-3">
                              {aiVerdict.groundingSources.map((source, idx) => (
                                <a 
                                  key={idx} 
                                  href={source.uri} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-[10px] font-bold text-[#4158D0] hover:underline bg-[#4158D0]/5 px-3 py-1 rounded-full border border-[#4158D0]/10"
                                >
                                  {source.title}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Skeleton className="h-24 w-full" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* EXPERT SECTION */}
            <div className="mt-24 space-y-12">
              <div className="glass-card rounded-[60px] overflow-hidden shadow-2xl border-white border-[1px] bg-white/10">
                <div className="px-10 sm:px-24 py-12 flex flex-col sm:row justify-between sm:items-center gap-8 border-b border-black/5 bg-white/50">
                  <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">L'ŒIL DE L'EXPERT</h3>
                </div>
                <div className="p-10 sm:p-24 bg-white/20">
                  <div className="bg-white/50 p-10 sm:p-16 rounded-[50px] shadow-xl border-2 border-[#4158D0]/10">
                      <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-center mb-12 text-[#4158D0] italic">ALTERNATIVES ÉCONOMIQUES</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                         {aiVerdict ? aiVerdict.marketAlternatives.map((alt, idx) => (
                           <div key={idx} className="flex items-center justify-between p-6 bg-white/40 rounded-[30px] border border-white/60 hover:bg-white/60 transition-colors group">
                              <p className="text-lg font-bold italic text-[#050A30] group-hover:translate-x-1 transition-transform">{alt.split('-')[0].trim()}</p>
                              <span className="text-xl font-black text-[#4158D0]">{alt.split('-')[1]?.trim()}</span>
                           </div>
                         )) : [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-[30px]" />)}
                      </div>
                  </div>
                </div>
              </div>

              {aiVerdict && (
                <div className="glass-card p-10 sm:p-20 rounded-[60px] bg-gradient-to-r from-[#4158D0]/10 to-[#C850C0]/10 border-white shadow-2xl flex flex-col md:flex-row items-center gap-12 group">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl shrink-0 group-hover:scale-110 group-hover:rotate-12 transition-all">
                    <i className="fas fa-lightbulb text-4xl text-[#FFCC70]"></i>
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-[#050A30]/40 mb-4 italic">L'ASTUCE DE L'ACHETEUR</h4>
                    <p className="text-2xl sm:text-3xl font-bold italic text-[#050A30]/80 leading-relaxed">
                      {aiVerdict.buyerTip}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Autres vues (Privacy, FAQ, etc.) omises pour brièveté car inchangées */}
      </main>

      <footer className="py-20 glass-card !rounded-none !border-x-0 !border-b-0 mt-20">
        <div className="max-w-[1300px] mx-auto px-10 text-center">
           <span className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
           <p className="text-[12px] font-bold uppercase tracking-[0.5em] opacity-20 italic mt-8 px-6">© 2025 AvisScore — Optimized Final v21.0</p>
        </div>
      </footer>
    </div>
  );
}
