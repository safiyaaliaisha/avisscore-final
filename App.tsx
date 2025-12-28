import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabaseClient';
import { fetchFullProductData, fetchHomeProducts } from './services/productService';
import { getAIReviewSummary } from './services/geminiService';
import { Product, ProductSummary, Review } from './types';
import { ReviewCard } from './components/ReviewCard';

const toScore10 = (r: number | null | undefined): string => {
  if (r === null || r === undefined) return "8.5";
  const val = r > 5 ? r / 2 : r;
  return (Math.max(0, Math.min(10, val * 2))).toFixed(1);
};

const normalizeImg = (url: string | null | undefined): string => {
  if (!url || url.trim() === '') return "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80";
  let u = url.trim();
  if (u.includes("ebayimg.com")) {
    const webpIndex = u.toLowerCase().indexOf(".webp");
    if (webpIndex !== -1) return u.slice(0, webpIndex) + ".jpg";
  }
  return u;
};

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-br from-[#3B82F6] to-[#2563EB] rounded-lg shadow-lg rotate-3 transition-transform hover:rotate-0">
      <i className="fas fa-check-double text-white text-lg"></i>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-[#0c1421]"></div>
    </div>
    <div className="flex flex-col leading-none">
      <span className="text-white text-xl font-black tracking-tighter">
        AVIS<span className="text-[#3B82F6]">SCORE</span>
      </span>
      <span className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase">Autorité Tech</span>
    </div>
  </div>
);

const StarRating = ({ rating, size = "xs" }: { rating: number; size?: string }) => {
  return (
    <div className={`flex text-amber-500 gap-0.5 text-${size}`}>
      {[...Array(5)].map((_, i) => (
        <i key={i} className={i < Math.floor(rating / 2) ? "fas fa-star" : "far fa-star"}></i>
      ))}
    </div>
  );
};

const getTechIcon = (key: string) => {
  const k = key.toLowerCase();
  if (k.includes('écran') || k.includes('display') || k.includes('screen')) return 'fa-mobile-screen';
  if (k.includes('processeur') || k.includes('cpu') || k.includes('chip')) return 'fa-microchip';
  if (k.includes('stockage') || k.includes('storage') || k.includes('ssd')) return 'fa-database';
  if (k.includes('mémoire') || k.includes('ram')) return 'fa-memory';
  if (k.includes('batterie') || k.includes('battery') || k.includes('autonomie')) return 'fa-battery-three-quarters';
  if (k.includes('caméra') || k.includes('camera') || k.includes('photo')) return 'fa-camera';
  if (k.includes('poids') || k.includes('weight')) return 'fa-weight-hanging';
  return 'fa-info-circle';
};

export default function App() {
  const [view, setView] = useState<'home' | 'detail'>('home');
  const [query, setQuery] = useState('');
  const [product, setProduct] = useState<Product | null>(null);
  const [aiSummary, setAiSummary] = useState<ProductSummary | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      const prods = await fetchHomeProducts(4);
      setFeaturedProducts(prods || []);
      const { data: reviews } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      setRecentReviews(reviews || []);
    } catch (e) {
      console.error("Erreur chargement données accueil:", e);
    }
  };

  const handleSearch = async (target: string, isId: boolean = false) => {
    if (!target.trim()) return;
    setIsSearching(true);
    setAiSummary(null);
    setView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const { data, error } = await fetchFullProductData(target, isId);
      if (error || !data) {
        setProduct(null);
        setIsSearching(false);
      } else {
        setProduct(data);
        setIsSearching(false);
        if (data.reviews && data.reviews.length > 0) {
          setIsAnalyzing(true);
          try {
            const summary = await getAIReviewSummary(data.name, data.reviews);
            setAiSummary(summary || generateFallbackSummary(data));
          } catch (e) {
            setAiSummary(generateFallbackSummary(data));
          } finally {
            setIsAnalyzing(false);
          }
        } else {
          setAiSummary(generateFallbackSummary(data));
        }
      }
    } catch (e) {
      setIsSearching(false);
    }
  };

  const generateFallbackSummary = (p: Product): ProductSummary => {
    const analysis = p.analysis;
    return {
      rating: analysis?.score || 4.2,
      sentiment: "Excellent",
      review_text: ["Ce produit offre une excellente qualité de fabrication et des performances de haut niveau pour sa catégorie."],
      cycle_de_vie: ["Durabilité: 8.5/10", "Support: 8.0/10", "Batterie: 7.5/10", "Avis: Très Fiable"],
      points_forts: ["Écran Exceptionnel", "Processeur Rapide", "Excellente Caméra"],
      points_faibles: ["Autonomie Moyenne", "Prix Élevé", "Pas de Stockage Extensible"],
      fiche_technique: ["Écran: 6.7\" OLED 120Hz", "Processeur: Apple A17 Pro", "Stockage: 256GB NVMe", "RAM: 8GB LPDDR5X"],
      alternative: "Modèle Similaire",
      image_url: p.image_url || "",
      seo_title: p.name || "Produit",
      seo_description: p.description || ""
    };
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <style>{`
        .container-custom { max-width: 1000px; margin: 0 auto; padding: 0 20px; }
        .top-navbar { background-color: #0c1421; height: 72px; display: flex; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .nav-link { color: #CBD5E1; font-size: 14px; font-weight: 500; transition: color 0.2s; cursor: pointer; }
        .nav-link:hover { color: white; }
        
        .detail-card { background: white; border-radius: 12px; border: 1px solid #E2E8F0; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); height: 100%; }
        .card-header { font-size: 18px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
        
        .progress-bar-bg { background: #E2E8F0; height: 6px; border-radius: 3px; overflow: hidden; width: 100%; }
        .progress-bar-fill { background: #1e3a8a; height: 100%; border-radius: 3px; }
        
        .score-label-box { font-size: 11px; font-weight: 700; color: #1E293B; margin-bottom: 4px; }
        .score-val-sm { font-size: 11px; font-weight: 700; color: #1E293B; }

        .btn-action-sm { background: #0F172A; color: white; border-radius: 4px; padding: 6px; font-size: 10px; font-weight: 700; width: 100%; text-align: center; }
        .btn-outline-action-sm { background: transparent; color: #0F172A; border: 1px solid #0F172A; border-radius: 4px; padding: 6px; font-size: 10px; font-weight: 700; width: 100%; text-align: center; }

        .tech-table-row { display: flex; align-items: center; padding: 12px 14px; font-size: 13px; background: #F8FAFC; border-radius: 8px; margin-bottom: 8px; transition: transform 0.2s; border: 1px solid transparent; }
        .tech-table-row:hover { transform: translateX(4px); border-color: #3B82F6; background: white; }
        .tech-icon-box { width: 32px; height: 32px; background: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #3B82F6; margin-right: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
        .tech-table-key { font-weight: 700; color: #64748B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .tech-table-val { color: #0F172A; font-weight: 700; font-size: 13px; }

        .icon-check { background: #22C55E; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
        .icon-cross { background: #EF4444; color: white; width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; }
      `}</style>

      {/* Barre de navigation */}
      <nav className="top-navbar">
        <div className="container-custom flex justify-between items-center w-full">
          <div className="cursor-pointer" onClick={() => { setView('home'); setProduct(null); }}>
            <Logo />
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <span className="nav-link">Avis</span>
            <span className="nav-link">Catégories <i className="fas fa-chevron-down text-[10px]"></i></span>
            <span className="nav-link">Offres</span>
            <span className="nav-link">Communauté <i className="fas fa-chevron-down text-[10px]"></i></span>
            <span className="nav-link">Profil</span>
          </div>
        </div>
      </nav>

      {view === 'home' ? (
        <div className="animate-in fade-in duration-500">
          <div style={{ backgroundColor: '#0c1421', padding: '40px 0' }}>
            <div className="container-custom">
              <div style={{ backgroundColor: '#1a2b4b', borderRadius: '12px', padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(query); }} style={{ background: 'white', borderRadius: '8px', height: '64px', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                  <i className="fas fa-search text-slate-300 text-xl"></i>
                  <input
                    type="text"
                    placeholder="Rechercher des produits, modèles ou marques..."
                    className="flex-1 ml-4 outline-none text-lg font-medium text-slate-700 placeholder:text-slate-400"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </form>
              </div>
            </div>
          </div>

          <div className="container-custom">
            <div style={{ backgroundColor: '#E2E8F0', borderRadius: '12px', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <i className="fas fa-camera text-2xl text-slate-400"></i>
                Scanner un code-barres pour voir les avis
              </div>
              <button style={{ backgroundColor: '#1E293B', color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: 700, fontSize: '14px' }}>Ouvrir le scanner</button>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-extrabold mb-8">Produits Populaires</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {featuredProducts.map((p) => (
                  <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer" onClick={() => handleSearch(p.id, true)}>
                    <img src={normalizeImg(p.image_url)} alt={p.name} className="h-40 w-full object-contain mb-4" />
                    <div className="font-bold text-slate-900 text-sm mb-2">{p.name}</div>
                    <StarRating rating={8.5} />
                    <div className="text-slate-400 text-xs font-medium mt-1">53 avis</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16">
              <h2 className="text-2xl font-extrabold mb-8">Avis Récents</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentReviews.map((rev) => (
                  <ReviewCard key={rev.id} review={rev} productName={featuredProducts.find(p => p.id === rev.product_id)?.name} />
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 py-8 flex justify-between items-center mt-20">
              <div className="flex gap-6 text-xs font-bold text-slate-400">
                <span>À propos</span>
                <span>Contact</span>
                <span>Confidentialité</span>
              </div>
              <div className="flex gap-4 text-slate-800 text-lg">
                <i className="fab fa-facebook"></i>
                <i className="fab fa-twitter"></i>
                <i className="fab fa-instagram"></i>
                <i className="fab fa-youtube"></i>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="container-custom py-10 animate-in fade-in duration-500">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-40">
              <i className="fas fa-circle-notch fa-spin text-5xl text-[#3B82F6] mb-6"></i>
              <p className="text-slate-400 font-extrabold tracking-widest uppercase text-xs">Chargement de l'avis...</p>
            </div>
          ) : !product ? (
            <div className="bg-white p-20 rounded-2xl text-center shadow-lg border border-slate-200">
              <p className="text-xl font-bold text-[#1e293b]">Produit Introuvable</p>
              <button onClick={() => setView('home')} className="mt-4 text-[#3B82F6] font-bold underline">Retour</button>
            </div>
          ) : (
            <>
              {/* En-tête du produit */}
              <div className="flex flex-col md:flex-row gap-12 mb-10 items-start">
                <div className="flex-1">
                  <h1 className="text-[36px] font-extrabold text-[#0F172A] mb-8 leading-tight">{product.name}</h1>
                  <h2 className="text-[18px] font-bold text-[#0F172A] mb-2">Résumé Rapide</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <StarRating rating={Number(toScore10(aiSummary?.rating))} size="sm" />
                    <span className="text-[#0F172A] font-extrabold text-[20px] ml-1">{toScore10(aiSummary?.rating)}/10</span>
                  </div>
                  <p className="text-[#475569] text-[14px] leading-relaxed max-w-[550px]">
                    {aiSummary?.review_text?.[0] || product.description || "Analyse en cours..."}
                  </p>
                </div>
                <div className="w-full md:w-[260px] flex-shrink-0">
                  <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 shadow-sm flex items-center justify-center h-[240px]">
                    <img src={normalizeImg(product.image_url)} alt={product.name} className="max-h-full max-w-full object-contain" />
                  </div>
                </div>
              </div>

              {/* Ligne 1: Points Forts & Faibles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="detail-card">
                  <div className="card-header">Points forts</div>
                  <ul className="space-y-3">
                    {(aiSummary?.points_forts || ["Écran Exceptionnel", "Processeur Rapide", "Excellente Caméra"]).map((p, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="icon-check"><i className="fas fa-check"></i></div>
                        <span className="font-bold text-[13px] text-[#475569]">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="detail-card">
                  <div className="card-header">Points faibles</div>
                  <ul className="space-y-3">
                    {(aiSummary?.points_faibles || ["Autonomie Moyenne", "Prix Élevé", "Pas de Stockage Extensible"]).map((p, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="icon-cross"><i className="fas fa-times"></i></div>
                        <span className="font-bold text-[13px] text-[#475569]">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Section Nos Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div className="detail-card">
                  <div className="card-header flex justify-between items-center">
                    <span>Nos Notes</span>
                    <StarRating rating={Number(toScore10(aiSummary?.rating))} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 mb-6 mt-2">
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Expert: <span className="score-val-sm text-blue-600">5.9</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 3 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Durabilité: <span className="score-val-sm text-blue-600">5.3</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 2 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Détails: <span className="score-val-sm text-blue-600">5.7</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 3 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Utilisateur: <span className="score-val-sm text-green-600">8.0</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 4 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Investissement: <span className="score-val-sm text-green-600">8.3</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 4 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="score-label-box text-[#0F172A] mb-0.5">Score Contenu: <span className="score-val-sm text-green-600">8.6</span></span>
                        <div className="flex text-amber-500 gap-0.5 text-[8px]">
                           {[...Array(5)].map((_, i) => <i key={i} className={i < 4 ? "fas fa-star" : "far fa-star"}></i>)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="progress-bar-bg mt-4 relative">
                    <div className="progress-bar-fill shadow-[0_0_8px_rgba(30,58,138,0.3)]" style={{ width: '80%' }}></div>
                  </div>
                </div>
                <div className="detail-card">
                  <div className="card-header">Cycle de vie</div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="score-label-box text-center">Durabilité</div>
                      <div className="progress-bar-bg mb-2">
                        <div className="progress-bar-fill" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="score-label-box text-center">Support</div>
                      <div className="progress-bar-bg mb-2">
                        <div className="progress-bar-fill" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="score-label-box text-center">Batterie</div>
                      <div className="progress-bar-bg mb-2">
                        <div className="progress-bar-fill" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ligne 3: Fiche technique & Alternatives */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-16">
                <div className="detail-card">
                  <div className="card-header">Fiche technique</div>
                  <div className="grid grid-cols-1 gap-1">
                    {(aiSummary?.fiche_technique || ["Écran: 6.7\" OLED", "Processeur: Apple A17 Pro", "Stockage: 256GB", "RAM: 8GB"]).map((f, i) => {
                      const [label, val] = f.split(':').map(s => s.trim());
                      return (
                        <div key={i} className="tech-table-row">
                          <div className="tech-icon-box">
                            <i className={`fas ${getTechIcon(label)}`}></i>
                          </div>
                          <div className="flex flex-col">
                            <span className="tech-table-key">{label}</span>
                            <span className="tech-table-val">{val || '---'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="h-full">
                  <h3 className="text-[18px] font-bold text-[#0F172A] mb-4">Produits relatifs / alternatifs</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {featuredProducts.slice(0, 3).map((p) => (
                      <div key={p.id} className="bg-white p-3 rounded-lg border border-[#E2E8F0] shadow-sm flex flex-col items-center">
                        <img src={normalizeImg(p.image_url)} alt={p.name} className="h-20 w-full object-contain mb-2" />
                        <div className="text-[10px] font-bold text-[#0F172A] text-center mb-1 line-clamp-1">{p.name}</div>
                        <StarRating rating={8} />
                        <div className="w-full space-y-1 mt-3">
                          <button className="btn-action-sm">Voir le prix</button>
                          <button className="btn-outline-action-sm">Recevoir alerte</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center pb-20">
                <button 
                  onClick={() => setView('home')}
                  className="text-[#94A3B8] font-bold uppercase tracking-widest text-[11px] hover:text-[#3B82F6]"
                >
                  &lsaquo; Retour aux recherches
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
