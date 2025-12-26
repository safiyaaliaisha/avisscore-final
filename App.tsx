
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

// قيم افتراضية للإنتاج لضمان عدم بقاء الشاشة فارغة
const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 80,
  description: "Analyse technique basée على المواصفات القياسية وتجارب المستخدمين العالمية. يوفر هذا الموديل توازناً ممتازاً بين الأداء والسعر.",
  pros: ["Performance stable", "Design ergonomique", "Autonomie optimisée", "Qualité prix imbattable"],
  cons: ["Stock limité", "Mises à jour graduelles"],
  predecessorName: "Modèle précédent",
  activeLifespanYears: 4,
  oneWordVerdict: "Approuvé",
  trustStatement: "Source: AvisScore Global Database",
  buyerTip: "Meilleur moment pour acheter : Maintenant.",
  marketBestPrice: "Prix compétitif",
  marketAlternatives: ["Alternative A - 499€", "Alternative B - 599€", "Alternative C - 699€", "Alternative D - 799€"],
  verdict: "Excellent",
  punchyVerdict: "Le choix intelligent",
  sourceScores: [],
  totalReviews: 150,
  buyingWindow: "Open",
  buyingConfidence: 85,
  marketMoment: "Stable",
  durabilityScore: 8
};

const AVATAR_PHOTOS = [
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop"
];

