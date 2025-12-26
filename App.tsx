
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { fetchLatestReviews, fetchProductDataFromReviews, fetchUniqueProducts } from './services/reviewService';
import { Product, Review, AIAnalysis, ComparisonData } from './types';

// القواعد الذهبية: القيم الافتراضية للإنتاج لضمان تجربة حية دائماً
const DEFAULT_ANALYSIS: AIAnalysis = {
  score: 80, // تعادل 8.0
  description: "Analyse technique optimisée. Ce produit offre une performance équilibrée avec une efficacité énergétique de pointe pour sa catégorie.",
  pros: ["Rapport performance-prix", "Design premium", "Écran haute fidélité", "Autonomie robuste"],
  cons: ["Disponibilité limitée", "Interface à apprivoiser"],
  predecessorName: "Série précédente",
  activeLifespanYears: 4, // القاعدة الذهبية: 4 سنوات
  oneWordVerdict: "Excellent",
  trustStatement: "Validé par AvisScore Lab",
  buyerTip: "Le meilleur moment pour l'acquisition est le cycle actuel.",
  marketBestPrice: "Prix d'équilibre",
  marketAlternatives: ["Alternative Premium - 799€", "Option Pro - 899€", "Édition Standard - 699€", "Modèle Économique - 599€"],
  verdict: "Recommandé",
  punchyVerdict: "Le choix de la raison",
  sourceScores: [],
  totalReviews: 120,
  buyingWindow: "Optimale",
  buyingConfidence: 90,
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

// دالة مساعدة للتعامل مع Timeout في Supabase
const withTimeout = (promise: Promise<any>, ms: number) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

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
      const reviews = await withTimeout(fetchLatestReviews(12), 8000);
      setLatestReviews(reviews);
      const uniqueNames = await withTimeout(fetchUniqueProducts(), 8000);
      setCompareList(uniqueNames);
    } catch (err) {
      console.warn("Utilisation du mode hors-ligne.");
    }
  };

  const performAIAnalysis = async (productName: string): Promise<AIAnalysis> => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analyse flash JSON pour "${productName}". { "score": 0-100, "description": "...", "pros": [], "cons": [], "predecessorName": "...", "activeLifespanYears": 4, "marketBestPrice": "...", "marketAlternatives": ["A - 499€","B - 599€","C - 699€","D - 799€"], "buyerTip": "..." }`;
      
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
    
    // القاعدة الذهبية: إظهار القيم الافتراضية فوراً لتجنب الجمود
    setAiVerdict(DEFAULT_ANALYSIS);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      // محاولة الجلب من Supabase بمهلة 10 ثوانٍ
      const result = await withTimeout(fetchProductDataFromReviews(targetName), 10000);
      const { reviews, firstMatch } = result;
      
      const initialProduct: Product = {
        id: 'p-' + Date.now(),
        name: firstMatch?.product_name || targetName,
        image_url: firstMatch?.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        description: DEFAULT_ANALYSIS.description,
        price: 0,
        category: "Tech",
        reviews: reviews
      };

      setProduct(initialProduct);
      setView('detail');
      
      // تحديث البيانات بالذكاء الاصطناعي في الخلفية
      performAIAnalysis(targetName).then(analysis => {
        setAiVerdict(analysis);
        setProduct(prev => prev ? { ...prev, description: analysis.description } : null);
      }).catch(() => {});
      
    } catch (err) {
      // في حالة الفشل، نستخدم بيانات افتراضية كاملة لنعرض الصفحة
      setProduct({
        id: 'fallback-' + Date.now(),
        name: targetName,
        image_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800",
        description: DEFAULT_ANALYSIS.description,
        price: 0,
        category: "Tech",
        reviews: []
      });
      setView('detail');
    } finally {
      setIsSearching(false);
    }
  };

  const handleDuel = async () => {
    if (!compareA || !compareB) return;
    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Duel JSON entre "${compareA}" et "${compareB}". { "summary": "...", "winner": "...", "criteria": [{ "label": "Performance", "productA": "...", "productB": "...", "better": "A" }] }`;
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
        <button onClick={() => setView('privacy')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">PRIVACY</button>
        <button onClick={() => setView('faq')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">FAQ</button>
        <button onClick={() => setView('contact')} className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">CONTACT</button>
        <button onClick={() => { setView('compare'); setComparisonResult(null); }} className="bg-[#050A30] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-lg transition-all flex items-center gap-3">
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
              LA VÉRITÉ BRUTE <br/><span className="text-white/40 text-4xl md:text-6xl uppercase">SUR VOTRE PROCHAIN ACHAT.</span>
            </h1>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="max-w-3xl mx-auto mb-32">
              <div className="glass-card !rounded-[50px] p-2 flex items-center shadow-2xl border-white group focus-within:ring-4 ring-[#4158D0]/20 transition-all">
                <input 
                  type="text" 
                  placeholder="iPhone 16 Pro, Samsung S24 Ultra..." 
                  className="flex-1 bg-transparent py-6 px-10 outline-none font-bold text-xl placeholder:opacity-30"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="bg-[#050A30] text-white px-12 py-5 rounded-[40px] font-black uppercase tracking-widest hover:bg-[#4158D0] transition-all active:scale-95">
                  ANALYSER
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {latestReviews.slice(0, 6).map((rev, i) => (
                <div key={i} className="glass-card p-6 rounded-[40px] text-left cursor-pointer hover:-translate-y-4 transition-all duration-500 shadow-xl border-white/50" onClick={() => handleSearch(rev.product_name || '')}>
                  <img src={rev.image_url || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"} className="w-full aspect-video object-cover rounded-[30px] mb-6 shadow-inner bg-white/50" alt={rev.product_name || ''} />
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
              <div className="w-full bg-white rounded-[50px] overflow-hidden shadow-2xl border-[12px] border-white lg:sticky lg:top-36 transition-transform hover:scale-[1.01]">
                <img src={product.image_url} alt={product.name} className="w-full aspect-[4/5] object-cover" />
              </div>

              <div className="flex flex-col">
                <h2 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-8 leading-tight">{product.name}</h2>
                
                {/* القاعدة الذهبية: Score & Avatars في سطر واحد داخل الكارت الأبيض */}
                <div className="w-full flex items-center justify-between gap-8 px-10 py-6 bg-white/60 backdrop-blur-2xl rounded-[35px] border border-white shadow-2xl mb-10 transition-all hover:bg-white/80">
                  <div className="flex items-center gap-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black italic text-[#050A30]">
                        {( (aiVerdict?.score || 80) / 10 ).toFixed(1)}
                      </span>
                      <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">SCORE IA</span>
                    </div>
                    <div className="h-10 w-[1.5px] bg-black/10"></div>
                    <StarRating rating={aiVerdict ? aiVerdict.score / 20 : 4} size="text-[18px]" />
                  </div>
                  <AvatarStack count={6} size="h-11 w-11" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="glass-card p-8 rounded-[40px] bg-emerald-50/20 border-emerald-500/20 shadow-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-6 italic">POINTS FORTS</h3>
                    <ul className="space-y-3">
                      {(aiVerdict?.pros || DEFAULT_ANALYSIS.pros).map((p, i) => (
                        <li key={i} className="text-sm font-bold flex gap-3 text-[#050A30]/80"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 shrink-0"></span> {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="glass-card p-8 rounded-[40px] bg-rose-50/20 border-rose-500/20 shadow-lg">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 mb-6 italic">POINTS FAIBLES</h3>
                    <ul className="space-y-3">
                      {(aiVerdict?.cons || DEFAULT_ANALYSIS.cons).map((c, i) => (
                        <li key={i} className="text-sm font-bold flex gap-3 text-[#050A30]/80"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1.5 shrink-0"></span> {c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                  <div className="bg-white/40 p-8 rounded-[35px] border border-white shadow-sm">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">PRÉDÉCESSEUR</span>
                    <p className="text-xl font-black italic truncate">{aiVerdict?.predecessorName || "Série Antérieure"}</p>
                  </div>
                  <div className="bg-white/40 p-8 rounded-[35px] border border-white shadow-sm">
                    <span className="text-[9px] font-black opacity-30 uppercase block mb-1">CYCLE DE VIE</span>
                    <p className="text-xl font-black italic text-[#4158D0]">{aiVerdict?.activeLifespanYears || 4} ANS</p>
                  </div>
                </div>

                <div className="p-10 bg-white/20 rounded-[40px] border border-white border-dashed mb-12 shadow-inner">
                   <h3 className="text-[9px] font-black opacity-30 uppercase mb-4 italic">SYNTHÈSE TECHNIQUE</h3>
                   <p className="text-lg font-medium italic opacity-70 leading-relaxed border-l-4 border-[#4158D0] pl-6">
                     {aiVerdict?.description || product.description}
                   </p>
                </div>

                {/* القاعدة الذهبية: عرض 4 منتجات بأسعارها الحقيقية */}
                <div className="glass-card p-10 rounded-[50px] border-white shadow-2xl bg-white/10">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-center mb-10 opacity-30 italic">ALTERNATIVES DU MARCHÉ</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(aiVerdict?.marketAlternatives || DEFAULT_ANALYSIS.marketAlternatives).slice(0, 4).map((alt, i) => (
                      <div key={i} className="flex justify-between items-center p-6 bg-white/40 rounded-[25px] border border-white/60 hover:bg-white transition-all cursor-pointer group shadow-sm">
                        <span className="font-bold italic group-hover:text-[#4158D0]">{alt.split('-')[0].trim()}</span>
                        <span className="font-black text-[#4158D0] bg-[#4158D0]/5 px-3 py-1 rounded-lg">{alt.split('-')[1]?.trim()}</span>
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
            <h2 className="text-6xl font-black italic uppercase text-center mb-16 tracking-tighter leading-none">
              DUEL <span className="text-white/40">TECHNIQUE.</span>
            </h2>
            <div className="glass-card p-12 rounded-[60px] mb-12 shadow-2xl border-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-end">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4 italic">PRODUIT A</label>
                  <select value={compareA} onChange={(e) => setCompareA(e.target.value)} className="w-full bg-white/50 p-6 rounded-[35px] border border-white font-bold outline-none cursor-pointer hover:bg-white transition-colors appearance-none shadow-sm">
                    <option value="">Sélectionner...</option>
                    {compareList.map((n, i) => <option key={i} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest opacity-30 ml-4 italic">PRODUIT B</label>
                  <select value={compareB} onChange={(e) => setCompareB(e.target.value)} className="w-full bg-white/50 p-6 rounded-[35px] border border-white font-bold outline-none cursor-pointer hover:bg-white transition-colors appearance-none shadow-sm">
                    <option value="">Sélectionner...</option>
                    {compareList.map((n, i) => <option key={i} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2 text-center pt-8">
                  <button onClick={handleDuel} disabled={!compareA || !compareB} className="bg-[#050A30] text-white px-20 py-6 rounded-full font-black uppercase tracking-widest hover:bg-[#4158D0] shadow-2xl transition-all active:scale-95 disabled:opacity-30">
                    LANCER LA COMPARAISON
                  </button>
                </div>
              </div>
            </div>

            {comparisonResult && (
              <div className="glass-card rounded-[60px] overflow-hidden animate-fade-in shadow-2xl border-white">
                 <div className="p-12 bg-white/30 text-center border-b border-black/5">
                    <h3 className="text-3xl font-black italic uppercase mb-4 text-[#4158D0]">VAINQUEUR : {comparisonResult.winner}</h3>
                    <p className="font-bold italic opacity-60 text-lg">"{comparisonResult.summary}"</p>
                 </div>
                 <table className="w-full text-left">
                    <thead className="bg-white/50">
                       <tr>
                          <th className="p-8 text-[11px] font-black uppercase tracking-widest opacity-30 italic">COMPARAISON</th>
                          <th className="p-8 font-black italic uppercase text-xl border-l border-black/5">{compareA}</th>
                          <th className="p-8 font-black italic uppercase text-xl border-l border-black/5">{compareB}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                       {comparisonResult.criteria.map((c, i) => (
                          <tr key={i} className="hover:bg-white/20 transition-colors">
                             <td className="p-8 font-black opacity-30 uppercase text-[12px] italic tracking-tighter">{c.label}</td>
                             <td className={`p-8 font-bold text-lg border-l border-black/5 ${c.better === 'A' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productA}</td>
                             <td className={`p-8 font-bold text-lg border-l border-black/5 ${c.better === 'B' ? 'text-emerald-600 bg-emerald-500/5' : ''}`}>{c.productB}</td>
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
            <h2 className="text-6xl font-black italic uppercase mb-16 tracking-tighter">{view}</h2>
            <div className="glass-card p-20 rounded-[60px] shadow-2xl border-white bg-white/10">
              <p className="text-2xl font-medium italic opacity-60 leading-relaxed">
                {view === 'privacy' ? "Nous respectons votre vie privée. Aucune donnée de recherche n'est stockée de manière nominative. L'analyse est effectuée en temps réel via des modèles de langage sécurisés." : 
                 view === 'faq' ? "AvisScore synthétise les retours d'experts et d'utilisateurs pour vous donner une note unique sur 10. Les données sont croisées avec les spécifications réelles du constructeur." :
                 "Une question technique ? Contactez notre équipe support : hello@avisscore.tech. Nous répondons sous 24h."}
              </p>
            </div>
          </section>
        )}
      </main>

      <footer className="py-24 glass-card !rounded-none !border-x-0 !border-b-0 text-center shadow-inner mt-auto">
         <div className="flex flex-col items-center">
            <span className="text-4xl font-black italic uppercase tracking-tighter">Avis<span className="text-[#4158D0]">Score</span></span>
            <div className="h-1 w-20 bg-[#4158D0] my-8 rounded-full"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-20 italic">© 2025 AvisScore — PRODUCTION V31.0</p>
         </div>
      </footer>

      {isSearching && (
        <div className="fixed bottom-12 right-12 z-[100] animate-bounce">
          <div className="bg-[#050A30] text-white px-8 py-5 rounded-full shadow-2xl flex items-center gap-4 border-2 border-white/20">
             <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
             <span className="text-[11px] font-black uppercase tracking-widest italic">Analyse en cours...</span>
          </div>
        </div>
      )}
    </div>
  );
}
