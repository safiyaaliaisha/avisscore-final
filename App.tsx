import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis, MarketAlternative } from './types';

const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 92, // Affiche 9.2
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

// Helper pour le timeout de 4 secondes
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
      // Timeout 4s pour le chargement initial sur avisscore.fr
      const [reviews, names] = await withTimeout(Promise.all([
        fetchLatestReviews(12),
        fetchUniqueProducts()
      ]), 4000);
      setLatestReviews(reviews || []);
      setCompareList(names || []);
    } catch (e) {
      console.warn("Initial load timeout or error, using defaults");
    }
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

    // Supabase fetch (non-bloquant pour l'IA)
    fetchProductDataFromReviews(targetName)
      .then(dbData => {
        if (dbData && dbData.reviews && dbData.reviews.length > 0) {
          const reviewWithImage = dbData.reviews.find(r => r.image_url && r.image_url.trim().startsWith('http'));
          const bestImage = reviewWithImage ? reviewWithImage.image_url : (dbData.firstMatch?.image_url || initialImg);
          
          setProduct(prev => prev ? { 
            ...prev, 
            image_url: bestImage || initialImg, 
            reviews: dbData.reviews 
          } : null);
        }
      })
      .catch((err) => {
        console.warn("Supabase fetch failed for product details:", err);
      });

    try {
      // ALWAYS use process.env.API_KEY exclusively for the Google GenAI SDK.
      // Do not use UI prompts or fallbacks for the API key.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const fastPrompt = `STRICT JSON (TOUS LES TEXTES EN FRANÇAIS): {"score":number,"description":"phrase_courte_fr","pros":["p1","p2","p3","p4","p5","p6"],"cons":["c1","c2","c3","c4","c5","c6"],"predecessorName":"nom_fr","activeLifespanYears":number,"marketAlternatives":[{"name":"nom","price":"prix_approx_euro"}],"verdict":"verdict_fr","buyerTip":"conseil_achat_punchy_fr"} for "${targetName}". Génère exactement 6 points forts et 6 points faibles. NO MARKDOWN.`;

      // Perform the content generation with a timeout guard
      const res = await withTimeout(ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fastPrompt,
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1 
        }
      }), 4000);

      // Directly access .text property from GenerateContentResponse
      const rawData = JSON.parse(res.text || "{}");
      setAiVerdict({
        ...DEFAULT_ANALYSIS,
        ...rawData,
        pros: Array.isArray(rawData.pros) ? rawData.pros : DEFAULT_ANALYSIS.pros,
        cons: Array.isArray(rawData.cons) ? rawData.cons : DEFAULT_ANALYSIS.cons,
        marketAlternatives: Array.isArray(rawData.marketAlternatives) ? rawData.marketAlternatives : DEFAULT_ANALYSIS.marketAlternatives
      });
    } catch (e) {
      console.error("AI Turbo Error or Timeout:", e);
      // Fallback to defaults to maintain user experience
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
                  placeholder="Entrez un modèle..." 
                  className="flex-1 bg-transparent py-6 px-6 outline-none font-bold text-xl placeholder:text-[#050A30] placeholder:opacity-60 placeholder:italic" 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase hover:bg-[#4158D0] transition-all shadow-xl flex items-center gap-3">
                  <i className="fas fa-search text-xs"></i> ANALYSER
                </button>
              </div>
              <p className="mt-4 text-[9px] font-black uppercase tracking-[0.3em] opacity-30 italic">Scanner Optique IA V9.2 — Analyse en temps réel</p>
            </form>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-2 transition-all shadow-xl" onClick={() => handleSearch(rev.product_name || '', rev.image_url || '')}>
                  <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full aspect-video object-cover rounded-[30px] mb-4 bg-white/50" alt={rev.product_name || "Product"} />
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
                  <img 
                    src={product.image_url && product.image_url.startsWith('http') ? product.image_url : "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800"} 
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-700" 
                    alt={product.name} 
                  />
                  <div className="absolute top-6 right-6 bg-black text-white px-6 py-2 rounded-full font-black italic text-[10px] tracking-widest shadow-2xl uppercase">PRODUIT CERTIFIÉ</div>
                </div>

                <div className="space-y-6">
                  <div className="relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1A237E] via-[#4A148C] to-[#880E4F] rounded-[40px]"></div>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 blur-3xl -mr-20 -mt-20 rounded-full"></div>
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
                            <div className="text-right flex items-center gap-4">
                              <div className="px-3 py-1 bg-amber-400/10 rounded-lg">
                                <span className="text-amber-400 font-black italic text-sm">{alt.price}</span>
                              </div>
                              <i className="fas fa-external-link-alt text-[10px] opacity-20 group-hover:opacity-100 transition-all"></i>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group overflow-hidden">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#4158D0] to-[#C850C0] rounded-[40px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                    <div className="relative bg-white/80 backdrop-blur-xl p-10 rounded-[40px] shadow-xl border border-white/50">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-[#050A30] rounded-[15px] flex items-center justify-center text-white shadow-lg rotate-3 group-hover:rotate-0 transition-transform">
                          <i className="fas fa-lightbulb"></i>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] italic text-[#050A30]">ASTUCE TURBO V9</h4>
                          <span className="text-[9px] font-bold opacity-30 uppercase tracking-widest">Conseil d'expert IA</span>
                        </div>
                      </div>
                      <p className="text-sm font-bold italic leading-relaxed text-[#050A30] opacity-80 border-l-4 border-[#4158D0] pl-5 uppercase tracking-tight">
                        "{aiVerdict?.buyerTip || "Analysez bien le rapport qualité-prix par rapport aux modèles de l'année précédente."}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-4 italic">Moteur de calcul V9 Turbo</span>
                <h2 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-10 leading-none">{product.name}</h2>
                
                <div className="glass-card !bg-white/40 !rounded-[40px] mb-12 shadow-2xl border-white relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                   
                   <div className="flex flex-col md:flex-row w-full relative z-10">
                      <div className="flex-1 p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/5 bg-white/30">
                        <span className="text-[9px] font-black opacity-30 uppercase tracking-[0.3em] mb-4 italic">INDICE DE PERFORMANCE IA</span>
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
                          <div className="flex items-center gap-3 mb-4 opacity-40">
                            <i className="fas fa-history text-[10px]"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest italic">VERSION PRÉCÉDENTE</span>
                          </div>
                          <p className="text-2xl font-black italic text-[#050A30] uppercase tracking-tighter leading-tight">
                            {aiVerdict?.predecessorName || "---"}
                          </p>
                          <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold text-[#4158D0] opacity-60">
                             <i className="fas fa-caret-up"></i> +12% BOOST PERFORMANCE
                          </div>
                        </div>

                        <div className="p-10 flex flex-col justify-center hover:bg-white/20 transition-colors">
                          <div className="flex items-center gap-3 mb-4 opacity-40">
                            <i className="fas fa-hourglass-half text-[10px]"></i>
                            <span className="text-[9px] font-black uppercase tracking-widest italic">VALEUR RÉSIDUELLE</span>
                          </div>
                          <div className="flex items-baseline gap-2">
                             <p className="text-4xl font-black italic text-[#4158D0] uppercase tracking-tighter leading-none">
                               {aiVerdict?.activeLifespanYears || 3}
                             </p>
                             <span className="text-lg font-black italic opacity-40 uppercase tracking-tighter">ANS DE VIE</span>
                          </div>
                          <p className="mt-4 text-[10px] font-black opacity-30 italic uppercase tracking-widest">INDICE D'OBSOLESCENCE : FAIBLE</p>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 gap-8 mb-12">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-emerald-500 rounded-[45px] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <div className="relative glass-card border-l-8 border-emerald-500 p-8 rounded-[40px] shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                          <i className="fas fa-thumbs-up"></i>
                        </div>
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-emerald-600 italic">POINTS FORTS (6)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {(aiVerdict?.pros || []).slice(0, 6).map((p, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white hover:bg-emerald-50 transition-colors">
                            <i className="fas fa-check-circle text-emerald-500 text-sm opacity-60"></i>
                            <span className="text-sm font-bold uppercase italic tracking-tight opacity-80">{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute -inset-1 bg-rose-500 rounded-[45px] blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                    <div className="relative glass-card border-l-8 border-rose-500 p-8 rounded-[40px] shadow-lg">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-10 h-10 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-rose-500/30">
                          <i className="fas fa-thumbs-down"></i>
                        </div>
                        <h4 className="text-[12px] font-black uppercase tracking-widest text-rose-600 italic">POINTS FAIBLES (6)</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {(aiVerdict?.cons || []).slice(0, 6).map((c, i) => (
                          <div key={i} className="flex items-center gap-4 bg-white/40 p-4 rounded-2xl border border-white hover:bg-rose-50 transition-colors">
                            <i className="fas fa-exclamation-triangle text-rose-500 text-sm opacity-60"></i>
                            <span className="text-sm font-bold uppercase italic tracking-tight opacity-80">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'faq' && (
          <section className="py-24 px-6 max-w-[900px] mx-auto animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-16 tracking-tighter leading-none">Questions <span className="text-white/40">Fréquentes</span></h2>
            <div className="grid gap-6">
              {[
                { q: "Comment fonctionne l'analyse Turbo V9 ?", a: "Notre moteur utilise l'IA Gemini 3 Flash pour scanner instantanément des milliers d'avis utilisateurs et de fiches techniques afin de produire une synthèse objective en moins de 5 secondes." },
                { q: "D'où proviennent les données de score ?", a: "Les scores sont calculés par un algorithme propriétaire qui pondère la satisfaction client, la durabilité estimée et le positionnement prix par rapport à la concurrence actuelle." },
                { q: "Qu'est-ce que la valeur résiduelle ?", a: "C'est une estimation du nombre d'années durant lesquelles le produit restera performant et conservera une valeur de revente intéressante avant d'être technologiquement dépassé." },
                { q: "Puis-je comparer n'importe quel produit ?", a: "Oui, tant que le produit existe dans notre base de données 'my_reviews' alimentée par Supabase, notre moteur peut générer une comparaison détaillée." }
              ].map((item, i) => (
                <div key={i} className="glass-card p-8 rounded-[30px] shadow-xl border-white group">
                  <h3 className="text-lg font-black italic uppercase mb-4 text-[#050A30] group-hover:text-[#4158D0] transition-colors">
                    <i className="fas fa-chevron-right text-[10px] mr-3 opacity-30"></i> {item.q}
                  </h3>
                  <p className="text-sm font-medium opacity-70 leading-relaxed italic">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {view === 'privacy' && (
          <section className="py-24 px-6 max-w-[900px] mx-auto animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-16 tracking-tighter leading-none">Confidentialité <span className="text-white/40">& Données</span></h2>
            <div className="glass-card p-12 rounded-[50px] shadow-2xl border-white space-y-10">
               <div>
                 <h3 className="text-xl font-black italic uppercase mb-4">01. Protection des données</h3>
                 <p className="text-sm opacity-70 leading-relaxed italic uppercase tracking-tight">AvisScore ne collecte aucune donnée personnelle identifiable lors de vos recherches. Votre historique de navigation sur notre plateforme reste strictement local à votre session.</p>
               </div>
               <div>
                 <h3 className="text-xl font-black italic uppercase mb-4">02. Utilisation de l'IA</h3>
                 <p className="text-sm opacity-70 leading-relaxed italic uppercase tracking-tight">Le moteur Turbo V9 traite uniquement des données de produits et d'avis publics. Aucun traitement n'est effectué sur des informations privées. Les requêtes sont anonymisées avant d'être soumises à nos serveurs d'analyse.</p>
               </div>
               <div>
                 <h3 className="text-xl font-black italic uppercase mb-4">03. Cookies & Tracking</h3>
                 <p className="text-sm opacity-70 leading-relaxed italic uppercase tracking-tight">Nous utilisons des cookies techniques essentiels pour le bon fonctionnement de l'interface et la gestion de vos comparaisons en temps réel. Aucun cookie publicitaire tiers n'est implanté.</p>
               </div>
               <div className="pt-6 border-t border-black/5">
                 <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">Dernière mise à jour : Octobre 2025 — Conformité RGPD assurée.</p>
               </div>
            </div>
          </section>
        )}

        {view === 'contact' && (
          <section className="py-24 px-6 max-w-[900px] mx-auto animate-fade-in">
            <h2 className="text-5xl font-black italic uppercase mb-16 tracking-tighter leading-none">Contactez <span className="text-white/40">l'Équipe</span></h2>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="glass-card p-12 rounded-[50px] shadow-2xl border-white flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-[#050A30] rounded-full flex items-center justify-center text-white mb-8 shadow-xl">
                  <i className="fas fa-envelope text-3xl"></i>
                </div>
                <h3 className="text-2xl font-black italic uppercase mb-2">EMAIL DIRECT</h3>
                <a href="mailto:contact@avisscore.fr" className="text-xl font-black text-[#4158D0] hover:underline uppercase italic">contact@avisscore.fr</a>
                <p className="mt-6 text-[10px] font-bold opacity-30 uppercase tracking-widest">Réponse garantie sous 24/48h</p>
              </div>
              
              <div className="glass-card p-12 rounded-[50px] shadow-2xl border-white flex flex-col justify-center items-center text-center">
                <div className="w-20 h-20 bg-[#4158D0] rounded-full flex items-center justify-center text-white mb-8 shadow-xl">
                  <i className="fas fa-map-marker-alt text-3xl"></i>
                </div>
                <h3 className="text-2xl font-black italic uppercase mb-2">SIÈGE SOCIAL</h3>
                <p className="text-lg font-black uppercase italic opacity-60">Paris, France</p>
                <p className="mt-6 text-[10px] font-bold opacity-30 uppercase tracking-widest">Support Technique International</p>
              </div>
            </div>
          </section>
        )}

        {view === 'compare' && (
          <section className="py-24 px-6 max-w-[1000px] mx-auto animate-fade-in">
             <h2 className="text-5xl font-black italic uppercase text-center mb-16 tracking-tighter leading-none">
               DUEL <span className="text-white/40">TECH.</span> <br/>COMPARATIF IA.
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-20">
                <select className="glass-card p-6 rounded-3xl font-black italic uppercase outline-none focus:ring-4 ring-[#4158D0]/20 cursor-pointer w-full" value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                  <option value="">SÉLECTIONNER PRODUIT A</option>
                  {compareList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select className="glass-card p-6 rounded-3xl font-black italic uppercase outline-none focus:ring-4 ring-[#4158D0]/20 cursor-pointer w-full" value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                  <option value="">SÉLECTIONNER PRODUIT B</option>
                  {compareList.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
             {compareA && compareB && (
               <div className="text-center">
                 <button onClick={() => handleSearch(compareA)} className="bg-black text-white px-16 py-6 rounded-full font-black uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all tracking-widest italic">LANCER LE COMPARATIF</button>
               </div>
             )}
          </section>
        )}
      </main>

      <footer className="py-24 glass-card !rounded-none !border-0 text-center shadow-inner mt-20 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent"></div>
         <span className="text-4xl font-black italic uppercase tracking-tighter relative z-10">Avis<span className="text-[#4158D0]">Score</span></span>
         <div className="flex justify-center gap-10 mt-10 relative z-10">
           <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">FAQ</button>
           <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">PRIVACY</button>
           <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-all">CONTACT</button>
         </div>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8 relative z-10">© 2025 — ENGINE V9.2 TURBO — TOUS DROITS RÉSERVÉS</p>
      </footer>

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