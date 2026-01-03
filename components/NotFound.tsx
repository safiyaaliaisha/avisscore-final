
import React from 'react';

interface NotFoundProps {
  onBack: () => void;
}

export const NotFound: React.FC<NotFoundProps> = ({ onBack }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 relative overflow-hidden">
      {/* Background Watermark */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
        <span className="text-[25rem] font-black text-slate-900 leading-none">404</span>
      </div>

      <div className="relative z-10 text-center space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="w-24 h-24 bg-blue-600/10 rounded-3xl flex items-center justify-center text-blue-600 text-4xl mx-auto shadow-inner border border-blue-600/20">
          <i className="fas fa-map-signs"></i>
        </div>

        <div className="space-y-4">
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter">Oups !</h1>
          <h2 className="text-2xl font-bold text-slate-500 tracking-tight">Page introuvable</h2>
        </div>

        <p className="text-slate-400 font-medium text-lg max-w-md mx-auto italic">
          L'analyse ou la page que vous recherchez n'existe pas ou a été déplacée par nos serveurs neuraux.
        </p>

        <div className="pt-8">
          <button 
            onClick={onBack}
            className="bg-[#0F172A] text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-blue-900/20 active:scale-95 flex items-center gap-4 mx-auto group"
          >
            <i className="fas fa-home group-hover:-translate-y-0.5 transition-transform"></i>
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
};
