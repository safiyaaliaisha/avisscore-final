import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts, fetchLatestCommunityReviews } from './services/productService';
import { getAIReviewSummary } from './services/geminiService';
import { Product, ProductSummary } from './types';
import { LegalPage } from './components/LegalPages';
import { FeaturePage } from './components/FeaturePages';
import { NotFound } from './components/NotFound';
import { CookieConsent } from './components/CookieConsent';
import ProductDetails from './pages/ProductDetails';

const StarRating = ({ rating, size = "xs" }: { rating: number; size?: string }) => {
  return (
    <div className={`flex text-amber-500 gap-0.5 text-${size}`}>
      {[...Array(5)].map((_, i) => (
        <i key={i} className={i < Math.floor(rating) ? "fas fa-star" : "far fa-star"}></i>
      ))}
    </div>
  );
};

type ViewState = 'home' | 'detail' | 'privacy' | 'cookies' | 'terms' | 'analyses-ia' | 'comparateur' | 'api-pro' | 'contact' | 'not-found';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [query, setQuery] = useState('');
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [aiSummary, setAiSummary] = useState<ProductSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(true);

  const loadHomeData = useCallback(async () => {
    try {
      const [prods, revs] = await Promise.all([
        fetchHomeProducts(4),
        fetchLatestCommunityReviews(4)
      ]);
      setPopularProducts(Array.isArray(prods) ? prods : []);
      setCommunityReviews(Array.isArray(revs) ? revs : []);
    } catch (e) {
      console.error("Home loading error:", e);
    } finally {
      setIsHomeLoading(false);
    }
  }, []);

  const handleProductSelection = useCallback(async (target: string, type: 'id' | 'slug' | 'name' = 'name', category?: string) => {
    if (!target) return;
    setIsLoading(true);
    setAiSummary(null);
    setSelectedProduct(null);
    setView('detail');
    
    try {
      const { data } = await fetchFullProductData(target, type, category);
      if (data) {
        setSelectedProduct(data);
        if (data.reviews && data.reviews.length > 0) {
          const summary = await getAIReviewSummary(data.name, data.reviews);
          if (summary) setAiSummary(summary);
        }
      } else {
        setView('not-found');
      }
    } catch (e) {
      console.error("Selection error:", e);
      setView('not-found');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const navigateTo = (newView: ViewState | string) => {
    const hash = newView === 'home' ? '#/' : `#/${newView}`;
    window.location.hash = hash;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash;
      const cleanHash = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash;
      const parts = cleanHash.split('/').filter(Boolean);
      
      if (parts.length === 0) { 
        setView('home'); 
        return; 
      }
      
      if (parts.length >= 2) {
        handleProductSelection(parts[1], 'slug', parts[0]);
      } else {
        const page = parts[0] as ViewState;
        const validPages: ViewState[] = ['privacy', 'cookies', 'terms', 'analyses-ia', 'comparateur', 'api-pro', 'contact'];
        if (validPages.includes(page)) {
          setView(page);
        } else if (page === 'home') {
          setView('home');
        } else {
          setView('not-found');
        }
      }
    };
    
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    return () => window.removeEventListener('hashchange', handleRouting);
  }, [handleProductSelection]);

  useEffect(() => {
    if (view === 'home') loadHomeData();
  }, [view, loadHomeData]);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "RÉCEMMENT";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "RÉCEMMENT";
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60));
    return diff < 1 ? "RÉCEMMENT" : diff < 24 ? `IL Y A ${diff}H` : `IL Y A ${Math.floor(diff/24)}J`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      <nav className="bg-[#0F172A] h-20 flex items-center sticky top-0 z-50 shrink-0 border-b border-white/5 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <i className="fas fa-check-double text-white"></i>
            </div>
            <span className="text-white font-black text-2xl tracking-tighter">Avis<span className="text-blue-400 italic">score</span></span>
          </div>
          <div className="hidden lg:flex gap-8 text-slate-400 text-[10px] font-black uppercase tracking-widest items-center">
            <span onClick={() => navigateTo('home')} className={`hover:text-white cursor-pointer transition-colors ${view === 'home' ? 'text-white underline underline-offset-8 decoration-blue-500' : ''}`}>ACCUEIL</span>
            <span onClick={() => navigateTo('comparateur')} className={`hover:text-white cursor-pointer transition-colors ${view === 'comparateur' ? 'text-white' : ''}`}>COMPARATEUR</span>
            <span onClick={() => navigateTo('analyses-ia')} className={`hover:text-white cursor-pointer transition-colors ${view === 'analyses-ia' ? 'text-white' : ''}`}>ANALYSES IA</span>
            <span onClick={() => navigateTo('api-pro')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 transition-all">API PRO</span>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {view === 'home' && (
          <main className="animate-in fade-in duration-700">
            <div className="bg-[#0F172A] py-32 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              <div className="max-w-4xl mx-auto px-6 relative z-10">
                <h1 className="text-white text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">Le verdict expert<br/>auto & tech.</h1>
                <p className="text-slate-400 mb-10 font-medium text-lg max-w-2xl mx-auto italic">Analyse immédiate de milliers de sources pour vous donner le score réel de chaque produit.</p>
                <div className="bg-slate-800/30 p-2 rounded-2xl max-w-2xl mx-auto backdrop-blur-md border border-white/5 shadow-2xl">
                  <form onSubmit={(e) => { e.preventDefault(); handleProductSelection(query); }} className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un iPhone, une PS5, ou une tablette..."
                        className="w-full h-14 pl-14 pr-6 rounded-xl font-bold outline-none bg-white text-slate-900 border-2 border-transparent focus:border-blue-500 transition-all"
                      />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white h-14 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 active:scale-95 transition-all">ANALYSER</button>
                  </form>
                </div>
              </div>
            </div>

            <section className="max-w-7xl mx-auto px-6 pt-20 pb-12">
              <h2 className="text-3xl font-black mb-12 flex items-center gap-4">
                <span className="w-2 h-10 bg-blue-600 rounded-full"></span>
                Produits Populaires
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {isHomeLoading && popularProducts.length === 0 ? (
                  [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 animate-pulse h-80 shadow-sm"></div>)
                ) : (
                  popularProducts.map((p) => (
                    <div 
                      key={p.id} 
                      onClick={() => navigateTo(`${p.category}/${p.product_slug}`)} 
                      className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-200/40 cursor-pointer hover:-translate-y-2 hover:shadow-2xl transition-all flex flex-col items-center group"
                    >
                      <div className="h-44 w-full flex items-center justify-center mb-8 overflow-hidden bg-slate-50 rounded-2xl">
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="max-h-[80%] max-w-[80%] object-contain group-hover:scale-110 transition-transform duration-500 drop-shadow-md" />
                        ) : (
                          <i className="fas fa-image text-slate-200 text-4xl"></i>
                        )}
                      </div>
                      <h3 className="font-black text-sm text-slate-900 text-center group-hover:text-blue-600 mb-3 transition-colors line-clamp-2 px-2">{p.name}</h3>
                      <div className="mt-auto"><StarRating rating={p.score ? p.score / 2 : (p.rating || 4)} /></div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="bg-slate-50 pt-20 pb-32 border-y border-slate-100">
              <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 text-center md:text-left">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-3">Avis Récents</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">BASÉ SUR LES DERNIERS RETOURS MARCHANDS</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {isHomeLoading && communityReviews.length === 0 ? (
                    [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2.5rem] p-8 h-72 animate-pulse shadow-sm"></div>)
                  ) : (
                    communityReviews.map((rev) => (
                      <div 
                        key={rev.id} 
                        onClick={() => navigateTo(`${rev.products?.category}/${rev.products?.product_slug}`)} 
                        className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all group h-full flex flex-col"
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs uppercase shadow-sm ${rev.author_name === "Acheteur vérifié" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                            {rev.author_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{rev.author_name}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{formatTimeAgo(rev.created_at)}</p>
                          </div>
                        </div>
                        <h4 className="font-black text-sm text-slate-900 mb-4 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{rev.products?.name}</h4>
                        <p className="text-slate-500 text-xs italic mb-6 line-clamp-4 leading-relaxed flex-1">"{rev.review_text}"</p>
                        <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                          <StarRating rating={rev.rating} />
                          <span className="text-[11px] font-black text-slate-900">{rev.rating}/5</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </main>
        )}

        {view === 'detail' && (
          <main className="max-w-7xl mx-auto px-6 py-12 min-h-[60vh]">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-40 animate-in fade-in duration-500">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                  <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Analyse neurale en cours...</p>
               </div>
            ) : selectedProduct ? (
              <ProductDetails product={selectedProduct} summary={aiSummary} popularProducts={popularProducts} onBack={() => navigateTo('home')} />
            ) : (
              <div className="text-center py-20 text-slate-400 font-bold">Produit en cours de chargement...</div>
            )}
          </main>
        )}

        {view === 'not-found' && <NotFound onBack={() => navigateTo('home')} />}
        {['privacy', 'cookies', 'terms'].includes(view) && <main className="max-w-4xl mx-auto px-6 py-20"><LegalPage type={view as any} onBack={() => navigateTo('home')} /></main>}
        {['analyses-ia', 'comparateur', 'api-pro', 'contact'].includes(view) && <main className="max-w-6xl mx-auto px-6 py-20"><FeaturePage type={view as any} onBack={() => navigateTo('home')} /></main>}
      </div>

      <footer className="bg-white border-t border-slate-200 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">© 2025 Avisscore Lab. Tous droits réservés.</p>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
