import React from 'react';
import { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  productName?: string;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review, productName }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #E2E8F0',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#94A3B8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white'
        }}>
          <i className="fas fa-user text-lg"></i>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#1E293B' }}>{review.author_name}</div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Il y a quelques heures</div>
        </div>
      </div>
      
      <div>
        <div style={{ fontWeight: 700, fontSize: '15px', color: '#0F172A', marginBottom: '4px' }}>{productName || 'Produit'}</div>
        <p style={{ fontSize: '13px', color: '#475569', lineHeight: '1.6', margin: 0 }}>
          {review.review_text.length > 120 ? review.review_text.substring(0, 120) + '...' : review.review_text}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <div style={{ display: 'flex', color: '#F59E0B', fontSize: '12px' }}>
          {[...Array(5)].map((_, i) => (
            <i key={i} className={i < review.rating ? "fas fa-star" : "far fa-star"}></i>
          ))}
        </div>
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginLeft: '4px' }}>{review.rating}</span>
      </div>
    </div>
  );
};
