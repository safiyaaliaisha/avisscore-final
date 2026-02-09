
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Sparkles, Quote } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts, fetchLatestCommunityReviews } from './services/productService';
import { getAIReviewSummary } from './services/geminiService';
import { Product, ProductSummary, Deal } from './types';
import { LegalPage } from './components/LegalPages';
import { FeaturePage } from './components/FeaturePages';
import { NotFound } from './components/NotFound';
import { CookieConsent } from './components/CookieConsent';
import { Navbar } from './components/Navbar';
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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [aiSummary, setAiSummary] = useState<ProductSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  
  const heroSearchRef = useRef<HTMLDivElement>(null);

  const loadHomeData = useCallback(async () => {
    setIsHomeLoading(true);
    try {
      const [prods, revs] = await Promise.all([
        fetchHomeProducts(100),
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

  const dynamicCategories = useMemo(() => {
    const cats = popularProducts
      .map(p => p.category)
      .filter((cat): cat is string => !!cat && cat.trim() !== '');
    return Array.from(new Set(cats)).sort();
  }, [popularProducts]);

  const filteredProducts = useMemo(() => {
    let list = popularProducts;
    if (selectedCategory) {
      list = list.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    return list;
  }, [popularProducts, selectedCategory]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, showAllActive ? 100 : 4);
  }, [filteredProducts, showAllActive]);

  useEffect(() => {
    const performSearch = async () => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }
      const { data } = await supabase
        .from('products')
        .select('id, name, image_url, product_slug, category')
        .ilike('name', `%${query}%`)
        .limit(5);
      if (data) setSearchResults(data);
    };
    const t = setTimeout(performSearch, 300);
    return () => clearTimeout(t);
  }, [query]);

  const handleProductSelection = useCallback(async (target: string, type: 'id' | 'slug' | 'name' = 'slug', category?: string) => {
    if (!target || target === 'null' || target === 'undefined') return;
    
    setIsLoading(true);
    setAiSummary(null);
    setSelectedProduct(null);
    setView('detail');
    setShowResults(false);
    
    try {
      const { data, error } = await fetchFullProductData(target, type, category);
      if (data) {
        setSelectedProduct(data);
        if (data.review_text || data.reviews_txt || (data.reviews && data.reviews.length > 0)) {
          const summary = await getAIReviewSummary(data);
          if (summary) setAiSummary(summary);
        }
      } else {
        console.warn(`Product not found for: ${target}`);
        setView('not-found');
      }
    } catch (e) {
      console.error("Selection error:", e);
      setView('not-found');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const navigateTo = (newView: string) => {
    if (!newView || newView === 'home') {
      window.location.hash = '#/';
      return;
    }
    const segments = newView.split('/').filter(s => s && s !== 'null' && s !== 'undefined');
    if (segments.length === 0) {
      window.location.hash = '#/';
      return;
    }
    
    const safePath = segments.map(segment => encodeURIComponent(segment)).join('/');
    window.location.hash = `#/${safePath}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash;
      const cleanHash = hash.startsWith('#/') ? hash.slice(2) : hash.startsWith('#') ? hash.slice(1) : hash;
      
      if (!cleanHash || cleanHash === '/' || cleanHash === '') { 
        setView('home'); 
        loadHomeData();
        return; 
      }
      
      const parts = cleanHash.split('/').filter(Boolean).map(s => decodeURIComponent(s));
      const validPages: ViewState[] = ['privacy', 'cookies', 'terms', 'analyses-ia', 'comparateur', 'api-pro', 'contact'];
      
      if (parts.length >= 2) {
        handleProductSelection(parts[1], 'slug', parts[0]);
      } else if (parts.length === 1) {
        if (validPages.includes(parts[0] as ViewState)) {
          setView(parts[0] as ViewState);
        } else {
          handleProductSelection(parts[0], 'slug');
        }
      }
    };
    
    handleRouting();
    window.addEventListener('hashchange', handleRouting);
    return () => window.removeEventListener('hashchange', handleRouting);
  }, [handleProductSelection, loadHomeData]);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "RÉCEMMENT";
    const d = new Date(dateStr);
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60));
    return diff < 1 ? "RÉCEMMENT" : diff < 24 ? `IL Y A ${diff}H` : `IL Y A ${Math.floor(diff/24)}J`;
  };

  const getFirstImage = (img: string | string[]) => {
    return Array.isArray(img) ? img[0] : img;
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-slate-900">
      <Helmet>
        <title>{view === 'home' ? 'AvisScore - Le verdict expert auto & tech' : (selectedProduct ? `${selectedProduct.name} - AvisScore` : 'AvisScore')}</title>
      </Helmet>
      <Navbar onNavigate={navigateTo} activeView={view} />

      <div className="flex-1">
        {view === 'home' && (
          <main className="animate-in fade-in duration-700">
            <div className="bg-[#0F172A] py-32 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              <div className="max-w-4xl mx-auto px-6 relative z-10">
                <h1 className="text-white text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">Le verdict expert<br/>auto & tech.</h1>
                <p className="text-slate-400 mb-10 font-medium text-lg max-w-2xl mx-auto italic">Analyse immédiate de milliers de sources pour vous donner le score réel.</p>
                
                <div className="relative max-w-2xl mx-auto mb-12" ref={heroSearchRef}>
                  <div className="bg-slate-800/30 p-2 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
                    <form onSubmit={(e) => { e.preventDefault(); if (searchResults.length > 0) navigateTo(`${searchResults[0].category}/${searchResults[0].product_slug}`); }} className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                          onFocus={() => setShowResults(true)}
                          placeholder="Rechercher un Smart TV, iPhone, Smartwatch..."
                          className="w-full h-14 pl-14 pr-6 rounded-xl font-bold outline-none bg-white text-slate-900"
                        />
                      </div>
                      <button type="submit" className="bg-blue-600 text-white h-14 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 transition-all">ANALYSER</button>
                    </form>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  {["Tout", ...dynamicCategories].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => cat === "Tout" ? setSelectedCategory(null) : setSelectedCategory(cat)}
                      className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${
                        (cat === "Tout" && selectedCategory === null) || (selectedCategory === cat)
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg" 
                          : "bg-white/5 border-white/10 text-white/70 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <section className="max-w-7xl mx-auto px-6 pt-20 pb-12">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-4xl font-black text-[#111] tracking-tighter">Produits Populaires</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {displayedProducts.map((p) => (
                  <div key={p.id} onClick={() => navigateTo(`${p.category || 'all'}/${p.product_slug}`)} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col items-center group cursor-pointer">
                    <div className="h-44 w-full flex items-center justify-center mb-8 bg-slate-50 rounded-2xl overflow-hidden">
                      <img src={getFirstImage(p.image_url)} alt={p.name} className="max-h-[80%] max-w-[80%] object-contain group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <h3 className="font-black text-sm text-slate-900 text-center mb-3 line-clamp-2 h-10">{p.name}</h3>
                    <div className="mt-auto w-full flex flex-col items-center gap-4">
                      <span className="text-slate-900 font-black text-xl">{p.current_price?.toFixed(2)}€</span>
                      <StarRating rating={p.rating || 4.5} />
                      <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest">VOIR L'ANALYSE</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="bg-slate-100/30 pt-20 pb-32 border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16">
                  <h2 className="text-5xl font-black text-[#111] tracking-tighter mb-4">Avis Récents</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">TÉMOIGNAGES ANALYSÉS DEPUIS LE WEB</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {communityReviews.map((rev) => (
                    <div key={rev.id} onClick={() => navigateTo(`${rev.products?.category || 'all'}/${rev.products?.product_slug}`)} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-200 cursor-pointer hover:shadow-xl transition-all h-full flex flex-col relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5"><Quote size={80} /></div>
                      <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg"><Sparkles size={18} /></div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase">Expert Web</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{formatTimeAgo(rev.created_at)}</p>
                        </div>
                      </div>
                      <h4 className="font-black text-sm text-slate-900 mb-4 line-clamp-2 relative z-10 group-hover:text-blue-600 transition-colors">{rev.products?.name}</h4>
                      <p className="text-slate-500 text-xs italic mb-6 line-clamp-4 leading-relaxed flex-1 relative z-10">{rev.review_text}</p>
                      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                        <StarRating rating={rev.rating} />
                        <span className="text-[11px] font-black text-slate-900">{rev.rating}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </main>
        )}

        {view === 'detail' && (
          <main className="max-w-7xl mx-auto px-6 py-12 min-h-[60vh]">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center py-40 animate-in fade-in">
                  <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                  <p className="font-black text-slate-900 uppercase tracking-widest text-sm">Analyse Neurale en cours...</p>
               </div>
            ) : selectedProduct ? (
              <ProductDetails product={selectedProduct} summary={aiSummary} popularProducts={popularProducts} onBack={() => navigateTo('home')} />
            ) : null}
          </main>
        )}

        {view === 'not-found' && <NotFound onBack={() => navigateTo('home')} />}
        {['privacy', 'cookies', 'terms'].includes(view) && <main className="max-w-4xl mx-auto px-6 py-20"><LegalPage type={view as any} onBack={() => navigateTo('home')} /></main>}
        {['analyses-ia', 'comparateur', 'api-pro', 'contact'].includes(view) && <main className="max-w-6xl mx-auto px-6 py-20"><FeaturePage type={view as any} onBack={() => navigateTo('home')} /></main>}
      </div>

      <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">© 2025 AvisScore Lab. Tous droits réservés.</p>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
