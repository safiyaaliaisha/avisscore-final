import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface SearchResult {
  id: string;
  name: string;
  image_url: string;
  product_slug: string;
  category: string;
}

interface NavbarProps {
  onNavigate: (view: string) => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, activeView }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Réinitialisation forcée si on retourne sur l'accueil
  useEffect(() => {
    if (activeView === 'home') {
      setQuery('');
      setResults([]);
      setIsOpen(false);
    }
  }, [activeView]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url, product_slug, category')
        .ilike('name', `%${query}%`)
        .limit(5);

      if (!error && data) {
        setResults(data as SearchResult[]);
        setIsOpen(true);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleProductClick = (product: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    onNavigate(`${product.category}/${product.product_slug}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleProductClick(results[selectedIndex]);
      } else if (results.length > 0) {
        handleProductClick(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleLogoClick = () => {
    onNavigate('home');
  };

  return (
    <nav className="bg-[#0F172A] h-20 flex items-center sticky top-0 z-50 shrink-0 border-b border-white/5 shadow-xl">
      <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={handleLogoClick}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <i className="fas fa-check-double text-white"></i>
          </div>
          <span className="text-white font-black text-2xl tracking-tighter hidden sm:inline">Avis<span className="text-blue-400 italic">score</span></span>
        </div>

        {/* Search Bar - Hidden on Home */}
        {activeView !== 'home' ? (
          <div className="relative flex-1 max-w-md" ref={dropdownRef}>
            <div className="relative group">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors"></i>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Rechercher un produit..."
                className="w-full h-11 pl-11 pr-4 bg-slate-800/50 border border-white/10 rounded-xl text-white text-sm font-bold outline-none focus:bg-slate-800 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-500"
              />
            </div>

            {/* Results Dropdown */}
            {isOpen && results.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1E293B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {results.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => handleProductClick(product)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`flex items-center gap-4 p-3 cursor-pointer transition-colors ${index === selectedIndex ? 'bg-blue-600/20' : 'hover:bg-white/5'}`}
                  >
                    <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                      <img src={product.image_url} alt={product.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-bold truncate">{product.name}</p>
                      <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{product.category}</p>
                    </div>
                    <i className="fas fa-chevron-right text-slate-600 text-[10px] mr-2"></i>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : <div className="flex-1"></div>}

        {/* Navigation Links */}
        <div className="hidden lg:flex gap-8 text-slate-400 text-[10px] font-black uppercase tracking-widest items-center shrink-0">
          <span onClick={handleLogoClick} className={`hover:text-white cursor-pointer transition-colors ${activeView === 'home' ? 'text-white underline underline-offset-8 decoration-blue-500' : ''}`}>ACCUEIL</span>
          <span onClick={() => onNavigate('comparateur')} className={`hover:text-white cursor-pointer transition-colors ${activeView === 'comparateur' ? 'text-white' : ''}`}>COMPARATEUR</span>
          <span onClick={() => onNavigate('analyses-ia')} className={`hover:text-white cursor-pointer transition-colors ${activeView === 'analyses-ia' ? 'text-white' : ''}`}>ANALYSES IA</span>
          <span onClick={() => onNavigate('api-pro')} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 transition-all">API PRO</span>
        </div>

        {/* Mobile Menu Icon */}
        <div className="lg:hidden text-white">
          <i className="fas fa-bars text-xl"></i>
        </div>
      </div>
    </nav>
  );
};
