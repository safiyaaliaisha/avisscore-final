
import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts, fetchRecentReviews } from './services/productService';
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

type ViewState = 'home' | 'detail' | 'privacy' | 'cookies' | 'terms' | 'analyses-ia' | 'comparateur' | 'api-pro';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [query, setQuery] = useState('');
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [recentReviews, setRecentReviews] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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
        fetchHomeProducts(6),
        fetchRecentReviews(3)
      ]);
      setPopularProducts(Array.isArray(prods) ? prods : []);
      setRecentReviews(Array.isArray(revs) ? revs : []);
    } catch (e) {
      console.error(e);
      setError("Erreur de chargement");
      setPopularProducts([]);
      setRecentReviews([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (target: string, isId: boolean = false) => {
    if (!target.trim()) return;
    setIsLoading(true);
    setError(null);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const { data, error } = await fetchFullProductData(target, isId);
      if (data) {
        setSelectedProduct(data);
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
    const index = name.length % colors.length;
    return colors[index];
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <nav className="bg-[#0F172A] h-20 flex items-center sticky top-0 z-50 shadow-2xl shadow-slate-900/10 shrink-0">
        <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => { setView('home'); setQuery(''); setSelectedProduct(null); setError(null); }}
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
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-0.5">Expert Analytics</span>
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
            <div className="bg-[#0F172A] py-24 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.1),transparent)]"></div>
              <div className="max-w-5xl mx-auto px-6 relative z-10">
                <h2 className="text-white text-4xl md:text-5xl font-black mb-4 text-center tracking-tight">Le verdict tech en un clic.</h2>
                <p className="text-slate-400 text-center mb-12 font-medium text-lg max-w-2xl mx-auto italic">Analyse de milliers d'avis pour vous donner le score réel de chaque produit.</p>
                
                <div className="bg-[#1E293B]/80 backdrop-blur-xl p-5 rounded-3xl border border-slate-700/50 shadow-[0_25px_60px_rgba(0,0,0,0.4)] max-w-3xl mx-auto">
                  <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} className="relative flex gap-3">
                    <div className="relative flex-1">
                      <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
                      <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Rechercher un iPhone, une PS5, ou une marque..."
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

            <section className="max-w-7xl mx-auto px-6 py-24">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                  <span className="w-2 h-10 bg-blue-600 rounded-full"></span>
                  Produits Populaires
                </h2>
                <button className="text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Voir tout</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 animate-pulse h-96 shadow-lg"></div>
                  ))
                ) : (
                  Array.isArray(popularProducts) && popularProducts.length > 0 ? (
                    popularProducts.map((p) => (
                      <div 
                        key={p.id} 
                        className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] hover:-translate-y-3 transition-all duration-700 cursor-pointer group flex flex-col items-center text-center relative overflow-hidden" 
                        onClick={() => handleSearch(p.id, true)}
                      >
                        <div className="h-48 w-full flex items-center justify-center mb-8 overflow-hidden">
                          <img src={p.image_url || ''} alt={String(p.name)} className="max-h-full object-contain group-hover:scale-110 transition-transform duration-700 drop-shadow-2xl" />
                        </div>
                        <div className="w-full text-left">
                          <h3 className="font-black text-slate-900 text-lg mb-3 truncate group-hover:text-blue-600 transition-colors leading-tight">{String(p.name)}</h3>
                          <div className="flex items-center justify-between">
                            <StarRating rating={p.rating || p.score || p.analysis?.score || 0} size="xs" />
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                               PRODUIT VÉRIFIÉ
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Aucun produit pour le moment.</p>
                      <button onClick={loadHomeData} className="text-blue-600 text-xs font-black uppercase tracking-widest underline">Réessayer</button>
                    </div>
                  )
                )}
              </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 pb-24">
              <div className="flex items-center justify-between mb-12">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  Avis Récents
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {isLoading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse h-48 shadow-sm"></div>
                  ))
                ) : (
                  Array.isArray(recentReviews) && recentReviews.length > 0 ? (
                    recentReviews.map((r) => (
                      <div 
                        key={r.id} 
                        className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => handleSearch(r.id, true)}
                      >
                        <div className="flex items-center gap-3 mb-5">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(r.name)}`}>
                            {String(r.name).charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1">Utilisateur Vérifié</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Il y a 3 heures</p>
                          </div>
                        </div>
                        <h4 className="font-black text-slate-900 mb-2 text-sm truncate group-hover:text-blue-600 transition-colors">{String(r.name)}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed mb-4 line-clamp-3 font-medium">
                          "{String(r.review_text)}"
                        </p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={r.rating || 4} />
                          <span className="text-slate-900 font-black text-[11px]">{r.rating || 4}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-10 text-center flex flex-col items-center gap-4">
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Aucun avis récent.</p>
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
                        <p className="text-slate-900 font-black text-2xl tracking-tighter uppercase">Chargement...</p>
                        <p className="text-slate-400 font-bold tracking-widest text-xs">EXTRACTION DES DONNÉES</p>
                      </div>
                   </div>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">
                      <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2 className="text-4xl font-black mb-6 text-slate-900">Produit non trouvé</h2>
                    <button onClick={() => setView('home')} className="bg-[#0F172A] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">Retour au catalogue</button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                <ReviewCard 
                  product={selectedProduct} 
                  isAnalyzing={false}
                  relatedProducts={Array.isArray(popularProducts) ? popularProducts.filter(p => p.id !== (selectedProduct?.id)).slice(0, 3) : []}
                  recentReviews={recentReviews}
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
      </div>

      <footer className="bg-white border-t border-slate-200 py-24 shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:col-grid-4 gap-16 mb-20 md:grid-cols-4">
            <div className="col-span-1 md:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0F172A] rounded-xl flex items-center justify-center shadow-xl">
                  <i className="fas fa-check-double text-blue-500"></i>
                </div>
                <span className="text-[#0F172A] font-black text-2xl tracking-tighter">
                  Avis<span className="text-blue-600 italic">score</span>
                </span>
              </div>
              <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-sm">
                La première plateforme d'analyse automatisée pour l'électronique de pointe. Ne croyez pas tout ce que vous lisez, croyez aux données réelles.
              </p>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-[#0F172A] font-black uppercase tracking-widest text-xs">Produit</h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li onClick={() => navigateTo('analyses-ia')} className="hover:text-blue-600 cursor-pointer transition-colors">Analyses IA</li>
                <li onClick={() => navigateTo('comparateur')} className="hover:text-blue-600 cursor-pointer transition-colors">Comparateur</li>
                <li onClick={() => navigateTo('api-pro')} className="hover:text-blue-600 cursor-pointer transition-colors">API pour Pro</li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="text-[#0F172A] font-black uppercase tracking-widest text-xs">Légal</h4>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                <li onClick={() => navigateTo('privacy')} className="hover:text-blue-600 cursor-pointer transition-colors">Confidentialité</li>
                <li onClick={() => navigateTo('cookies')} className="hover:text-blue-600 cursor-pointer transition-colors">Cookies</li>
                <li onClick={() => navigateTo('terms')} className="hover:text-blue-600 cursor-pointer transition-colors">Mentions Légales</li>
              </ul>
            </div>
          </div>
          
          <div className="pt-12 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 text-slate-400 text-xs font-bold uppercase tracking-[0.3em]">
            <span>© 2025 Avisscore Lab. Tous droits réservés.</span>
            <div className="flex gap-6 text-xl text-slate-400">
                <i className="fab fa-twitter cursor-pointer hover:text-blue-400 transition-all"></i>
                <i className="fab fa-linkedin cursor-pointer hover:text-blue-700 transition-all"></i>
                <i className="fab fa-instagram cursor-pointer hover:text-rose-500 transition-all"></i>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
