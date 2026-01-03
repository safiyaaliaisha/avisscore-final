
import React from 'react';

interface LegalPageProps {
  type: 'privacy' | 'cookies' | 'terms';
  onBack: () => void;
}

export const LegalPage: React.FC<LegalPageProps> = ({ type, onBack }) => {
  const content = {
    privacy: {
      title: "Politique de Confidentialité",
      icon: "fa-shield-halved",
      sections: [
        {
          h: "Collecte des données",
          p: "Avisscore collecte uniquement les données nécessaires à l'amélioration de votre expérience utilisateur. Cela inclut vos préférences de recherche et, si vous créez un profil, vos informations de contact basiques via nos services d'authentification tiers."
        },
        {
          h: "Utilisation de l'IA (Gemini)",
          p: "Nous utilisons l'intelligence artificielle Google Gemini pour synthétiser les avis. Aucune de vos données personnelles identifiables n'est envoyée aux modèles d'IA sans votre consentement explicite. Les analyses sont générées à partir de données publiques ou anonymisées."
        },
        {
          h: "Stockage (Supabase)",
          p: "Vos données sont stockées de manière sécurisée via Supabase. Nous utilisons des protocoles de chiffrement de pointe pour garantir l'intégrité et la confidentialité de vos informations."
        },
        {
          h: "Vos droits",
          p: "Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Vous pouvez nous contacter à tout moment pour exercer ces droits."
        }
      ]
    },
    cookies: {
      title: "Politique des Cookies",
      icon: "fa-cookie-bite",
      sections: [
        {
          h: "Qu'est-ce qu'un cookie ?",
          p: "Un cookie est un petit fichier texte déposé sur votre terminal lors de la visite de notre plateforme. Il nous permet de reconnaître votre navigateur et de mémoriser certaines informations."
        },
        {
          h: "Quels cookies utilisons-nous ?",
          p: "Nous utilisons des cookies essentiels pour le fonctionnement du site (session utilisateur), des cookies de performance pour analyser l'audience (via des outils anonymes) et des cookies de personnalisation pour vos préférences d'affichage."
        },
        {
          h: "Gestion de vos préférences",
          p: "Vous pouvez configurer votre navigateur pour refuser les cookies, mais cela pourrait limiter certaines fonctionnalités d'Avisscore, notamment la sauvegarde de vos analyses préférées."
        }
      ]
    },
    terms: {
      title: "Mentions Légales",
      icon: "fa-gavel",
      sections: [
        {
          h: "Éditeur du site",
          p: "Nom : Avisscore\nAdresse : 3 rue de la rosière, 33320 Eysines\nEmail : contact@avisscore.fr\nDirecteur de publication : L'équipe Avisscore"
        },
        {
          h: "Hébergement",
          p: "Ce site est hébergé sur une infrastructure cloud distribuée assurée par :\n\n• Vercel Inc. (Frontend & Edge Network) - Siège social : 340 S Lemon Ave #4133, Walnut, CA 91789, USA.\n\n• Google Cloud Platform (Backend & Compute) - Siège social : Gordon House, Barrow Street, Dublin 4, Ireland."
        },
        {
          h: "Propriété intellectuelle",
          p: "L'ensemble du contenu (textes, logos, algorithmes d'analyse) est la propriété exclusive d'Avisscore Lab. Toute reproduction sans autorisation est strictement interdite."
        },
        {
          h: "Limitation de responsabilité",
          p: "Les analyses produites par notre IA sont fournies à titre indicatif. Avisscore ne saurait être tenu responsable des décisions d'achat basées uniquement sur ces synthèses."
        }
      ]
    }
  };

  const active = content[type];

  return (
    <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-2xl shadow-slate-200/60 border border-slate-100">
      <div className="flex items-center gap-6 mb-12 border-b border-slate-100 pb-10">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white text-3xl shadow-xl shadow-blue-500/20">
          <i className={`fas ${active.icon}`}></i>
        </div>
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">{active.title}</h1>
          <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">Dernière mise à jour : Mars 2025</p>
        </div>
      </div>

      <div className="space-y-12">
        {active.sections.map((s, i) => (
          <div key={i} className="group">
            <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-4">
              <span className="text-blue-600 text-lg">0{i+1}.</span>
              {s.h}
            </h3>
            <p className="text-slate-600 leading-relaxed text-lg font-medium whitespace-pre-line group-hover:text-slate-900 transition-colors">
              {s.p}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-20 pt-10 border-t border-slate-100 flex justify-center">
        <button 
          onClick={onBack}
          className="bg-[#0F172A] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-4 group shadow-xl active:scale-95"
        >
          <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
};
