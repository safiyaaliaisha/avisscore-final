
import React from 'react';
import { ProductSummary } from '../types';

interface SummarizerProps {
  summary: ProductSummary;
}

export const Summarizer: React.FC<SummarizerProps> = ({ summary }) => {
  return (
    <div className="bg-white border border-slate-100 p-12 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#002395] opacity-5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform duration-700"></div>
      
      <div className="flex items-center gap-6 mb-12">
        <div className="w-16 h-16 bg-[#002395] flex items-center justify-center text-white rotate-3 group-hover:rotate-0 transition-transform">
          <i className="fas fa-brain text-2xl"></i>
        </div>
        <div>
          <h3 className="font-serif text-3xl text-slate-900 mb-1">Synthèse Intelligence</h3>
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-[#002395]">Sentiment: {summary.sentiment}</p>
        </div>
      </div>

      <p className="font-light text-2xl text-slate-600 mb-12 leading-relaxed italic border-l-2 border-[#002395] pl-8">
        "{summary.summary}"
      </p>

      <div className="grid md:grid-cols-2 gap-16">
        <div>
          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
            Points Forts <i className="fas fa-check text-[#002395]"></i>
          </h4>
          <ul className="space-y-4">
            {summary.pros.map((pro, i) => (
              <li key={i} className="text-sm text-slate-500 font-light flex items-center gap-4">
                <span className="w-1 h-1 rounded-full bg-[#002395]"></span>
                {pro}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2 flex justify-between">
            Points de Vigilance <i className="fas fa-exclamation text-slate-300"></i>
          </h4>
          <ul className="space-y-4">
            {summary.cons.map((con, i) => (
              <li key={i} className="text-sm text-slate-500 font-light flex items-center gap-4">
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                {con}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