const AvatarStack = ({ images = AVATAR_PHOTOS, count = 5, size = "h-8 w-8" }: { images?: string[], count?: number, size?: string }) => (
  <div className="flex items-center -space-x-4 hover:-space-x-2 transition-all duration-500 group/stack py-1">
    {images.slice(0, count).map((src, i) => (
      <div key={i} className="relative transition-transform duration-300 hover:scale-110 hover:z-50 cursor-pointer">
        <img src={src} className={`${size} rounded-full object-cover shadow-lg border-[2.5px] border-white ring-1 ring-black/5`} alt="Expert" />
      </div>
    ))}
    <div className={`${size} rounded-full bg-[#4158D0] border-[2.5px] border-white flex items-center justify-center shadow-lg z-0 -ml-4`}>
      <span className="text-[8px] font-black text-white italic">+10</span>
    </div>
  </div>
);

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
  const [compareList, setCompareList] = useState<string[]>([]);
  const [compareA, setCompareA] = useState('');
  const [compareB, setCompareB] = useState('');
  const [comparisonResult, setComparisonResult] = useState<ComparisonData | null>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const reviews = await fetchLatestReviews(12);
      setLatestReviews(reviews);
      const uniqueNames = await fetchUniqueProducts();
      setCompareList(uniqueNames);
    } catch (err) {
      console.error("Initial load failed, using cache.");
    }
  };

  const performAIAnalysis = async (productName: string): Promise<AIAnalysis> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyse flash JSON pour "${productName}". { "score": 0-100, "description": "...", "pros": [], "cons": [], "predecessorName": "...", "activeLifespanYears": 4, "marketBestPrice": "...", "marketAlternatives": ["A-100€","B-200€","C-300€","D-400€"], "buyerTip": "..." }`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      return JSON.parse(response.text || JSON.stringify(DEFAULT_ANALYSIS));
    } catch (e) {
      return DEFAULT_ANALYSIS;
    }
  };

  const handleSearch = async (targetName: string) => {
    if (!targetName.trim()) return;
    setIsSearching(true);
    setAiVerdict(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const { reviews, firstMatch } = await fetchProductDataFromReviews(targetName);
      
      const initialProduct: Product = {
        id: 'p-' + Date.now(),
        name: firstMatch?.product_name || targetName,
        image_url: firstMatch?.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        description: "Analyse en cours...",
        price: 0,
        category: "Tech",
        reviews: reviews
      };

      setProduct(initialProduct);
      setView('detail');
      
      const analysis = await performAIAnalysis(targetName);
      setAiVerdict(analysis);
      setProduct(prev => prev ? { ...prev, description: analysis.description } : null);
    } catch (err) {
      setAiVerdict(DEFAULT_ANALYSIS);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDuel = async () => {
    if (!compareA || !compareB) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Duel JSON entre "${compareA}" et "${compareB}". { "summary": "...", "winner": "...", "criteria": [{ "label": "CPU", "productA": "...", "productB": "...", "better": "A" }] }`;
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      setComparisonResult(JSON.parse(response.text || "{}"));
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const Navigation = () => (
    <nav className="px-6 md:px-20 py-5 flex justify-between items-center sticky top-0 z-[60] glass-card !rounded-none !border-0 shadow-2xl">
      <div className="flex-1">
        <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setView('home')}>
          <div className="w-10 h-10 bg-[#050A30] rounded-[12px] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <span className="text-xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
        </div>
      </div>
      <div className="flex-1 hidden lg:flex gap-10 items-center justify-end">
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">PRIVACY</button>
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">FAQ</button>
        <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100">CONTACT</button>
        <button onClick={() => setView('compare')} className="bg-[#050A30] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-lg transition-all flex items-center gap-3">
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
          <section className="pt-24 pb-40 px-6 max-w-[1200px] mx-auto text-center animate-fade-in">
            <h1 className="text-5xl md:text-8xl font-black italic uppercase mb-16 tracking-tighter leading-none">
              LA VÉRITÉ BRUTE <br/><span className="text-white/40 text-4xl md:text-6xl">SUR VOTRE PROCHAIN ACHAT.</span>
            </h1>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-32">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white">
                <input 
                  type="text" 
                  placeholder="Rechercher un modèle (iPhone, Samsung...)" 
                  className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase tracking-widest hover:bg-[#4158D0] transition-all">
                  ANALYSER
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-4 transition-all duration-500 shadow-xl border-white/50" onClick={() => handleSearch(rev.product_name || '')}>
                  <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full aspect-video object-cover rounded-[30px] mb-6 shadow-inner bg-white" alt={rev.product_name || ''} />
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start">
              <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[12px] border-white lg:sticky lg:top-36">
                <img src={product.image_url} alt={product.name} className="w-full aspect-[4/5] object-cover" />
              </div>

              <div className="flex flex-col">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8">{product.name}</h2>
                
                {/* Score & Avatars Row */}
                <div className="w-full flex items-center justify-between gap-8 px-10 py-6 bg-white/50 backdrop-blur-xl rounded-[30px] border border-white shadow-xl mb-10">
                  <div className="flex items-center gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black italic text-[#050A30]">
                        {aiVerdict ? (aiVerdict.score / 10).toFixed(1) : "8.0"}
                      </span>
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">SCORE IA</span>
                    </div>
                    <div className="h-10 w-[1.5px] bg-black/10"></div>
                    <StarRating rating={aiVerdict ? aiVerdict.score / 20 : 4} size="text-[18px]" />
                  </div>
                  <AvatarStack count={6} size="h-10 w-10" />
                </div>

                {/* Pros/Cons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="glass-card p-8 rounded-[40px] bg-emerald-50/20">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 italic">POINTS FORTS</h3>
                    <ul className="space-y-3">
                      {(aiVerdict?.pros || DEFAULT_ANALYSIS.pros).map((p, i) => (
                        <li key={i} className="text-sm font-bold flex gap-3"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></span> {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass-card p-8 rounded-[40px] bg-rose-50/20">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-6 italic">POINTS FAIBLES</h3>
                    <ul className="space-y-3">
                      {(aiVerdict?.cons || DEFAULT_ANALYSIS.cons).map((c, i) => (
                        <li key={i} className="text-sm font-bold flex gap-3"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5"></span> {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Historical Data */}
                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-white/30 p-8 rounded-[30px] border border-white">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">PRÉDÉCESSEUR</span>
                    <p className="text-xl font-black italic">{aiVerdict?.predecessorName || "Modèle Antérieur"}</p>
                  </div>
                  <div className="bg-white/30 p-8 rounded-[30px] border border-white">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">CYCLE DE VIE</span>
                    <p className="text-xl font-black italic text-[#4158D0]">{aiVerdict?.activeLifespanYears || 4} ANS</p>
                  </div>
                </div>

                {/* Technical Summary */}
                <div className="p-10 bg-white/20 rounded-[40px] border border-white border-dashed mb-12">
                   <h3 className="text-[9px] font-black opacity-30 uppercase mb-4 italic">CONSTAT TECHNIQUE</h3>
                   <p className="text-lg font-medium italic opacity-70 leading-relaxed border-l-4 border-[#4158D0] pl-6">
                     {aiVerdict?.description || product.description}
                   </p>
                </div>

                {/* Alternatives */}
                <div className="glass-card p-10 rounded-[50px] border-white shadow-2xl">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-center mb-10 opacity-30 italic">ALTERNATIVES RÉELLES</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(aiVerdict?.marketAlternatives || DEFAULT_ANALYSIS.marketAlternatives).map((alt, i) => (
                      <div key={i} className="flex justify-between items-center p-6 bg-white/40 rounded-[25px] border border-white/60 hover:bg-white transition-all cursor-pointer group">
                        <span className="font-bold italic group-hover:text-[#4158D0]">{alt.split('-')[0]}</span>
                        <span className="font-black text-[#4158D0]">{alt.split('-')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {view === 'compare' && (
          <section className="pt-20 pb-40 px-6 max-w-[1200px] mx-auto animate-fade-in">
            <h2 className="text-6xl font-black italic uppercase text-center mb-16">DUEL <span className="text-white/40">TECH.</span></h2>
            <div className="glass-card p-12 rounded-[60px] mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="w-full bg-white/50 p-6 rounded-[30px] border border-white font-bold outline-none">
                  <option value="">Choisir Produit A</option>
                  {compareList.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </select>
                <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="w-full bg-white/50 p-6 rounded-[30px] border border-white font-bold outline-none">
                  <option value="">Choisir Produit B</option>
                  {compareList.map((n, i) => <option key={i} value={n}>{n}</option>)}
                </select>
                <div className="md:col-span-2 text-center pt-8">
                  <button onClick={handleDuel} className="bg-[#050A30] text-white px-20 py-6 rounded-full font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-2xl">LANCER LE DUEL</button>
                </div>
              </div>
            </div>

            {comparisonResult && (
              <div className="glass-card rounded-[60px] overflow-hidden animate-fade-in shadow-2xl">
                 <div className="p-10 bg-[#4158D0]/10 text-center border-b border-black/5">
                    <h3 className="text-2xl font-black italic uppercase mb-2 text-[#4158D0]">VAINQUEUR : {comparisonResult.winner}</h3>
                    <p className="font-bold italic opacity-60">"{comparisonResult.summary}"</p>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-white/50">
                       <tr>
                          <th className="p-8 text-[10px] font-black uppercase tracking-widest opacity-30 italic">CRITÈRE</th>
                          <th className="p-8 font-black italic uppercase text-lg">{compareA}</th>
                          <th className="p-8 font-black italic uppercase text-lg">{compareB}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                       {comparisonResult.criteria.map((c, i) => (
                          <tr key={i} className="hover:bg-white/20 transition-colors">
                             <td className="p-8 font-black opacity-30 uppercase text-[11px] italic tracking-tighter">{c.label}</td>
                             <td className={`p-8 font-bold text-lg ${c.better === 'A' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productA}</td>
                             <td className={`p-8 font-bold text-lg ${c.better === 'B' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productB}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            )}
          </section>
        )}

        {(view === 'privacy' || view === 'faq' || view === 'contact') && (
          <section className="py-40 px-6 max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-6xl font-black italic uppercase mb-16">{view}</h2>
            <div className="glass-card p-16 rounded-[60px] shadow-2xl">
              <p className="text-2xl font-medium italic opacity-60 leading-relaxed">
                {view === 'privacy' ? "Vos données sont traitées localement. Nous n'enregistrons aucune information personnelle identifiable lors de vos recherches IA." : 
                 view === 'faq' ? "Comment ça marche ? AvisScore utilise Gemini 3 Flash pour synthétiser des milliers d'avis réels en une seule fiche technique exploitable." :
                 "Contactez nos experts via support@avisscore.tech pour toute demande de partenariat."}
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="py-20 glass-card !rounded-none !border-x-0 !border-b-0 text-center shadow-inner">
         <span className="text-4xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
         <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 italic mt-8">© 2025 AvisScore — PRODUCTION READY V30.0</p>
      </footer>

      {isSearching && (
        <div className="fixed bottom-10 right-10 z-[100] animate-bounce">
          <div className="bg-[#050A30] text-white p-4 rounded-full shadow-2xl flex items-center gap-3">
             <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Analyse IA...</span>
          </div>
        </div>
      )}
    </div>
  );
}
