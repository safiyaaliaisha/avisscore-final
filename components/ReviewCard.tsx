
import React from 'react';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
}

const getSourceColor = (source?: string) => {
  switch (source) {
    case 'Amazon': return 'text-orange-500';
    case 'Fnac': return 'text-amber-400';
    case 'Rakuten': return 'text-red-600';
    case 'Boulanger': return 'text-orange-600';
    case 'Darty': return 'text-red-700 font-bold';
    default: return 'text-slate-400';
  }
};

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  return (
    <div className="bg-white p-8 border border-slate-100 hover:border-[#002395] transition-all duration-300 group">
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex gap-0.5 mb-2">
            {[...Array(5)].map((_, i) => (
              <i key={i} className={`${i < review.rating ? 'fas' : 'far'} fa-star text-[10px] ${i < review.rating ? 'text-[#002395]' : 'text-slate-200'}`}></i>
            ))}
          </div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-900">{review.author_name}</h4>
        </div>
        <div className="text-right">
          <span className={`text-[9px] font-black uppercase tracking-tighter ${getSourceColor(review.source)}`}>
            {review.source || 'Avis vérifié'}
          </span>
          <p className="text-[10px] text-slate-400 mt-1">{new Date(review.created_at).toLocaleDateString('fr-FR')}</p>
        </div>
      </div>
      
      <div className="relative">
        <i className="fas fa-quote-left absolute -left-4 -top-2 text-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"></i>
        <p className="text-slate-600 text-sm leading-relaxed italic">
          {/* Changed review.content to review.review_text to match Review interface */}
          "{review.review_text}"
        </p>
      </div>
    </div>
  );
};
