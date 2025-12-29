
import React from 'react';

interface FeaturePageProps {
  type: 'analyses-ia' | 'comparateur' | 'api-pro';
  onBack: () => void;
}

export const FeaturePage: React.FC<FeaturePageProps> = ({ type, onBack }) => {
  const renderAnalysesIA = () => (
    <div className="space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <span className="bg-blue-600/10 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-600/20">Moteur Neural Avisscore</span>
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Comment l'IA révolutionne vos achats</h1>
        <p className="text-slate-500 text-lg leading-relaxed font-medium italic">Nous analysons plus de 10,000 points de données par produit pour extraire la vérité derrière le marketing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: "Objectivité Totale", icon: "fa-scale-balanced", desc: "Aucun partenariat marque n'influence nos scores. Seuls les faits comptent." },
          { title: "Vitesse Flash", icon: "fa-bolt", desc: "Une synthèse complète de 500 avis générée en moins de 2 secondes." },
          { title: "Précision Sémantique", icon: "fa-brain", desc: "Notre IA comprend les nuances entre un 'bon produit' et un 'produit exceptionnel'." }
        ].map((item, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl hover:-translate-y-2 transition-all duration-500 text-center space-y-6">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 text-2xl mx-auto shadow-inner">
              <i className={`fas ${item.icon}`}></i>
            </div>
            <h3 className="text-xl font-black text-slate-900">{item.title}</h3>
            <p className="text-slate-400 text-sm font-bold leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#0F172A] rounded-[3rem] p-12 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black tracking-tight">Le score Avisscore expliqué</h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              Le score n'est pas une simple moyenne. C'est un mélange pondéré de :
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-4 text-sm font-black uppercase tracking-widest"><i className="fas fa-check text-blue-500"></i> Performance Brute (40%)</li>
              <li className="flex items-center gap-4 text-sm font-black uppercase tracking-widest"><i className="fas fa-check text-blue-500"></i> Durabilité Estimée (30%)</li>
              <li className="flex items-center gap-4 text-sm font-black uppercase tracking-widest"><i className="fas fa-check text-blue-500"></i> Satisfaction Utilisateur (30%)</li>
            </ul>
          </div>
          <div className="w-64 h-64 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-700">
            <span className="text-6xl font-black text-blue-500">9.2</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderComparateur = () => (
    <div className="space-y-16">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Comparateur Face-à-Face</h1>
        <p className="text-slate-500 text-lg leading-relaxed font-medium italic">Visualisez les différences réelles entre deux modèles avant de choisir.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white p-4 rounded-[3rem] border border-slate-100 shadow-2xl relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#0F172A] text-white rounded-full hidden lg:flex items-center justify-center font-black z-20 shadow-2xl border-4 border-white">VS</div>
        
        {/* Mock Product 1 */}
        <div className="p-10 space-y-8 text-center bg-slate-50/50 rounded-[2.5rem]">
          <div className="h-48 flex items-center justify-center">
            <img src="https://lloswaqfitxhfmunebzx.supabase.co/storage/v1/object/public/product-images/iphone-15.png" className="max-h-full drop-shadow-2xl" alt="Product A" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">iPhone 15 Pro</h3>
          <div className="space-y-3">
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Score IA: 9.1</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Poids: 187g</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Matériau: Titane</div>
          </div>
        </div>

        {/* Mock Product 2 */}
        <div className="p-10 space-y-8 text-center bg-blue-50/30 rounded-[2.5rem] border border-blue-100">
          <div className="h-48 flex items-center justify-center">
            <img src="https://lloswaqfitxhfmunebzx.supabase.co/storage/v1/object/public/product-images/ps5.png" className="max-h-full drop-shadow-2xl" alt="Product B" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Galaxy S24 Ultra</h3>
          <div className="space-y-3">
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest text-blue-600">Score IA: 9.3</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Poids: 232g</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Matériau: Titane</div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button onClick={() => alert("Bientôt disponible !")} className="bg-[#0F172A] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
          Comparer de nouveaux produits
        </button>
      </div>
    </div>
  );

  const renderAPIPro = () => (
    <div className="space-y-16">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Pour les Développeurs</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Intégrez Avisscore à votre boutique</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-medium italic">Boostez votre taux de conversion en affichant nos analyses IA directement sur vos fiches produits.</p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
             <button className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Documentation API</button>
             <button className="bg-white border border-slate-200 text-slate-900 px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">S'inscrire</button>
          </div>
        </div>
        <div className="flex-1 w-full">
           <div className="bg-[#0F172A] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
              <div className="flex gap-2 mb-6">
                 <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                 <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                 <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              </div>
              <pre className="text-blue-400 font-mono text-sm overflow-x-auto">
                <code>{`GET /v1/product/analysis/iphone-15
{
  "status": "success",
  "data": {
    "score": 9.2,
    "verdict": "Indispensable",
    "pros": ["Ecran", "Autonomie"],
    "cons": ["Prix"]
  }
}`}</code>
              </pre>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
          <h3 className="text-2xl font-black text-slate-900">Plan Starter</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Gratuit pour les projets de test</p>
          <div className="text-4xl font-black text-slate-900">0€<span className="text-slate-300 text-sm">/mois</span></div>
          <ul className="space-y-4 text-sm font-bold text-slate-600">
            <li><i className="fas fa-check text-blue-500 mr-2"></i> 100 requêtes / mois</li>
            <li><i className="fas fa-check text-blue-500 mr-2"></i> Documentation Standard</li>
          </ul>
        </div>
        <div className="bg-[#0F172A] p-10 rounded-[2.5rem] border border-blue-600/30 shadow-2xl text-white space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-bl-2xl shadow-xl">Populaire</div>
          <h3 className="text-2xl font-black">Plan Enterprise</h3>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Pour les boutiques à fort trafic</p>
          <div className="text-4xl font-black">Sur mesure</div>
          <ul className="space-y-4 text-sm font-bold text-slate-400">
            <li><i className="fas fa-check text-blue-500 mr-2"></i> Requêtes illimitées</li>
            <li><i className="fas fa-check text-blue-500 mr-2"></i> Support 24/7 Dédié</li>
            <li><i className="fas fa-check text-blue-500 mr-2"></i> Webhooks temps réel</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-10 flex items-center justify-between">
         <button onClick={onBack} className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-blue-600 transition-colors">
            <i className="fas fa-arrow-left"></i> Retour
         </button>
      </div>

      {type === 'analyses-ia' && renderAnalysesIA()}
      {type === 'comparateur' && renderComparateur()}
      {type === 'api-pro' && renderAPIPro()}

      <div className="mt-24 pt-10 border-t border-slate-100 flex justify-center">
         <button onClick={onBack} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-xl">
            Découvrir d'autres fonctionnalités
         </button>
      </div>
    </div>
  );
};
