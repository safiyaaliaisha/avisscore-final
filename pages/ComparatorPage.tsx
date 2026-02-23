
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import { Search, Scale, CheckCircle2, Trophy, ArrowRight, Loader2, Star } from 'lucide-react';

interface ComparatorPageProps {
  onBack: () => void;
  initialProduct?: Product | null;
}

export const ComparatorPage: React.FC<ComparatorPageProps> = ({ onBack, initialProduct }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>(initialProduct ? [initialProduct] : []);
  const [isSearching, setIsSearching] = useState(false);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  // Fetch similar products if we have a selected product
  useEffect(() => {
    const fetchSimilar = async () => {
      if (selectedProducts.length === 0) return;
      
      const mainProduct = selectedProducts[0];
      if (!mainProduct.category) return;

      setIsLoadingSimilar(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('category', mainProduct.category)
          .neq('id', mainProduct.id)
          .limit(6);
        
        if (data) setSimilarProducts(data);
      } catch (err) {
        console.error("Error fetching similar products:", err);
      } finally {
        setIsLoadingSimilar(false);
      }
    };

    fetchSimilar();
  }, [selectedProducts]);

  // Search functionality
  useEffect(() => {
    const search = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('products')
          .select('*')
          .ilike('name', `%${searchQuery}%`)
          .limit(5);
        
        if (data) setSearchResults(data);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const toggleProduct = (product: Product) => {
    if (selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== product.id));
    } else {
      if (selectedProducts.length >= 4) return; // Limit to 4 products
      setSelectedProducts([...selectedProducts, product]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const bestProduct = useMemo(() => {
    if (selectedProducts.length < 2) return null;
    return [...selectedProducts].sort((a, b) => (b.score || 0) - (a.score || 0))[0];
  }, [selectedProducts]);

  const getFirstImage = (img: any) => {
    if (Array.isArray(img)) return img[0];
    if (typeof img === 'string') {
        try {
            const p = JSON.parse(img);
            return Array.isArray(p) ? p[0] : img;
        } catch {
            return img;
        }
    }
    return img;
  };

  const parseSpecs = (specs: any) => {
    if (Array.isArray(specs)) return specs;
    if (typeof specs === 'string') {
        try {
            return JSON.parse(specs);
        } catch {
            return [specs];
        }
    }
    return [];
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Comparateur Expert</h1>
          <p className="text-slate-500 text-lg font-medium italic">Analysez les différences techniques et trouvez le meilleur rapport qualité-prix.</p>
        </div>
        
        <div className="relative w-full md:w-96">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ajouter un produit à comparer..."
              className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold shadow-sm"
            />
            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-600" size={18} />}
          </div>

          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
              {searchResults.map(p => (
                <button 
                  key={p.id}
                  onClick={() => toggleProduct(p)}
                  className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                >
                  <img src={getFirstImage(p.image_url)} className="w-10 h-10 object-contain" alt="" />
                  <div>
                    <p className="font-black text-xs text-slate-900 line-clamp-1">{p.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">{p.category}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProducts.length > 0 ? (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedProducts.map(p => {
              const isBest = bestProduct && p.id === bestProduct.id;
              return (
                <div 
                  key={p.id} 
                  className={`relative p-8 rounded-[3rem] border-2 transition-all duration-500 flex flex-col ${
                    isBest 
                      ? 'bg-emerald-50 border-emerald-500 shadow-2xl shadow-emerald-500/10 scale-105 z-10' 
                      : 'bg-white border-slate-100 shadow-xl'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <Trophy size={14} /> Meilleur Choix
                    </div>
                  )}
                  
                  <button 
                    onClick={() => toggleProduct(p)}
                    className="absolute top-6 right-6 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>

                  <div className="h-40 flex items-center justify-center mb-8">
                    <img src={getFirstImage(p.image_url)} className="max-h-full max-w-full object-contain drop-shadow-xl" alt={p.name} />
                  </div>

                  <div className="text-center space-y-4 flex-1">
                    <h3 className="font-black text-slate-900 text-lg leading-tight line-clamp-2">{p.name}</h3>
                    <div className="flex flex-col items-center gap-1">
                      <span className={`text-3xl font-black ${isBest ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {(p.score || 8.5).toFixed(1)}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Score AvisScore</span>
                    </div>
                    
                    <div className="pt-6 border-t border-slate-100 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Prix</span>
                        <span className="font-black text-slate-900">{p.current_price?.toFixed(2)}€</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase">Rating</span>
                        <div className="flex text-amber-500 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} className={i < Math.floor(p.rating || 4.5) ? "fill-amber-500" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={p.affiliate_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`mt-8 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                      isBest 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500' 
                        : 'bg-[#0F172A] text-white hover:bg-blue-600'
                    }`}
                  >
                    Voir l'offre <ArrowRight size={14} />
                  </a>
                </div>
              );
            })}
            
            {selectedProducts.length < 4 && (
              <div className="border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center space-y-4 group hover:border-blue-200 transition-colors">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-400 transition-all">
                  <Scale size={32} />
                </div>
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Ajouter un produit</p>
              </div>
            )}
          </div>

          {/* Detailed Comparison Table */}
          <div className="bg-white rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Comparaison Technique</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="p-8 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Caractéristique</th>
                    {selectedProducts.map(p => (
                      <th key={p.id} className="p-8 text-sm font-black text-slate-900">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-xs font-bold text-slate-500 italic">Verdict Technique</td>
                    {selectedProducts.map(p => (
                      <td key={p.id} className="p-8">
                        <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-3">
                          {p.verdict_technique || "Analyse en cours..."}
                        </p>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-8 text-xs font-bold text-slate-500 italic">Points Forts</td>
                    {selectedProducts.map(p => {
                      const pros = parseSpecs(p.points_forts);
                      return (
                        <td key={p.id} className="p-8">
                          <ul className="space-y-2">
                            {pros.slice(0, 3).map((pro: any, i: number) => (
                              <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
                                <CheckCircle2 size={12} /> {String(pro).replace(/[\[\]"]/g, '')}
                              </li>
                            ))}
                          </ul>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-32 text-center space-y-8 bg-white rounded-[4rem] border border-slate-100 shadow-xl">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mx-auto">
            <Scale size={48} />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900">Commencez votre comparaison</h2>
            <p className="text-slate-400 font-medium italic">Recherchez un produit ci-dessus pour débuter l'analyse comparative.</p>
          </div>
        </div>
      )}

      {/* Similar Products Suggestions */}
      {selectedProducts.length > 0 && similarProducts.length > 0 && (
        <div className="space-y-8 pt-12">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Produits Similaires</h2>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basé sur la catégorie {selectedProducts[0].category}</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {similarProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => toggleProduct(p)}
                disabled={selectedProducts.find(sp => sp.id === p.id) !== undefined}
                className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-center group disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
              >
                <div className="h-24 flex items-center justify-center mb-4">
                  <img src={getFirstImage(p.image_url)} className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform" alt="" />
                </div>
                <p className="text-[10px] font-black text-slate-900 line-clamp-2 h-8 leading-tight">{p.name}</p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-center gap-2">
                  <span className="text-[10px] font-black text-blue-600">{(p.score || 8.5).toFixed(1)}</span>
                  <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                  <span className="text-[10px] font-black text-slate-400">{p.current_price?.toFixed(0)}€</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
