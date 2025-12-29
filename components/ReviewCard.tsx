
import React from 'react';
import { Product, ProductSummary } from '../types';

interface ReviewCardProps {
  product: Product;
  summary?: ProductSummary | null;
  isAnalyzing?: boolean;
  relatedProducts?: Product[];
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex text-amber-400 gap-1">
    {[...Array(5)].map((_, i) => (
      <i key={i} className={`${i < Math.floor(rating) ? "fas" : "far"} fa-star text-sm`}></i>
    ))}
  </div>
);

const ProgressBar = ({ progress, label, value, colorClass = "from-blue-600 to-indigo-600" }: { progress: number; label?: string; value?: string; colorClass?: string }) => (
  <div className="mb-4 last:mb-0 w-full">
    {(label || value) && (
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-black text-slate-900">{value}</span>
      </div>
    )}
    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
      <div 
        className={`bg-gradient-to-r ${colorClass} h-full rounded-full transition-all duration-1000 ease-out`} 
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

const getSpecIcon = (key: string) => {
  const k = String(key).toLowerCase();
  if (k.includes('écran') || k.includes('screen') || k.includes('display')) return 'fa-mobile-screen-button';
  if (k.includes('processeur') || k.includes('cpu') || k.includes('chip')) return 'fa-microchip';
  if (k.includes('stockage') || k.includes('ssd') || k.includes('disk') || k.includes('storage')) return 'fa-hard-drive';
  if (k.includes('ram') || k.includes('mémoire') || k.includes('memory')) return 'fa-memory';
  if (k.includes('batterie') || k.includes('battery')) return 'fa-battery-full';
  if (k.includes('caméra') || k.includes('camera') || k.includes('photo')) return 'fa-camera';
  return 'fa-gear';
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ product, summary, isAnalyzing, relatedProducts = [] }) => {
  const expertScore = product?.score || product?.analysis?.score || 0;
  const userScore = product?.rating || summary?.rating || 0;
  
  const globalScore = expertScore > 0 ? (expertScore * 0.6 + userScore * 2 * 0.4) : (userScore > 0 ? userScore * 2 : 0);
  const ratingText = globalScore.toFixed(1);

  const pointsForts = Array.isArray(product?.points_forts) ? product.points_forts : (Array.isArray(product?.analysis?.points_forts) ? product.analysis.points_forts : []);
  const pointsFaibles = Array.isArray(product?.points_faibles) ? product.points_faibles : (Array.isArray(product?.analysis?.points_faibles) ? product.analysis.points_faibles : []);
  const ficheTechnique = Array.isArray(product?.fiche_technique) ? product.fiche_technique : [];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      
      <div className="border-b border-slate-200/60 pb-8 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-2">
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">{String(product?.name || 'Produit')}</h1>
          <span className="text-blue-600 font-bold text-lg mb-1">{String(product?.category || "Technologie")}</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
          <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Données Réelles</span>
          <span className="text-slate-400 font-bold text-sm">Produit vérifié & Note certifiée</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-8 flex flex-col bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Verdict Final</h2>
            <div className="flex items-center gap-5 p-4 bg-slate-900 rounded-[1.5rem] shadow-xl shadow-blue-500/20 transform hover:scale-105 transition-transform duration-300">
              <div className="flex flex-col items-center">
                <StarRating rating={globalScore / 2} />
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mt-1">Score Global</span>
              </div>
              <div className="h-10 w-px bg-slate-700"></div>
              <span className="text-4xl font-black text-white tracking-tighter">{ratingText}<span className="text-blue-500 text-xl ml-0.5">/10</span></span>
            </div>
          </div>
          
          <p className="text-slate-600 leading-relaxed text-xl font-medium mb-auto">
            {product?.review_text || product?.description || "Aucune analyse disponible pour ce produit actuellement."}
          </p>

          <div className="mt-8 pt-8 border-t border-slate-50">
            <div className="bg-slate-900 rounded-[1.25rem] p-5 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-full bg-blue-600/10 -skew-x-12 transform translate-x-8"></div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center text-blue-400">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div>
                  <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Statut</span>
                  <span className="text-white font-black text-xs uppercase">En stock</span>
                </div>
              </div>
              <div className="flex-1 w-full text-white font-bold text-sm">
                Prix indicatif : {product?.price ? `${product.price}€` : "Non spécifié"}
              </div>
              <div className="text-slate-400 text-xs italic font-medium max-w-xs text-center sm:text-left">
                "Analyse basée sur les caractéristiques techniques réelles."
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center justify-center relative overflow-hidden group">
          {product?.image_url ? (
            <img 
              src={product.image_url} 
              alt={String(product?.name || '')} 
              className="relative max-h-72 object-contain drop-shadow-[0_25px_60px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-700 z-10" 
            />
          ) : (
            <div className="text-slate-200 text-6xl"><i className="fas fa-image"></i></div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] text-9xl text-slate-900 pointer-events-none">
            <i className="fas fa-chart-line"></i>
          </div>
          
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <i className="fas fa-star-half-stroke text-blue-600"></i> Analyse Détaillée
          </h3>

          <div className="flex-1 flex flex-col justify-center space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center text-[10px] text-white">
                    <i className="fas fa-user-tie"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Technique</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{(expertScore * 2).toFixed(1)}</span>
                  <span className="text-slate-300 font-bold text-sm">/10</span>
                </div>
              </div>

              <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 group hover:bg-white hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-[10px] text-white">
                    <i className="fas fa-users"></i>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Public</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{(userScore * 2).toFixed(1)}</span>
                  <span className="text-slate-300 font-bold text-sm">/10</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <ProgressBar 
                progress={expertScore * 20} 
                label="Qualité Technique" 
                value={expertScore >= 4.5 ? "Premium" : "Standard"} 
                colorClass="from-blue-500 to-indigo-600" 
              />
              <ProgressBar 
                progress={userScore * 20} 
                label="Note Utilisateur" 
                value={userScore >= 4.5 ? "Exceptionnelle" : "Correcte"} 
                colorClass="from-emerald-400 to-teal-600" 
              />
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase text-center tracking-[0.2em]">
            Source : Base de données produits Avisscore
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-xl flex items-center justify-center text-xs">
                <i className="fas fa-plus"></i>
              </span>
              Points forts
            </h3>
            <ul className="space-y-4">
              {pointsForts.length > 0 ? pointsForts.map((p, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-700 font-bold group/item">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover/item:bg-emerald-500 transition-colors">
                    <i className="fas fa-check text-[8px] text-emerald-500 group-hover/item:text-white"></i>
                  </div>
                  <span className="text-sm">{String(p)}</span>
                </li>
              )) : <li className="text-slate-400 text-xs italic">Aucun point fort renseigné</li>}
            </ul>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden group">
            <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
              <span className="w-8 h-8 bg-rose-500 text-white rounded-xl flex items-center justify-center text-xs">
                <i className="fas fa-minus"></i>
              </span>
              Points faibles
            </h3>
            <ul className="space-y-4">
              {pointsFaibles.length > 0 ? pointsFaibles.map((p, i) => (
                <li key={i} className="flex items-start gap-4 text-slate-700 font-bold group/item">
                  <div className="w-5 h-5 rounded-full bg-rose-50 flex items-center justify-center shrink-0 group-hover/item:bg-rose-500 transition-colors">
                    <i className="fas fa-times text-[8px] text-rose-500 group-hover/item:text-white"></i>
                  </div>
                  <span className="text-sm">{String(p)}</span>
                </li>
              )) : <li className="text-slate-400 text-xs italic">Aucun point faible renseigné</li>}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-2xl font-black text-slate-900">Spécifications</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {ficheTechnique.length > 0 ? ficheTechnique.map((f, i) => {
              const parts = String(f).split(':');
              const icon = getSpecIcon(parts[0]?.trim() || "");
              return (
                <div key={i} className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50/50 border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-xl transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all shadow-sm">
                    <i className={`fas ${icon} text-xl`}></i>
                  </div>
                  <div className="overflow-hidden">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{parts[0]?.trim() || 'Info'}</span>
                    <span className="block text-sm font-black text-slate-900 truncate">{parts.slice(1).join(':').trim() || "N/A"}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center text-slate-400 text-sm font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-3xl">
                Spécifications techniques non disponibles
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <h3 className="text-2xl font-black text-slate-900 px-2 flex items-center justify-between">
            Produits Similaires
          </h3>
          <div className="grid grid-cols-1 gap-4">
            {Array.isArray(relatedProducts) && relatedProducts.length > 0 ? relatedProducts.map((p, i) => (
              <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-5 shadow-lg flex items-center gap-6 group hover:shadow-2xl transition-all duration-500">
                <div className="w-24 h-24 shrink-0 bg-slate-50 rounded-2xl p-2 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                  <img src={p.image_url || ''} alt={String(p.name)} className="max-h-full object-contain group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="text-sm font-black text-slate-900 mb-1 truncate group-hover:text-blue-600">{String(p.name)}</h4>
                  <StarRating rating={p.rating || p.score || 4} />
                  <div className="mt-3 flex gap-2">
                    <button className="bg-[#0F172A] text-white text-[9px] font-black px-4 py-2 rounded-xl hover:bg-blue-600 transition-all uppercase">Détails</button>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px]">
                Aucun produit similaire trouvé
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
