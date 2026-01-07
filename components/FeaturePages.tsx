
import React from 'react';

interface FeaturePageProps {
  type: 'analyses-ia' | 'comparateur' | 'api-pro' | 'contact';
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
        <div className="p-10 space-y-8 text-center bg-slate-50/50 rounded-[2.5rem]">
          <div className="h-48 flex items-center justify-center">
            <i className="fas fa-mobile-screen-button text-6xl text-slate-200"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900">iPhone 15 Pro</h3>
          <div className="space-y-3">
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Score IA: 9.1</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Matériau: Titane</div>
          </div>
        </div>
        <div className="p-10 space-y-8 text-center bg-blue-50/30 rounded-[2.5rem] border border-blue-100">
          <div className="h-48 flex items-center justify-center">
            <i className="fas fa-mobile-screen text-6xl text-blue-100"></i>
          </div>
          <h3 className="text-2xl font-black text-slate-900">Galaxy S24 Ultra</h3>
          <div className="space-y-3">
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest text-blue-600">Score IA: 9.3</div>
             <div className="p-3 bg-white rounded-xl text-xs font-black uppercase tracking-widest">Matériau: Titane</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAPIPro = () => (
    <div className="space-y-16">
      <div className="flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <span className="bg-emerald-500/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Pour les Développeurs</span>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Intégrez Avisscore à votre boutique</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-medium italic">Boostez votre conversion avec nos analyses IA en temps réel.</p>
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
             <button className="bg-blue-600 text-white px-10 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl">Documentation API</button>
          </div>
        </div>
        <div className="flex-1 w-full bg-[#0F172A] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
           <pre className="text-blue-400 font-mono text-sm overflow-x-auto"><code>{`GET /v1/product/analysis/iphone-15\n{\n  "status": "success",\n  "data": {\n    "score": 9.2,\n    "verdict": "Indispensable"\n  }\n}`}</code></pre>
        </div>
      </div>
    </div>
  );

  const renderContact = () => (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Contactez l'Équipe</h1>
        <p className="text-slate-500 text-lg font-medium italic">Une question ? Un partenariat ? Nous vous répondons sous 24h.</p>
      </div>
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nom complet</label>
              <input type="text" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold" placeholder="Jean Dupont" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email</label>
              <input type="email" className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold" placeholder="jean@example.com" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Message</label>
            <textarea className="w-full h-40 p-6 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-600 outline-none font-bold resize-none" placeholder="Comment pouvons-nous vous aider ?"></textarea>
          </div>
          <button className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:bg-blue-500 transition-all active:scale-95">Envoyer le message</button>
        </form>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in duration-700">
      <div className="mb-10">
         <button onClick={onBack} className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] hover:text-blue-600 transition-colors">
            <i className="fas fa-arrow-left"></i> Retour
         </button>
      </div>
      {type === 'analyses-ia' && renderAnalysesIA()}
      {type === 'comparateur' && renderComparateur()}
      {type === 'api-pro' && renderAPIPro()}
      {type === 'contact' && renderContact()}
    </div>
  );
};
