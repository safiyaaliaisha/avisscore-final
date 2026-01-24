import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts, fetchLatestCommunityReviews, fetchDeals } from './services/productService';
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

const getMerchantLogo = (source: string) => {
  const s = source.toLowerCase();
  if (s.includes('fnac')) return { color: 'bg-[#F29100]', icon: 'F', name: 'Fnac' };
  if (s.includes('darty')) return { color: 'bg-[#E30613]', icon: 'D', name: 'Darty' };
  if (s.includes('boulanger')) return { color: 'bg-[#F06C00]', icon: 'B', name: 'Boulanger' };
  if (s.includes('rakuten')) return { color: 'bg-[#BF0000]', icon: 'R', name: 'Rakuten' };
  if (s.includes('amazon')) return { color: 'bg-[#232F3E]', icon: 'A', name: 'Amazon' };
  return { color: 'bg-slate-400', icon: 'W', name: 'Web' };
};

type ViewState = 'home' | 'detail' | 'privacy' | 'cookies' | 'terms' | 'analyses-ia' | 'comparateur' | 'api-pro' | 'contact' | 'not-found';

export default function App() {
  const location = useLocation();
  const [view, setView] = useState<ViewState>('home');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [liveDeals, setLiveDeals] = useState<Deal[]>([]);
  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [aiSummary, setAiSummary] = useState<ProductSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHomeLoading, setIsHomeLoading] = useState(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(4);
  const [showAllActive, setShowAllActive] = useState(false);
  
  const heroSearchRef = useRef<HTMLDivElement>(null);

  const loadHomeData = useCallback(async () => {
    setIsHomeLoading(true);
    try {
      const [prods, revs, deals] = await Promise.all([
        fetchHomeProducts(100),
        fetchLatestCommunityReviews(4),
        fetchDeals(8)
      ]);
      setPopularProducts(Array.isArray(prods) ? prods : []);
      setCommunityReviews(Array.isArray(revs) ? revs : []);
      setLiveDeals(Array.isArray(deals) ? deals : []);
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
    return filteredProducts.slice(0, showAllActive ? visibleCount : 4);
  }, [filteredProducts, visibleCount, showAllActive]);

  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 8);
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (heroSearchRef.current && !heroSearchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

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

  const handleProductSelection = useCallback(async (target: string, type: 'id' | 'slug' | 'name' = 'name', category?: string) => {
    if (!target) return;
    setIsLoading(true);
    setAiSummary(null);
    setSelectedProduct(null);
    setView('detail');
    setShowResults(false);
    
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
    if (newView === 'home') {
      setSelectedCategory(null);
      setVisibleCount(4);
      setShowAllActive(false);
      setQuery('');
      setSearchResults([]);
      setShowResults(false);
      setSelectedProduct(null);
      setAiSummary(null);
      setView('home');
      window.location.hash = '#/';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const hash = `#/${newView}`;
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
    if (view === 'home') {
      loadHomeData();
    }
  }, [view, loadHomeData, location.key]);

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return "RÉCEMMENT";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "RÉCEMMENT";
    const diff = Math.floor((new Date().getTime() - d.getTime()) / (1000 * 60 * 60));
    return diff < 1 ? "RÉCEMMENT" : diff < 24 ? `IL Y A ${diff}H` : `IL Y A ${Math.floor(diff/24)}J`;
  };

  const getDiscountBadgeColor = (discount: number) => {
    if (discount >= 70) return 'bg-purple-600 shadow-purple-500/50 text-white';
    if (discount >= 60) return 'bg-red-600 shadow-red-500/50 text-white';
    if (discount >= 50) return 'bg-orange-600 shadow-orange-500/50 text-white';
    if (discount >= 40) return 'bg-green-500 shadow-green-500/50 text-white';
    return 'bg-blue-600 shadow-blue-500/50 text-white';
  };

  const handleHeroKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(p => p < searchResults.length - 1 ? p + 1 : p);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(p => p > 0 ? p - 1 : p);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        const p = searchResults[selectedIndex];
        navigateTo(`${p.category}/${p.product_slug}`);
      } else if (searchResults.length > 0) {
        const p = searchResults[0];
        navigateTo(`${p.category}/${p.product_slug}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col font-sans text-slate-900">
      <Helmet>
        <title>{view === 'home' ? 'Avisscore - Le verdict expert auto & tech' : (selectedProduct ? `${selectedProduct.name} - Avisscore` : 'Avisscore')}</title>
      </Helmet>
      <Navbar onNavigate={navigateTo} activeView={view} />

      <div className="flex-1">
        {view === 'home' && (
          <main className="animate-in fade-in duration-700">
            <div className="bg-[#0F172A] py-32 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#3b82f6 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
              <div className="max-w-4xl mx-auto px-6 relative z-10">
                <h1 className="text-white text-5xl md:text-7xl font-black mb-6 tracking-tight leading-tight">Le verdict expert<br/>auto & tech.</h1>
                <p className="text-slate-400 mb-10 font-medium text-lg max-w-2xl mx-auto italic">Analyse immédiate de milliers de sources pour vous donner le score réel de chaque produit.</p>
                
                <div className="relative max-w-2xl mx-auto mb-12" ref={heroSearchRef}>
                  <div className="bg-slate-800/30 p-2 rounded-2xl backdrop-blur-md border border-white/5 shadow-2xl">
                    <form onSubmit={(e) => { 
                      e.preventDefault(); 
                      if (searchResults.length > 0) {
                        const p = searchResults[0];
                        navigateTo(`${p.category}/${p.product_slug}`);
                      }
                    }} className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                        <input
                          type="text"
                          value={query}
                          onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                          onFocus={() => setShowResults(true)}
                          onKeyDown={handleHeroKeyDown}
                          placeholder="Rechercher un iPhone, une PS5, ou une tablette..."
                          className="w-full h-14 pl-14 pr-6 rounded-xl font-bold outline-none bg-white text-slate-900 border-2 border-transparent focus:border-blue-500 transition-all"
                        />
                      </div>
                      <button type="submit" className="bg-blue-600 text-white h-14 px-8 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-blue-500 active:scale-95 transition-all shrink-0">ANALYSER</button>
                    </form>
                  </div>

                  {showResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden z-30 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                      {searchResults.map((p, idx) => (
                        <div 
                          key={p.id} 
                          onClick={() => navigateTo(`${p.category}/${p.product_slug}`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`flex items-center gap-5 p-4 cursor-pointer transition-all ${idx === selectedIndex ? 'bg-blue-50 border-l-4 border-blue-600 pl-6' : 'hover:bg-slate-50'}`}
                        >
                          <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center border border-slate-100 shrink-0">
                            <img src={p.image_url} alt={p.name} className="max-w-full max-h-full object-contain" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-black text-slate-900 text-sm leading-tight">{p.name}</h4>
                            <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">{p.category}</p>
                          </div>
                          <i className="fas fa-arrow-right text-slate-300 text-xs"></i>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap justify-center gap-3 animate-in fade-in duration-1000 delay-500">
                  {["Tout", ...dynamicCategories].map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => cat === "Tout" ? setSelectedCategory(null) : setSelectedCategory(prev => prev === cat ? null : cat)}
                      className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-sm border ${
                        (cat === "Tout" && selectedCategory === null) || (selectedCategory === cat)
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30" 
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-white/70 hover:text-white"
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
                <h2 className="text-4xl font-black text-[#111] tracking-tighter flex items-center gap-4">
                  <span className="w-2.5 h-10 bg-blue-600 rounded-full"></span>
                  {selectedCategory ? `Produits : ${selectedCategory}` : "Produits Populaires"}
                </h2>
                <button 
                  onClick={() => setShowAllActive(!showAllActive)}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 hover:text-blue-700 transition-all flex items-center gap-2 group"
                >
                  {showAllActive ? "RETOUR" : "VOIR TOUT"}
                  <i className={`fas ${showAllActive ? 'fa-chevron-up' : 'fa-arrow-right-long'} group-hover:translate-x-1 transition-transform`}></i>
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {isHomeLoading && popularProducts.length === 0 ? (
                  [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 animate-pulse h-80 shadow-sm"></div>)
                ) : displayedProducts.length > 0 ? (
                  displayedProducts.map((p) => {
                    const curPrice = Number(p.current_price) || 0;
                    const refPrice = Number(p.reference_price) || 0;
                    const discount = (curPrice > 0 && refPrice > 0) ? Math.round(((refPrice - curPrice) / refPrice) * 100) : 0;
                    const hasPriceError = discount >= 50 && curPrice > 0;
                    
                    return (
                      <div 
                        key={p.id} 
                        className={`bg-white p-8 rounded-[2.5rem] border ${hasPriceError ? 'border-red-500/30 ring-2 ring-red-500/10' : 'border-slate-200'} shadow-sm hover:shadow-md transition-all flex flex-col items-center group relative overflow-hidden animate-in fade-in`}
                      >
                        {hasPriceError && (
                          <div className="absolute top-4 left-4 z-20 bg-red-600 text-white px-3 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/30 flex items-center gap-1.5 animate-bounce">
                            <i className="fas fa-fire"></i>
                            -{discount}%
                          </div>
                        )}

                        <div 
                          onClick={() => navigateTo(`${p.category}/${p.product_slug}`)}
                          className="w-full flex flex-col items-center cursor-pointer group/link"
                        >
                          <div className="h-44 w-full flex items-center justify-center mb-8 overflow-hidden bg-slate-50 rounded-2xl">
                            {p.image_url ? (
                              <img src={p.image_url} alt={p.name} className="max-h-[80%] max-w-[80%] object-contain group-hover/link:scale-110 transition-transform duration-500 drop-shadow-md" />
                            ) : (
                              <i className="fas fa-image text-slate-200 text-4xl"></i>
                            )}
                          </div>
                          <h3 className="font-black text-sm text-slate-900 text-center group-hover/link:text-blue-600 mb-3 transition-colors line-clamp-2 px-2 h-10">{p.name}</h3>
                        </div>
                        
                        <div className="mt-auto w-full flex flex-col items-center gap-4">
                          {hasPriceError ? (
                            <div className="flex flex-col items-center gap-1 w-full">
                              <div className="flex items-center gap-2">
                                <span className="text-red-600 font-black text-xl">{curPrice.toFixed(2)}€</span>
                                {refPrice > 0 && <span className="text-slate-400 text-xs line-through font-bold">{refPrice.toFixed(2)}€</span>}
                              </div>
                              <p className="text-[9px] text-red-400 font-bold italic mb-1 text-center animate-pulse">
                                ⏳ Dépêchez-vous ! Offre à durée limitée
                              </p>
                              {p.affiliate_link ? (
                                <a 
                                  href={p.affiliate_link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full bg-red-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest text-center shadow-lg hover:bg-red-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                                >
                                  VOIR L'OFFRE ⚡
                                </a>
                              ) : (
                                <button className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest cursor-not-allowed">STOCK ÉPUISÉ</button>
                              )}
                            </div>
                          ) : (
                            <div className="w-full flex flex-col items-center gap-4">
                              <StarRating rating={p.score ? p.score / 2 : (p.rating || 4)} />
                              <button 
                                onClick={() => navigateTo(`${p.category}/${p.product_slug}`)}
                                className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:bg-blue-500"
                              >
                                VOIR L'ANALYSE
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <p className="text-slate-400 font-bold italic">Aucun produit trouvé dans cette catégorie.</p>
                    <button 
                      onClick={() => setSelectedCategory(null)}
                      className="mt-4 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:underline"
                    >
                      Effacer les filtres
                    </button>
                  </div>
                )}
              </div>

              {showAllActive && displayedProducts.length < filteredProducts.length && (
                <div className="flex justify-center mt-16">
                  <button 
                    onClick={handleLoadMore}
                    className="bg-white border-2 border-slate-200 text-slate-900 font-black px-12 py-4 rounded-2xl text-xs uppercase tracking-[0.3em] hover:border-blue-600 hover:text-blue-600 transition-all shadow-xl active:scale-95 flex items-center gap-4"
                  >
                    CHARGER PLUS
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
              )}
            </section>

            {/* LIVE DEALS SECTION */}
            <section className="max-w-7xl mx-auto px-6 py-20">
               <div className="flex items-center justify-between mb-12">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-4xl font-black text-[#111] tracking-tighter flex items-center gap-4">
                      <span className="w-2.5 h-10 bg-rose-600 rounded-full"></span>
                      Bons Plans en Direct
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">LES MEILLEURES OFFRES DU MOMENT ANALYSÉES</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {isHomeLoading && liveDeals.length === 0 ? (
                    [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2rem] p-8 h-80 animate-pulse border border-slate-100 shadow-sm"></div>)
                  ) : liveDeals.map((deal) => (
                    <div key={deal.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col items-center group relative overflow-hidden">
                       <div className={`absolute top-4 left-4 z-20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-1.5 ${getDiscountBadgeColor(deal.discount)}`}>
                         <i className="fas fa-tag"></i>
                         -{deal.discount}%
                       </div>

                       <div className="h-44 w-full flex items-center justify-center mb-6 overflow-hidden bg-slate-50 rounded-2xl relative">
                          <img src={deal.image_url} alt={deal.title} className="max-h-[80%] max-w-[80%] object-contain group-hover:scale-110 transition-transform duration-700" />
                       </div>

                       <h3 className="font-black text-xs text-slate-900 text-center mb-4 line-clamp-2 px-2 h-8">{deal.title}</h3>

                       <div className="mt-auto w-full flex flex-col items-center gap-4">
                          <div className="flex items-center gap-3">
                             <span className="text-rose-600 font-black text-xl">{deal.current_price?.toFixed(2)}€</span>
                             <span className="text-slate-400 text-xs line-through font-bold">{deal.reference_price?.toFixed(2)}€</span>
                          </div>

                          <a 
                            href={deal.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] text-center shadow-lg hover:bg-rose-600 transition-all flex items-center justify-center gap-2 group/btn"
                          >
                            VOIR L'OFFRE
                            <i className="fas fa-external-link-alt text-[10px] group-hover/btn:translate-x-1 transition-transform"></i>
                          </a>
                       </div>
                    </div>
                  ))}
               </div>
            </section>

            <section className="bg-slate-100/30 pt-20 pb-32 border-y border-slate-200">
              <div className="max-w-7xl mx-auto px-6">
                <div className="mb-16 text-center md:text-left">
                  <h2 className="text-5xl font-black text-[#111] tracking-tighter mb-4">Avis Récents</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">BASÉ SUR LES DERNIERS RÉSUMÉS WEB</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {isHomeLoading && communityReviews.length === 0 ? (
                    [...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-[2.5rem] p-8 h-72 animate-pulse shadow-sm"></div>)
                  ) : (
                    communityReviews.map((rev) => {
                      const merchant = getMerchantLogo(rev.source || 'Web');
                      const cleanText = (rev.review_text || "").replace(/[""«»]/g, '').trim();
                      return (
                        <div 
                          key={rev.id} 
                          onClick={() => navigateTo(`${rev.products?.category}/${rev.products?.product_slug}`)} 
                          className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group h-full flex flex-col"
                        >
                          <div className="flex items-center gap-4 mb-6">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-xs uppercase shadow-sm ${merchant.color}`}>
                              {merchant.icon}
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">Résumé Web</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">{formatTimeAgo(rev.created_at)} • Source: {merchant.name}</p>
                            </div>
                          </div>
                          <h4 className="font-black text-sm text-slate-900 mb-4 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{rev.products?.name}</h4>
                          <p className="text-slate-500 text-xs italic mb-6 line-clamp-4 leading-relaxed flex-1">{cleanText}</p>
                          <div className="pt-5 border-t border-slate-50 flex items-center justify-between">
                            <StarRating rating={rev.rating} />
                            <span className="text-[11px] font-black text-slate-900">{rev.rating}/5</span>
                          </div>
                        </div>
                      );
                    })
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

      <footer className="bg-white border-t border-slate-200 pt-24 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16 text-center md:text-left">
            <div className="space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-3 cursor-pointer group" onClick={() => navigateTo('home')}>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <i className="fas fa-check-double text-white text-xs"></i>
                </div>
                <span className="text-slate-900 font-black text-xl tracking-tighter">Avis<span className="text-blue-600 italic">score</span></span>
              </div>
              <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs mx-auto md:mx-0">Le hub ultime pour l'analyse neurale de produits high-tech et automobile.</p>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-2">Plateforme</h4>
              <span onClick={() => navigateTo('comparateur')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Comparateur</span>
              <span onClick={() => navigateTo('analyses-ia')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Analyses IA</span>
              <span onClick={() => navigateTo('api-pro')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">API Pro</span>
            </div>
            <div className="flex flex-col gap-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900 mb-2">Légal & Contact</h4>
              <span onClick={() => navigateTo('contact')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Contact</span>
              <span onClick={() => navigateTo('privacy')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Confidentialité</span>
              <span onClick={() => navigateTo('cookies')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Cookies</span>
              <span onClick={() => navigateTo('terms')} className="text-slate-400 hover:text-blue-600 cursor-pointer text-xs font-bold uppercase tracking-widest transition-colors">Mentions Légales</span>
            </div>
          </div>
          <div className="pt-12 border-t border-slate-50 text-center">
            <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em]">© 2025 Avisscore Lab. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
      <CookieConsent />
    </div>
  );
}
