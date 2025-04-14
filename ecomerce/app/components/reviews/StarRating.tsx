'use client';
import React from 'react';
import './StarRating.scss';

interface StarRatingProps {
  rating: number;
  editable?: boolean;
  size?: 'small' | 'medium' | 'large';
  onChange?: (rating: number) => void;
  className?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  editable = false,
  size = 'medium',
  onChange,
  className = '',
}) => {
  const [hoverRating, setHoverRating] = React.useState(0);

  // Convert rating to nearest valid half-star value (0, 0.5, 1, 1.5, etc.)
  const normalizedRating = Math.round(rating * 2) / 2;
  
  const getStarClass = (position: number) => {
    const currentRating = editable && hoverRating > 0 ? hoverRating : normalizedRating;
    
    if (position <= currentRating - 0.5) {
      return 'full';
    } else if (position === Math.ceil(currentRating) && currentRating % 1 !== 0) {
      return 'half';
    } else {
      return 'empty';
    }
  };

  const handleMouseMove = (event: React.MouseEvent, position: number) => {
    if (!editable) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfPointPosition = rect.width / 2;
    
    // If cursor is on the left half of the star, it's a half star
    // If cursor is on the right half, it's a full star
    const isHalfStar = x < halfPointPosition;
    const rating = isHalfStar ? position - 0.5 : position;
    
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    if (!editable) return;
    setHoverRating(0);
  };

  const handleClick = (event: React.MouseEvent, position: number) => {
    if (!editable || !onChange) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const halfPointPosition = rect.width / 2;
    
    const isHalfStar = x < halfPointPosition;
    const newRating = isHalfStar ? position - 0.5 : position;
    
    onChange(newRating);
  };

  return (
    <div className={`star-rating ${size} ${className} ${editable ? 'editable' : ''}`}>
      {[1, 2, 3, 4, 5].map((position) => (
        <span
          key={position}
          className={`star ${getStarClass(position)}`}
          onMouseMove={editable ? (e) => handleMouseMove(e, position) : undefined}
          onClick={editable ? (e) => handleClick(e, position) : undefined}
          onMouseLeave={editable ? handleMouseLeave : undefined}
          role={editable ? 'button' : undefined}
          tabIndex={editable ? 0 : undefined}
        >
          <span className="star-icon">★</span>
        </span>
      ))}
      {editable && (
        <span className="rating-value">
          {hoverRating > 0 ? hoverRating : normalizedRating || '0'}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
