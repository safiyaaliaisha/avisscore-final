
import React from 'react';
import { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div className="flex text-yellow-400">
      {[...Array(5)].map((_, i) => (
        <i key={i} className={`${i < rating ? 'fas' : 'far'} fa-star text-xs mr-0.5`}></i>
      ))}
    </div>
  );
};

export const ReviewList: React.FC<ReviewListProps> = ({ reviews }) => {
  if (reviews.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400">
        <i className="far fa-comment-dots text-4xl mb-3 block"></i>
        <p>No reviews yet for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">{review.author_name}</h4>
              <StarRating rating={review.rating} />
            </div>
            <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-2 py-1 rounded">
              {new Date(review.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed">
            {/* Changed review.content to review.review_text to match Review interface */}
            {review.review_text}
          </p>
        </div>
      ))}
    </div>
  );
};
