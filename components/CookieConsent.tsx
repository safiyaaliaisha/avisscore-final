
import React, { useState, useEffect } from 'react';

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('avisscore_consent');
    if (consent === null) {
      // Un léger délai pour ne pas agresser l'utilisateur dès le chargement
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleConsent = (choice: boolean) => {
    localStorage.setItem('avisscore_consent', String(choice));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 md:p-6 animate-in slide-in-from-bottom-full duration-700">
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0F172A]/95 backdrop-blur-xl border border-slate-800 rounded-[2rem] p-6 md:p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.3)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 border border-blue-600/20">
              <i className="fas fa-cookie-bite text-xl"></i>
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-sm md:text-base tracking-tight">
                Respect de votre vie privée
              </p>
              <p className="text-slate-400 text-xs md:text-sm font-medium leading-relaxed max-w-2xl">
                Nous utilisons des cookies pour analyser le trafic et améliorer votre expérience sur <span className="text-blue-400 font-bold italic">Avisscore</span>. 
                Certains sont essentiels au bon fonctionnement de nos analyses neurales.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => handleConsent(false)}
              className="text-slate-500 hover:text-white text-[10px] font-black uppercase tracking-[0.2em] transition-colors py-2 px-4 order-2 sm:order-1"
            >
              Continuer sans accepter
            </button>
            <button
              onClick={() => handleConsent(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all order-1 sm:order-2"
            >
              Accepter tout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
