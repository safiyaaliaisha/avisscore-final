
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

const deepNavy = '#050A30';

// Configuration du Webhook n8n pour la synchronisation
const N8N_WEBHOOK_URL = 'https://n8n.your-production-url.com/webhook/product-sync';

// Photos d'experts pour la stabilité visuelle
const EXPERT_PHOTOS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop"
];

console.log("%c AvisScore Duel Tech V20.0 - Side-by-Side Expert", "color: #FF5E62; font-weight: bold; font-size: 16px;");

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
          systemInstruction: "Tu es le moteur de recherche technique AvisScore. Tes données doivent être basées sur des sources réelles du web.",
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      const data = JSON.parse(match ? match[0] : text);

      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks) {
        data.groundingSources = groundingChunks
          .filter((chunk: any) => chunk.web)
          .map((chunk: any) => ({
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
      }

      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, productName, timestamp: new Date().toISOString() })
      }).catch(() => {});

      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const performAIComparison = async (prodA: string, prodB: string): Promise<ComparisonData | null> => {
    try {
      setSearchStatus(`Duel en préparation : ${prodA} vs ${prodB}...`);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `DUEL TECHNIQUE : Compare "${prodA}" et "${prodB}".
      Identifie les différences clés, les avantages de l'un sur l'autre et donne un vainqueur clair.
      Réponds UNIQUEMENT en JSON avec cette structure :
      {
        "summary": "Résumé stratégique du duel",
        "winner": "Nom du Vainqueur",
        "criteria": [
          {"label": "Performance", "productA": "détails A", "productB": "détails B", "better": "A/B/Equal"},
          {"label": "Écran", "productA": "...", "productB": "...", "better": "..."},
          {"label": "Autonomie", "productA": "...", "productB": "...", "better": "..."},
          {"label": "Photo", "productA": "...", "productB": "...", "better": "..."},
          {"label": "Prix", "productA": "...", "productB": "...", "better": "..."}
        ]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }],
          systemInstruction: "Tu es un Analyste Tech Senior. Ta mission est de trancher entre deux produits tech. Sois impartial mais ferme sur le vainqueur.",
          responseMimeType: "application/json"
        }
      });
      
      const text = response.text || "";
      const match = text.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : text);
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setSearchStatus("Recherche Supabase...");
    
    const { reviews, firstMatch } = await fetchProductDataFromReviews(query);

    if (reviews.length > 0) {
      const initialProduct: Product = {
        id: 'db-' + Date.now(),
        name: firstMatch?.product_name || query,
        image_url: firstMatch?.image_url,
        description: "Chargement de l'analyse IA...",
        price: 0,
        category: "Tech",
        reviews: reviews
      };
      setProduct(initialProduct);
      setView('detail');
      setIsSearching(false);

      performAISearchAndAnalysis(firstMatch?.product_name || query).then(analysis => {
        if (analysis) {
          setAiVerdict(analysis);
          setProduct(p => p ? { ...p, description: analysis.description } : null);
        }
      });
    } else {
      setSearchStatus("Analyse IA en cours (Nouveau produit)...");
      const analysis = await performAISearchAndAnalysis(query);
      if (analysis) {
        setProduct({
          id: 'ai-' + Date.now(),
          name: query,
          description: analysis.description,
          price: 0,
          category: "Tech",
          reviews: []
        });
        setAiVerdict(analysis);
        setView('detail');
      }
      setIsSearching(false);
    }
  };

  const handleLancerDuel = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!queryA.trim() || !queryB.trim()) return;
    
    setIsSearching(true);
    const result = await performAIComparison(queryA, queryB);
    if (result) {
      setComparisonResult(result);
    }
    setIsSearching(false);
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
      {isSearching && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050A30]/80 backdrop-blur-[100px] animate-fade-in">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-[#4158D0] border-t-transparent rounded-full animate-spin shadow-[0_0_50px_rgba(65,88,208,0.5)]"></div>
            <div className="absolute inset-0 flex items-center justify-center animate-pulse">
              <i className="fas fa-radar text-4xl text-white"></i>
            </div>
          </div>
          <p className="mt-12 font-black uppercase tracking-[0.5em] text-[12px] text-white text-center px-6">
            {searchStatus}
          </p>
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

        {view === 'compare' && (
          <section className="pt-24 pb-40 px-6 max-w-[1200px] mx-auto animate-fade-in">
            <div className="text-center mb-20">
              <h2 className="text-5xl sm:text-7xl font-black italic uppercase tracking-tighter mb-4">DUEL TECHNIQUE</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">Comparez deux appareils en un instant</p>
            </div>

            <form onSubmit={handleLancerDuel} className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
              <div className="glass-card p-6 rounded-[35px]">
                <h4 className="text-[9px] font-black uppercase tracking-widest mb-4 opacity-50 pl-4">APPAREIL A</h4>
                <input 
                  type="text" 
                  placeholder="Modèle A..." 
                  className="w-full bg-white/40 rounded-2xl py-5 px-8 outline-none font-bold text-lg border border-white/60 focus:ring-2 ring-[#4158D0]/30 transition-all"
                  value={queryA}
                  onChange={(e) => setQueryA(e.target.value)}
                />
              </div>
              <div className="glass-card p-6 rounded-[35px]">
                <h4 className="text-[9px] font-black uppercase tracking-widest mb-4 opacity-50 pl-4">APPAREIL B</h4>
                <input 
                  type="text" 
                  placeholder="Modèle B..." 
                  className="w-full bg-white/40 rounded-2xl py-5 px-8 outline-none font-bold text-lg border border-white/60 focus:ring-2 ring-[#4158D0]/30 transition-all"
                  value={queryB}
                  onChange={(e) => setQueryB(e.target.value)}
                />
              </div>
              <div className="md:col-span-2 flex justify-center mt-6">
                <button 
                  type="submit" 
                  className="bg-[#050A30] text-white px-16 py-7 rounded-[35px] font-black uppercase tracking-[0.3em] text-lg hover:bg-[#4158D0] shadow-2xl transition-all hover:scale-105 active:scale-95"
                >
                  Lancer le Duel
                </button>
              </div>
            </form>

            {comparisonResult && (
              <div className="animate-fade-in space-y-12">
                <div className="glass-card p-12 rounded-[50px] bg-gradient-to-br from-white/40 to-white/10 text-center border-white/60 shadow-2xl overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <h3 className="text-[12px] font-black uppercase tracking-[0.5em] mb-6 opacity-40 italic">VERDICT DU DUEL</h3>
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500 text-white px-6 py-2 rounded-full mb-2">VAINQUEUR DÉSIGNÉ</span>
                    <h4 className="text-4xl sm:text-6xl font-black italic uppercase tracking-tighter text-[#4158D0]">{comparisonResult.winner}</h4>
                    <p className="text-lg font-bold italic opacity-70 max-w-2xl mt-6 border-l-2 border-[#4158D0] pl-8 text-left leading-relaxed">
                      {comparisonResult.summary}
                    </p>
                  </div>
                </div>

                <div className="glass-card rounded-[50px] overflow-hidden shadow-2xl border-white/60">
                  <div className="grid grid-cols-3 bg-[#050A30] text-white py-8 px-10 text-center font-black uppercase tracking-[0.2em] text-[10px] sm:text-[12px]">
                    <div>CRITÈRE</div>
                    <div className="border-x border-white/10">{queryA}</div>
                    <div>{queryB}</div>
                  </div>
                  <div className="divide-y divide-black/5">
                    {comparisonResult.criteria.map((item, idx) => (
                      <div key={idx} className="grid grid-cols-3 items-center py-10 px-10 text-center hover:bg-white/30 transition-colors">
                        <div className="text-[11px] font-black uppercase tracking-widest opacity-40 text-left italic">{item.label}</div>
                        <div className={`text-sm sm:text-base font-bold italic border-x border-black/5 px-6 ${item.better === 'A' ? 'text-[#4158D0]' : 'opacity-60'}`}>
                          {item.productA}
                          {item.better === 'A' && <i className="fas fa-crown ml-2 text-[#FFD700]"></i>}
                        </div>
                        <div className={`text-sm sm:text-base font-bold italic px-6 ${item.better === 'B' ? 'text-[#4158D0]' : 'opacity-60'}`}>
                          {item.productB}
                          {item.better === 'B' && <i className="fas fa-crown ml-2 text-[#FFD700]"></i>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                    <div className="flex flex-col items-start">
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-black italic text-[#050A30] leading-none">
                          {aiVerdict ? (aiVerdict.score / 10).toFixed(1) : "—"}
                        </span>
                        <span className="text-[9px] font-black text-[#050A30]/40 uppercase tracking-[0.2em]">SCORE IA</span>
                      </div>
                    </div>
                    <div className="h-12 w-[1.5px] bg-[#050A30]/10"></div>
                    <StarRating rating={4.8} size="text-[20px]" />
                  </div>
                  <AvatarStack count={7} size="h-10 w-10" />
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-0 overflow-hidden bg-white/20 backdrop-blur-md rounded-[30px] border border-white/40 shadow-lg mb-12">
                  <div className="p-8 border-b md:border-b-0 md:border-r border-white/40">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-3 italic">SOURCE ANALYSE</h4>
                    <p className="text-[10px] sm:text-[11px] font-medium leading-relaxed text-[#050A30]/70 italic">
                      {aiVerdict?.trustStatement || "Basé sur les spécifications techniques et les retours marché mondiaux."}
                    </p>
                  </div>
                  <div className="p-8 flex flex-col justify-center bg-white/10">
                    <h4 className="text-[8px] font-black uppercase tracking-[0.4em] opacity-40 mb-2 italic">DONNÉES HISTORIQUES</h4>
                    <div className="flex items-center gap-5 group">
                      <div className="w-12 h-12 bg-[#4158D0] rounded-full flex items-center justify-center text-white shadow-xl group-hover:rotate-180 transition-transform duration-1000 shrink-0">
                        <i className="fas fa-arrows-rotate text-lg"></i>
                      </div>
                      <div>
                        <p className="text-2xl sm:text-4xl font-black italic text-[#050A30] leading-none uppercase tracking-tighter">
                          <span className="text-[#4158D0] drop-shadow-[0_0_8px_rgba(65,88,208,0.3)] font-black">{aiVerdict?.activeLifespanYears || '—'} ANS</span>
                        </p>
                        <p className="text-[9px] font-black opacity-60 uppercase tracking-widest mt-1">CYCLE DE VIE MOYEN</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full mb-12">
                  <div className="glass-card p-10 rounded-[45px] bg-emerald-50/10 border-emerald-100/20 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-emerald-600 italic border-b border-emerald-500/10 pb-4">POINTS FORTS</h3>
                    <ul className="space-y-4">
                      {aiVerdict?.pros?.map((p, i) => (
                        <li key={i} className="text-[13px] font-bold flex gap-4 items-start"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span> <span className="opacity-80">{p}</span></li>
                      )) || [...Array(6)].map((_, i) => <div key={i} className="animate-pulse h-4 bg-black/5 rounded-full mb-4"></div>)}
                    </ul>
                  </div>
                  <div className="glass-card p-10 rounded-[45px] bg-rose-50/10 border-rose-100/20 shadow-lg">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] mb-10 text-rose-600 italic border-b border-rose-500/10 pb-4">POINTS FAIBLES</h3>
                    <ul className="space-y-4">
                      {aiVerdict?.cons?.map((c, i) => (
                        <li key={i} className="text-[13px] font-bold flex gap-4 items-start"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></span> <span className="opacity-80">{c}</span></li>
                      )) || [...Array(6)].map((_, i) => <div key={i} className="animate-pulse h-4 bg-black/5 rounded-full mb-4"></div>)}
                    </ul>
                  </div>
                </div>

                <div className="w-full pt-4">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-[#050A30]/30 italic pl-2">CONSTAT TECHNIQUE FINAL</h3>
                  <div className="px-10 py-8 bg-white/20 rounded-[40px] border border-white/40 border-dashed min-h-[100px]">
                    <p className="text-[#050A30]/60 font-light italic leading-relaxed text-sm sm:text-base border-l-[3px] border-[#4158D0]/40 pl-8">
                      {product.description}
                    </p>
                  </div>
                </div>

                {aiVerdict?.groundingSources && aiVerdict.groundingSources.length > 0 && (
                  <div className="w-full mt-10">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.5em] mb-4 text-[#050A30]/30 italic pl-2">SOURCES ANALYSÉES</h3>
                    <div className="flex flex-wrap gap-2">
                      {aiVerdict.groundingSources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.uri} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-white/40 border border-[#050A30]/10 rounded-full text-[10px] font-bold text-[#4158D0] hover:bg-[#4158D0] hover:text-white transition-all shadow-sm"
                        >
                          {source.title || "Lien Source"}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {aiVerdict && (
              <div className="mt-24 space-y-12">
                <div className="glass-card rounded-[60px] overflow-hidden shadow-2xl border-white border-[1px] bg-white/10">
                  <div className="px-10 sm:px-24 py-12 flex flex-col sm:row justify-between sm:items-center gap-8 border-b border-black/5 bg-white/50">
                    <h3 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter leading-none">L'ŒIL DE L'EXPERT</h3>
                  </div>
                  <div className="p-10 sm:p-24 bg-white/20">
                    <div className="bg-white/50 p-10 sm:p-16 rounded-[50px] shadow-xl border-2 border-[#4158D0]/10">
                        <h4 className="text-[14px] font-black uppercase tracking-[0.6em] text-center mb-12 text-[#4158D0] italic">ALTERNATIVES ÉCONOMIQUES</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {aiVerdict.marketAlternatives?.map((alt, idx) => (
                             <div key={idx} className="flex items-center justify-between p-6 bg-white/40 rounded-[30px] border border-white/60 hover:bg-white/60 transition-colors group">
                                <p className="text-lg font-bold italic text-[#050A30] group-hover:translate-x-1 transition-transform">{alt.split('-')[0].trim()}</p>
                                <span className="text-xl font-black text-[#4158D0]">{alt.split('-')[1]?.trim()}</span>
                             </div>
                           ))}
                        </div>
                    </div>
                  </div>
                </div>

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
              </div>
            )}
          </section>
        )}

        {(view === 'privacy' || view === 'faq' || view === 'contact') && (
           <div className="mt-20 px-10">
              <button onClick={() => setView('home')} className="mb-8 font-black uppercase tracking-widest text-[#050A30]/40 hover:text-[#4158D0] flex items-center gap-4 transition-colors">
                <i className="fas fa-arrow-left"></i> Retour à l'accueil
              </button>
           </div>
        )}

        {view === 'privacy' && (
          <section className="py-20 px-10 max-w-4xl mx-auto glass-card rounded-[60px] animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-12">Confidentialité</h2>
            <div className="space-y-8 text-[#050A30]/70 font-medium">
              <p>Chez AvisScore, nous protégeons vos données techniques. Les scans que vous effectuez sont anonymisés et utilisés uniquement pour enrichir la base de données communautaire via notre IA.</p>
              <h3 className="text-xl font-bold text-[#050A30]">1. Données collectées</h3>
              <p>Nous ne collectons pas de données personnelles identifiables (PII). Seuls les noms de modèles et codes barres recherchés sont stockés.</p>
              <h3 className="text-xl font-bold text-[#050A30]">2. Utilisation de l'IA</h3>
              <p>Nous utilisons l'API Google Gemini pour générer des synthèses. Aucune de vos données privées n'est transmise au modèle.</p>
            </div>
          </section>
        )}

        {view === 'faq' && (
          <section className="py-20 px-10 max-w-4xl mx-auto glass-card rounded-[60px] animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-12">Questions Fréquentes</h2>
            <div className="space-y-8">
              <div className="bg-white/40 p-8 rounded-[30px] border border-white/60">
                <h3 className="text-xl font-bold mb-4 italic">D'où viennent les scores ?</h3>
                <p className="text-[#050A30]/70">Nos scores sont générés par un algorithme IA qui agrège plus de 100 sources techniques, comparatifs et avis d'experts mondiaux en temps réel.</p>
              </div>
              <div className="bg-white/40 p-8 rounded-[30px] border border-white/60">
                <h3 className="text-xl font-bold mb-4 italic">Le scan de code barre est-il fiable ?</h3>
                <p className="text-[#050A30]/70">Oui, nous interrogeons les bases de données EAN mondiales pour identifier précisément la version et le pays d'origine de votre appareil.</p>
              </div>
            </div>
          </section>
        )}

        {view === 'contact' && (
          <section className="py-20 px-10 max-w-4xl mx-auto glass-card rounded-[60px] animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-12">Nous Contacter</h2>
            <div className="bg-white/40 p-12 rounded-[50px] border border-white/60 text-center">
              <p className="text-2xl font-bold italic mb-8">Une question technique ou un partenariat ?</p>
              <a href="mailto:hello@avisscore.tech" className="text-3xl font-black text-[#4158D0] hover:underline">hello@avisscore.tech</a>
              <div className="mt-12 flex justify-center gap-8">
                <div className="w-16 h-16 bg-[#050A30] text-white rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"><i className="fab fa-twitter"></i></div>
                <div className="w-16 h-16 bg-[#050A30] text-white rounded-full flex items-center justify-center text-2xl hover:scale-110 transition-transform"><i className="fab fa-linkedin"></i></div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="py-20 glass-card !rounded-none !border-x-0 !border-b-0 mt-20">
        <div className="max-w-[1300px] mx-auto px-10 text-center">
           <span className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
           <p className="text-[12px] font-bold uppercase tracking-[0.5em] opacity-20 italic mt-8 px-6">© 2025 AvisScore — Optimized Final v19.0</p>
        </div>
      </footer>
    </div>
  );
}
