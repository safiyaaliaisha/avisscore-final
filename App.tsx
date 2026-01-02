
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts, fetchLatestCommunityReviews } from './services/productService';
import { getAIReviewSummary } from './services/geminiService';
import { Product, ProductSummary } from './types';
import { ReviewCard } from './components/ReviewCard';
import { LegalPage } from './components/LegalPages';
import { FeaturePage } from './components/FeaturePages';

const StarRating = ({ rating, size = "xs" }: { rating: number; size?: string }) => {
  return (
    <div className={`flex text-amber-500 gap-0.5 text-${size}`}>
      {[...Array(5)].map((_, i) => (
        <i key={i} className={i < Math.floor(rating) ? "fas fa-star" : "far fa-star"}></i>
      ))}
    </div>
  );
};

type ViewState = 'home' | 'detail' | 'privacy' | 'cookies' | 'terms' | 'analyses-ia' | 'comparateur' | 'api-pro' | 'contact';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [query, setQuery] = useState('');
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [communityReviews, setCommunityReviews] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [aiSummary, setAiSummary] = useState<ProductSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prods, revs] = await Promise.all([
        fetchHomeProducts(4),
        fetchLatestCommunityReviews(3)
      ]);
      setPopularProducts(Array.isArray(prods) ? prods : []);
      setCommunityReviews(Array.isArray(revs) ? revs : []);
    } catch (e) {
      console.error(e);
      setError("Erreur de chargement");
      setPopularProducts([]);
      setCommunityReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (target: string, isId: boolean = false) => {
    if (!target.trim()) return;
    setIsLoading(true);
    setError(null);
    setAiSummary(null);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const { data } = await fetchFullProductData(target, isId ? 'id' : 'name');
      if (data) {
        setSelectedProduct(data);
        if (data.reviews && data.reviews.length > 0) {
          const summary = await getAIReviewSummary(data.name, data.reviews);
          if (summary) setAiSummary(summary);
        }
      } else {
        setSelectedProduct(null);
      }
    } catch (e) {
      console.error(e);
      setError("Produit introuvable");
      setSelectedProduct(null);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateTo = (newView: ViewState) => {
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getAvatarColor = (name: string) => {
    const colors = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-indigo-100 text-indigo-600', 'bg-rose-100 text-rose-600', 'bg-amber-100 text-amber-600'];
    const index = (name || "User").length % colors.length;
    return colors[index];
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "À l'instant";
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    return `Il y a ${Math.floor(diffInHours / 24)}j`;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <nav className="bg-[#0F172A] h-20 flex items-center sticky top-0 z-50 shadow-2xl shadow-slate-900/10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setView('home'); setQuery(''); setSelectedProduct(null); setAiSummary(null); setError(null); }}
          >
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <i className="fas fa-check-double text-white text-lg"></i>
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-[#0F172A] rounded-full"></div>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-white font-black text-2xl tracking-tighter">
                Avis<span className="text-blue-400 italic">score</span>
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Neural Analytics</span>
            </div>
          </div>
          
          <div className="hidden md:flex gap-10 text-slate-400 text-[11px] font-black uppercase tracking-widest items-center">
            <span onClick={() => navigateTo('home')} className="hover:text-white cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-blue-500">Accueil</span>
            <span onClick={() => navigateTo('comparateur')} className="hover:text-white cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-blue-500">Comparateur</span>
            <span onClick={() => navigateTo('analyses-ia')} className="hover:text-white cursor-pointer transition-colors pb-1 border-b-2 border-transparent hover:border-blue-500">Analyses IA</span>
            <span onClick={() => navigateTo('api-pro')} className="bg-blue-600 text-white px-5 py-2 rounded-full hover:bg-blue-500 transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95">API Pro</span>
          </div>
        </div>
      </nav>

      <div className="flex-1">
        {view === 'home' && (
          <main className="animate-in fade-in duration-500">
            {/* HERO SECTION */}
            <div className="bg-[#0F172A] py-24 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent)]"></div>
              <div className="max-w-5xl mx-auto px-6 relative z-10">
                <h2 className="text-white text-4xl md:text-5xl font-black mb-4 text-center tracking-tight">Le verdict expert auto & tech.</h2>
                <p className="text-slate-400 text-center mb-12 font-medium text-lg max-w-2xl mx-auto italic">Analyse immédiate de milliers de sources pour vous donner le score réel de chaque produit.</p>
                
                <div className="bg-[#1E293B]/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-700/50 shadow-[0_25px_60_rgba(0,0,0,0.4)] max-w-3xl mx-auto">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="relative flex gap-3">
                    <div className="relative flex-1">
                      <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un iPhone, une PS5, ou une tablette..."
                        className="w-full bg-white h-16 pl-14 pr-4 rounded-2xl text-slate-900 font-bold placeholder:text-slate-400 outline-none shadow-inner text-lg focus:ring-4 focus:ring-blue-600/20 transition-all"
                      />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-8 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                      Analyser
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* POPULAR PRODUCTS */}
            <section className="max-w-7xl mx-auto px-6 py-20">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <span className="w-2 h-10 bg-blue-600 rounded-full"></span>
                  Produits Populaires
                </h2>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {isLoading ? (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-3xl p-8 border border-slate-100 animate-pulse h-72 shadow-lg"></div>
                  ))
                ) : (
                  popularProducts.map((p) => {
                    // Logic strictly as requested: Base URL + Category + / + Slug
                    const category = p.category || 'Tech';
                    const slug = p.product_slug || '';
                    const productUrl = slug ? `https://avisscore.com/${category}/${slug}` : null;
                    
                    return (
                      <div 
                        key={p.id} 
                        className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden" 
                      >
                        <div className="absolute inset-0 z-0" onClick={() => handleSearch(p.id, true)}></div>
                        
                        <div className="h-40 w-full flex items-center justify-center mb-6 overflow-hidden relative z-10 pointer-events-none">
                          <img src={p.image_url || ''} alt={String(p.name)} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div className="w-full text-left relative z-10 pointer-events-none">
                          <h3 className="font-black text-slate-900 text-sm mb-2 truncate group-hover:text-blue-600 transition-colors">{String(p.name)}</h3>
                          <div className="flex items-center justify-between mb-4">
                            <StarRating rating={p.rating || p.score || 4} size="xs" />
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Voir l'analyse</span>
                          </div>
                        </div>

                        {productUrl && (
                          <a 
                            href={productUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-auto w-full bg-[#0F172A] hover:bg-blue-600 text-white py-3 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all duration-300 relative z-20 flex items-center justify-center gap-2 border border-slate-100 shadow-lg active:scale-95"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Consulter l'offre
                            <i className="fas fa-external-link-alt text-[8px] opacity-70"></i>
                          </a>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* RECENT REVIEWS SECTION */}
            <section className="max-w-7xl mx-auto px-6 py-20 bg-slate-50/50 rounded-[3rem] border border-slate-100/50">
              <div className="flex items-center justify-between mb-12">
                <div className="space-y-1">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight">Avis Récents</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Dernières interactions de la communauté</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-8 border border-slate-100 animate-pulse h-48"></div>
                  ))
                ) : (
                  communityReviews.length > 0 ? (
                    communityReviews.map((rev) => {
                      const productSlug = rev.products?.product_slug;
                      const productCategory = rev.products?.category || 'Tech';
                      const productUrl = productSlug ? `https://avisscore.com/${productCategory}/${productSlug}` : null;

                      return (
                        <div 
                          key={rev.id} 
                          className="bg-white rounded-2xl p-6 border border-slate-100 shadow-xl shadow-slate-200/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group flex flex-col h-full"
                          onClick={() => handleSearch(rev.products?.name || '', false)}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(rev.author_name)}`}>
                              {String(rev.author_name || "A").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm leading-tight">{rev.author_name || "Anonyme"}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                                {formatTimeAgo(rev.created_at)}
                              </p>
                            </div>
                          </div>

                          <h5 className="font-black text-slate-900 text-base mb-2 truncate group-hover:text-blue-600 transition-colors">
                            {rev.products?.name || "Produit Tech"}
                          </h5>

                          <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3 font-medium italic flex-1">
                            "{rev.review_text}"
                          </p>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50 mt-4">
                            <div className="flex items-center gap-2">
                              <StarRating rating={rev.rating} />
                              <span className="text-slate-900 font-black text-[11px]">{rev.rating}.0</span>
                            </div>
                            {productUrl && (
                              <a 
                                href={productUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Offre <i className="fas fa-external-link-alt text-[7px]"></i>
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">
                      Aucun avis récent pour le moment.
                    </div>
                  )
                )}
              </div>
            </section>
          </main>
        )}

        {view === 'detail' && (
          <main className="max-w-7xl mx-auto px-6 py-12 animate-in slide-in-from-bottom-6 duration-700">
            {!selectedProduct ? (
              <div className="text-center py-48 bg-white rounded-[3rem] border border-slate-100 shadow-2xl">
                {isLoading ? (
                   <div className="flex flex-col items-center gap-8">
                      <div className="w-20 h-20 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-xl"></div>
                      <div className="space-y-2">
                        <p className="text-slate-900 font-black text-2xl tracking-tighter uppercase">Analyse en cours...</p>
                        <p className="text-slate-400 font-bold tracking-widest text-xs uppercase">Extraction des Consensus</p>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 className="text-4xl font-black mb-6 text-slate-900">Produit introuvable</h2>
                    <button onClick={() => setView('home')} className="bg-[#0F172A] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Retour</button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                <ReviewCard 
                  product={selectedProduct} 
                  summary={aiSummary}
                  relatedProducts={popularProducts.filter(p => p.id !== (selectedProduct?.id)).slice(0, 3)}
                />
                <div className="flex justify-center pb-24">
                  <button onClick={() => setView('home')} className="bg-white border border-slate-200 text-slate-400 font-black uppercase tracking-[0.4em] text-[10px] px-12 py-5 rounded-[2rem] hover:text-blue-600 hover:border-blue-600 shadow-lg hover:shadow-2xl transition-all flex items-center gap-5">
                    <i className="fas fa-arrow-left"></i> Retour au Catalogue
                  </button>
                </div>
              </div>
            )}
          </main>
        )}

        {(view === 'privacy' || view === 'cookies' || view === 'terms') && (
          <main className="max-w-4xl mx-auto px-6 py-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
             <LegalPage type={view} onBack={() => setView('home')} />
          </main>
        )}

        {(view === 'analyses-ia' || view === 'comparateur' || view === 'api-pro') && (
          <main className="max-w-6xl mx-auto px-6 py-20 animate-in fade-in duration-700">
            <FeaturePage type={view} onBack={() => setView('home')} />
          </main>
        )}

        {view === 'contact' && (
          <main className="max-w-4xl mx-auto px-6 py-24 animate-in fade-in duration-700">
            <div className="bg-white rounded-[3rem] p-16 shadow-2xl shadow-slate-200/60 border border-slate-100 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl mx-auto mb-10 shadow-xl shadow-blue-500/20">
                <i className="fas fa-envelope"></i>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-6">Contactez-nous</h1>
              <p className="text-slate-500 text-lg font-medium max-w-lg mx-auto mb-12 italic">
                Une question sur nos analyses ou un partenariat ? Notre équipe est à votre écoute.
              </p>
              
              <div className="bg-slate-50 rounded-3xl p-10 border border-slate-100 inline-block group hover:bg-white hover:shadow-2xl transition-all duration-500 cursor-pointer">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Email direct</span>
                <a href="mailto:contact@avisscore.fr" className="text-3xl font-black text-blue-600 tracking-tight hover:underline">
                  contact@avisscore.fr
                </a>
              </div>

              <div className="mt-16 pt-10 border-t border-slate-100 flex justify-center">
                <button 
                  onClick={() => setView('home')}
                  className="bg-[#0F172A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-4 group shadow-xl active:scale-95"
                >
                  <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                  Retour à l'accueil
                </button>
              </div>
            </div>
          </main>
        )}
      </div>

      <footer className="bg-white border-t border-slate-200 py-24 shrink-0">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
            © 2025 Avisscore Lab. Intelligence Critique Certifiée 100% en Français.
          </p>
        </div>
      </footer>
    </div>
  );
}
