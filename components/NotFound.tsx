import React from 'react';

/**
 * NotFound Component
 * Using a direct absolute link to force a complete reset to the homepage on the live site.
 * This implementation provides both named and default exports to ensure compatibility with App.tsx.
 */
export const NotFound: React.FC<{ onBack?: () => void }> = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in duration-700">
      <div className="bg-blue-100 p-4 rounded-full mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tighter">Oups !</h1>
      <p className="text-xl text-slate-600 mb-8 font-semibold">Page introuvable</p>
      
      <a 
        href="https://www.avisscore.fr"
        className="bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 px-8 rounded-lg transition-colors inline-flex items-center gap-2 shadow-xl shadow-slate-200 active:scale-95"
      >
        <span>🏠</span>
        Retour à l'accueil
      </a>
    </div>
  );
};

export default NotFound;