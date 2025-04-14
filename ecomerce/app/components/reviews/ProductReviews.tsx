'use client';
import React, { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { apiClient } from '@/app/utils/apiClient';
import { toast } from 'react-hot-toast';
import './ProductReviews.scss';

interface User {
  id: number;
  name: string;
  lastname: string;
  profile_picture?: string;
}

interface ReviewMedia {
  id: number;
  media_type: string;
  media_data: string;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  User: User;
  media?: ReviewMedia[];
}

interface RatingSummary {
  average: number;
  total: number;
  distribution: {
    [key: number]: number;
  };
}

interface ProductReviewsProps {
  productId: number;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary | null>(null);

  useEffect(() => {
    fetchReviews();
    checkLoginStatus();
  }, [productId]);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    setIsLoggedIn(!!token);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient(`/reviews/products/${productId}/reviews`, {
        skipAuth: true
      });

      if (response.success && response.data) {
        setReviews(response.data.reviews);
        setRatingSummary(response.data.ratingSummary);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('An error occurred while loading reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (rating: number) => {
    setUserRating(rating);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      toast.error('Please log in to submit a review');
      return;
    }
    
    if (userRating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await apiClient(`/reviews/products/${productId}/reviews`, {
        method: 'POST',
        body: JSON.stringify({
          rating: userRating,
          comment: userComment
        })
      });

      if (response.success) {
        toast.success('Review submitted successfully');
        setUserRating(0);
        setUserComment('');
        fetchReviews(); // Refresh reviews
      } else {
        toast.error(response.message || 'Failed to submit review');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      toast.error(err.message || 'An error occurred while submitting your review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="product-reviews">
      <h2 className="reviews-title">Customer Reviews</h2>
      
      {ratingSummary && (
        <div className="rating-summary">
          <div className="average-rating">
            <span className="big-rating">{ratingSummary.average}</span>
            <StarRating rating={Number(ratingSummary.average)} size="large" />
            <span className="rating-count">Based on {ratingSummary.total} reviews</span>
          </div>
        </div>
      )}

      <div className="review-form-container">
        <h3>Write a Review</h3>
        {isLoggedIn ? (
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="form-group">
              <label>Your Rating</label>
              <StarRating 
                rating={userRating} 
                editable={true} 
                size="large" 
                onChange={handleRatingChange} 
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="comment">Your Review (optional)</label>
              <textarea
                id="comment"
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                placeholder="Share your experience with this product..."
                rows={4}
              />
            </div>
            
            <button 
              type="submit" 
              className="submit-review-btn" 
              disabled={isSubmitting || userRating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        ) : (
          <div className="login-prompt">
            <p>Please <a href="/login">log in</a> to write a review</p>
          </div>
        )}
      </div>
      
      <div className="reviews-list">
        <h3>Product Reviews</h3>
        {loading ? (
          <p className="loading-text">Loading reviews...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : reviews.length === 0 ? (
          <p className="no-reviews">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="review-item">
              <div className="review-header">
                <div className="reviewer-info">
                  {review.User.profile_picture ? (
                    <img 
                      src={review.User.profile_picture} 
                      alt={`${review.User.name} ${review.User.lastname}`}
                      className="profile-pic"
                    />
                  ) : (
                    <div className="profile-placeholder">
                      {review.User.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="reviewer-name">
                    {review.User.name} {review.User.lastname.charAt(0)}.
                  </span>
                </div>
                <div className="review-date">{formatDate(review.createdAt)}</div>
              </div>
              
              <div className="review-rating">
                <StarRating rating={review.rating} size="small" />
              </div>
              
              {review.comment && (
                <div className="review-comment">
                  {review.comment}
                </div>
              )}
              
              {review.media && review.media.length > 0 && (
                <div className="review-images">
                  {review.media.map((media) => (
                    <img 
                      key={media.id} 
                      src={media.media_data}
                      alt="Review image"
                      className="review-image"
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
