
import React, { useState, useEffect, useMemo } from 'react';
import { fetchLatestReviews, fetchProductByName, fetchUniqueProducts } from './services/reviewService';
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Review, AIAnalysis, ComparisonData } from './types';

const ACCENT_BLUE = "#007AFF";

export default function App() {
  const [view, setView] = useState<'home' | 'comparison'>('home');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [latestReviews, setLatestReviews] = useState<Review[]>([]);
  const [uniqueProductNames, setUniqueProductNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiVerdict, setAiVerdict] = useState<AIAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Comparison State
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [reviews, names] = await Promise.all([
        fetchLatestReviews(6),
        fetchUniqueProducts()
      ]);
      setLatestReviews(reviews);
      setUniqueProductNames(names);
    } catch (err) {
      console.error("Data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = useMemo(() => {
    if (!query.trim() || product) return latestReviews;
    return latestReviews.filter(rev => 
      rev.product_name?.toLowerCase().includes(query.toLowerCase()) ||
      rev.review_text?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, latestReviews, product]);

  const handleShare = async (phoneName: string, isComparison = false) => {
    const text = isComparison 
      ? `Check out this AI-powered comparison featuring ${phoneName} on AvisScore!`
      : `Check out this AI-powered review of ${phoneName} on AvisScore!`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AvisScore Analysis',
          text: text,
          url: url,
        });
      } catch (err) {
        console.debug('Share cancelled or failed', err);
      }
    } else {
      handleCopyLink(phoneName, isComparison);
    }
  };

  const handleWhatsApp = (phoneName: string, isComparison = false) => {
    const text = isComparison 
      ? `Check out this AI-powered comparison featuring ${phoneName} on AvisScore!`
      : `Check out this AI-powered review of ${phoneName} on AvisScore!`;
    const url = window.location.href;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`, '_blank');
  };

  const handleCopyLink = (phoneName: string, isComparison = false) => {
    const text = isComparison 
      ? `Check out this AI-powered comparison featuring ${phoneName} on AvisScore!`
      : `Check out this AI-powered review of ${phoneName} on AvisScore!`;
    const url = window.location.href;
    navigator.clipboard.writeText(`${text} ${url}`);
    alert('Lien copié dans le presse-papier !');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setProduct(null);
    setAiVerdict(null);

    try {
      const data = await fetchProductByName(query);
      if (data) {
        setProduct(data);
        generateAIVerdict(data);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateAIVerdict = async (p: Product) => {
    setAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyses experte du smartphone : ${p.name}. Spécifications : ${p.description}. Format JSON uniquement.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              score: { type: Type.NUMBER }
            },
            required: ["verdict", "pros", "cons", "score"]
          }
        }
      });
      setAiVerdict(JSON.parse(response.text));
    } catch (err) {
      console.error("AI Verdict failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCompare = async () => {
    if (!selectedA || !selectedB) return;
    setComparing(true);
    setComparisonResult(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contextA = latestReviews.filter(r => r.product_name === selectedA).map(r => r.review_text).join(". ");
      const contextB = latestReviews.filter(r => r.product_name === selectedB).map(r => r.review_text).join(". ");

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Compare ces deux smartphones : "${selectedA}" vs "${selectedB}".
        Basé sur ces retours :
        A: ${contextA}
        B: ${contextB}
        Analyse spécifiquement : Display, Battery, et AI Verdict. Sortie JSON uniquement.`,
        config: {
          responseMimeType: "application/json",
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
                    productB: { type: Type.STRING }
                  },
                  required: ["label", "productA", "productB"]
                }
              }
            },
            required: ["summary", "winner", "criteria"]
          }
        }
      });
      setComparisonResult(JSON.parse(response.text));
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setComparing(false);
    }
  };

  const NumericalRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    return (
      <div className="flex items-center gap-2">
        <div className="flex text-yellow-400 gap-0.5">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`${i < fullStars ? 'fas' : i === fullStars && hasHalfStar ? 'fas fa-star-half-alt' : 'far'} fa-star text-[10px]`}></i>
          ))}
        </div>
        <span className="text-[11px] font-black text-slate-300">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-[#007AFF]/40">
      {/* Premium Header */}
      <nav className="px-6 md:px-12 py-5 flex justify-between items-center bg-[#020617]/90 backdrop-blur-3xl sticky top-0 z-50 border-b border-white/5 shadow-2xl">
        <div 
          className="flex items-center gap-3 cursor-pointer group" 
          onClick={() => {setView('home'); setProduct(null); setQuery('');}}
        >
          <div className="w-10 h-10 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#007AFF]/20 transition-transform group-hover:rotate-6">
            <i className="fas fa-bolt text-white text-lg"></i>
          </div>
          <span className="text-2xl font-black tracking-tighter">
            Avis<span style={{ color: ACCENT_BLUE }}>Score</span>
          </span>
        </div>
        
        <div className="hidden md:flex gap-10 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          <button onClick={() => {setView('home'); setProduct(null);}} className={`hover:text-white transition-colors ${view === 'home' && 'text-[#007AFF]'}`}>Smartphones</button>
          <button onClick={() => setView('comparison')} className={`hover:text-white transition-colors ${view === 'comparison' && 'text-[#007AFF]'}`}>Comparatifs</button>
          <a href="#" className="hover:text-white transition-colors">Lab IA</a>
        </div>

        <button className="bg-white text-black px-7 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#007AFF] hover:text-white transition-all shadow-xl active:scale-95">
          Accès Expert
        </button>
      </nav>

      <main>
        {view === 'home' ? (
          <>
            <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-gradient-to-b from-[#007AFF]/15 to-transparent blur-[120px] rounded-full pointer-events-none"></div>
              <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-full">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#007AFF]">L'Intelligence au service du Choix</span>
                </div>
                <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none italic">AvisScore</h1>
                <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-80">
                  Le guide ultime pour décoder l'innovation mobile mondiale avec Gemini.
                </p>
                <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto group mt-16">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#007AFF] to-cyan-400 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-700"></div>
                  <div className="relative flex shadow-2xl">
                    <input
                      type="text"
                      placeholder="Ex: Samsung S25 Ultra, iPhone 16 Pro..."
                      className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl px-8 py-6 outline-none focus:border-[#007AFF]/50 text-lg text-white placeholder:text-slate-500"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#007AFF] text-white px-8 py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg transition-transform active:scale-95">Analyser</button>
                  </div>
                </form>
              </div>
            </section>

            <div className="max-w-7xl mx-auto px-6 md:px-12">
              {loading ? (
                <div className="flex flex-col items-center py-32 space-y-6">
                  <div className="w-12 h-12 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : product ? (
                <div className="space-y-32 pb-40">
                  <div className="grid lg:grid-cols-12 gap-20 items-center pt-10">
                    <div className="lg:col-span-5 relative group">
                      <div className="absolute -inset-4 bg-[#007AFF]/10 blur-[60px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="glass-card rounded-[48px] p-6 border-white/10 shadow-2xl overflow-hidden relative">
                        <img src={product.image_url} alt={product.name} className="w-full aspect-[4/5] object-cover rounded-[32px] group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    </div>
                    <div className="lg:col-span-7 space-y-10">
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[#007AFF] text-[10px] font-black uppercase tracking-widest">Détails Technique</span>
                          <div className="flex gap-2">
                             <button onClick={() => handleShare(product.name)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#007AFF] transition-colors"><i className="fas fa-share-nodes text-[10px]"></i></button>
                             <button onClick={() => handleWhatsApp(product.name)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-green-500 transition-colors"><i className="fab fa-whatsapp text-[10px]"></i></button>
                          </div>
                        </div>
                        <h2 className="text-6xl md:text-8xl font-black tracking-tighter">{product.name}</h2>
                        <p className="text-slate-400 text-2xl font-medium leading-relaxed">{product.description}</p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(product.specs || {}).map(([key, val]) => (
                          <div key={key} className="bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
                            <p className="text-[10px] text-slate-500 uppercase font-black mb-2 tracking-widest">{key}</p>
                            <p className="text-sm font-bold">{val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  {aiVerdict && (
                    <div className="bg-gradient-to-br from-[#007AFF]/15 via-slate-900 to-transparent border border-white/10 rounded-[64px] p-12 md:p-20 relative overflow-hidden shadow-2xl">
                      <div className="relative z-10 space-y-12">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-xl shadow-[#007AFF]/30"><i className="fas fa-brain text-white text-2xl"></i></div>
                          <h3 className="text-4xl font-black">Verdict Gemini IA</h3>
                        </div>
                        <p className="text-3xl text-slate-100 italic font-semibold leading-snug tracking-tight">"{aiVerdict.verdict}"</p>
                        <div className="grid md:grid-cols-2 gap-20">
                          <div className="space-y-6">
                            <p className="text-[#007AFF] text-[11px] font-black uppercase border-b border-white/5 pb-4 tracking-widest">Points Forts</p>
                            <ul className="space-y-4">{aiVerdict.pros.map((p, i) => <li key={i} className="text-slate-400 flex items-center gap-4"><span className="w-2 h-2 bg-[#007AFF] rounded-full shadow-[0_0_8px_#007AFF]"></span>{p}</li>)}</ul>
                          </div>
                          <div className="space-y-6">
                            <p className="text-rose-500 text-[11px] font-black uppercase border-b border-white/5 pb-4 tracking-widest">Points Faibles</p>
                            <ul className="space-y-4">{aiVerdict.cons.map((c, i) => <li key={i} className="text-slate-400 flex items-center gap-4"><span className="w-2 h-2 bg-slate-700 rounded-full"></span>{c}</li>)}</ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <section className="mt-10 py-24 border-t border-white/5">
                  <h3 className="text-4xl font-black tracking-tighter uppercase italic mb-12">Tests Récents</h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {filteredReviews.map((rev) => (
                      <div key={rev.id} className="glass-card rounded-[40px] border-white/5 hover:border-[#007AFF]/40 hover:bg-white/[0.04] transition-all group relative flex flex-col h-full overflow-hidden shadow-2xl">
                        {/* Actions Overlay */}
                        <div className="absolute top-6 right-6 flex items-center gap-2 z-20">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShare(rev.product_name || 'this phone'); }}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-[#007AFF] transition-all opacity-0 group-hover:opacity-100"
                          >
                            <i className="fas fa-share-nodes text-[12px]"></i>
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleWhatsApp(rev.product_name || 'this phone'); }}
                            className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-green-600 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <i className="fab fa-whatsapp text-[12px]"></i>
                          </button>
                        </div>
                        
                        <div className="aspect-video w-full overflow-hidden">
                           <img src={rev.image_url} alt={rev.product_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale group-hover:grayscale-0 opacity-60 group-hover:opacity-100" />
                        </div>
                        
                        <div className="p-10 flex flex-col h-full">
                          <div className="space-y-4 mb-8">
                            <NumericalRating rating={rev.rating} />
                            <h4 className="font-black text-2xl tracking-tight text-white group-hover:text-[#007AFF] transition-colors leading-tight">{rev.product_name}</h4>
                          </div>
                          <p className="text-slate-400 text-lg italic mb-auto line-clamp-4 font-medium leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">"{rev.review_text}"</p>
                          <div className="flex items-center gap-4 pt-8 mt-10 border-t border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">{rev.author_name.charAt(0)}</div>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-white">{rev.author_name}</p>
                              <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest mt-0.5">{new Date(rev.created_at).toLocaleDateString()}</p>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                               <button onClick={(e) => { e.stopPropagation(); handleCopyLink(rev.product_name || 'this phone'); }} className="text-[10px] text-slate-500 hover:text-white transition-colors px-2 py-1"><i className="fas fa-link"></i></button>
                               <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter bg-white/5 px-3 py-1.5 rounded-full border border-white/5">{rev.source || 'AvisScore'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        ) : (
          <section className="max-w-7xl mx-auto px-6 md:px-12 py-32 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <div className="space-y-8 mb-20 text-center">
              <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-full mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#007AFF]">Dual Analysis Engine</span>
              </div>
              <h2 className="text-7xl md:text-9xl font-black tracking-tighter">Comparaison <span style={{ color: ACCENT_BLUE }}>Elite</span></h2>
              <p className="text-slate-400 text-xl font-medium opacity-80 max-w-2xl mx-auto italic">Mettez à l'épreuve les flagships du moment avec notre comparateur assisté par IA.</p>
            </div>

            <div className="grid md:grid-cols-11 items-center gap-10 mb-20 max-w-5xl mx-auto">
              <div className="md:col-span-5 space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 block mb-2">Modèle Alpha</label>
                <div className="relative">
                   <select 
                    value={selectedA} 
                    onChange={(e) => setSelectedA(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:border-[#007AFF] text-white appearance-none cursor-pointer hover:bg-white/5 transition-all text-sm font-bold"
                  >
                    <option value="">Sélectionner un smartphone...</option>
                    {uniqueProductNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs"></i>
                </div>
              </div>

              <div className="md:col-span-1 flex justify-center pt-8 md:pt-0">
                <div className="w-14 h-14 bg-white/5 rounded-full flex items-center justify-center border border-white/10 italic text-[#007AFF] font-black text-xl shadow-2xl">VS</div>
              </div>

              <div className="md:col-span-5 space-y-4">
                <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 block mb-2">Modèle Beta</label>
                <div className="relative">
                  <select 
                    value={selectedB} 
                    onChange={(e) => setSelectedB(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-2xl px-6 py-5 outline-none focus:border-[#007AFF] text-white appearance-none cursor-pointer hover:bg-white/5 transition-all text-sm font-bold"
                  >
                    <option value="">Sélectionner un smartphone...</option>
                    {uniqueProductNames.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                  <i className="fas fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none text-xs"></i>
                </div>
              </div>
            </div>

            <div className="flex justify-center mb-40">
              <button 
                onClick={handleCompare}
                disabled={!selectedA || !selectedB || comparing}
                className={`bg-[#007AFF] text-white px-20 py-6 rounded-[24px] font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-[#007AFF]/40 active:scale-95 transition-all disabled:opacity-20 flex items-center gap-5`}
              >
                {comparing ? <i className="fas fa-sync-alt animate-spin"></i> : <i className="fas fa-bolt"></i>}
                Lancer le Comparatif
              </button>
            </div>

            {comparisonResult && (
              <div className="space-y-24 animate-in zoom-in-95 duration-1000">
                {/* Visual Summary Card */}
                <div className="bg-gradient-to-br from-[#007AFF]/20 via-[#020617] to-transparent p-16 md:p-24 rounded-[64px] border border-white/10 relative overflow-hidden text-center shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_100%)] from-[#007AFF]/5 opacity-50"></div>
                  <div className="relative z-10 space-y-10">
                     <div className="flex justify-center gap-4 mb-4">
                        <button onClick={() => handleShare(`${selectedA} vs ${selectedB}`, true)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#007AFF] transition-all flex items-center gap-3"><i className="fas fa-share-nodes"></i> Share Comparison</button>
                        <button onClick={() => handleWhatsApp(`${selectedA} vs ${selectedB}`, true)} className="px-6 py-2 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-all flex items-center gap-3"><i className="fab fa-whatsapp"></i> WhatsApp</button>
                     </div>
                     <h3 className="text-4xl md:text-5xl font-black italic tracking-tighter">La Synthèse AvisScore</h3>
                     <p className="text-2xl md:text-3xl text-slate-200 italic font-medium max-w-5xl mx-auto leading-snug opacity-90 tracking-tight">"{comparisonResult.summary}"</p>
                     <div className="inline-flex items-center gap-6 px-12 py-5 bg-[#007AFF] text-white rounded-full font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-[#007AFF]/40">
                        <i className="fas fa-trophy"></i>
                        Gagnant : {comparisonResult.winner}
                     </div>
                  </div>
                </div>

                {/* VS Comparison Sheet */}
                <div className="overflow-hidden border border-white/10 rounded-[48px] shadow-[0_40px_100px_-20px_rgba(0,122,255,0.15)] bg-slate-900/40 backdrop-blur-3xl relative">
                  <div className="grid grid-cols-3 bg-white/5 border-b border-white/10">
                    <div className="p-10 text-[12px] font-black uppercase text-[#007AFF] tracking-[0.5em] flex items-center">Comparatif</div>
                    <div className="p-10 text-3xl font-black italic tracking-tighter border-l border-white/5 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{selectedA}</div>
                    <div className="p-10 text-3xl font-black italic tracking-tighter border-l border-white/5 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">{selectedB}</div>
                  </div>
                  
                  {comparisonResult.criteria.map((c, i) => (
                    <div key={i} className="grid grid-cols-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <div className="p-10 bg-white/5 flex flex-col justify-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-2">{c.label}</span>
                        <div className="w-8 h-1 bg-[#007AFF] rounded-full"></div>
                      </div>
                      <div className="p-10 text-slate-300 leading-relaxed font-medium text-lg border-l border-white/5 italic">
                        {c.productA}
                      </div>
                      <div className="p-10 text-slate-300 leading-relaxed font-medium text-lg border-l border-white/5 italic">
                        {c.productB}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <footer className="border-t border-white/5 py-24 px-6 bg-[#01040f] mt-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12 opacity-60">
          <div className="flex flex-col gap-4">
             <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#007AFF] rounded-2xl flex items-center justify-center shadow-lg shadow-[#007AFF]/30"><i className="fas fa-bolt text-white"></i></div>
              <span className="font-black text-3xl tracking-tighter uppercase">AvisScore</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Premium Tech Intelligence Labs</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.5em]">© 2025 AvisScore — All Tech Insights Reserved</p>
            <p className="text-[#007AFF] text-[9px] font-black uppercase tracking-[0.3em]">Powered by Supabase Real-time & Gemini 3.0 Pro</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
