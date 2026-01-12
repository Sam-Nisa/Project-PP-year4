"use client";

import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";

export default function StarRating({ 
  rating = 0, 
  onRatingChange = null, 
  readonly = false, 
  size = "md",
  showValue = false 
}) {
  const [hoverRating, setHoverRating] = useState(0);
  const [tempRating, setTempRating] = useState(rating);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6",
    xl: "w-8 h-8"
  };

  const handleClick = (value) => {
    if (readonly || !onRatingChange) return;
    setTempRating(value);
    onRatingChange(value);
  };

  const handleMouseEnter = (value) => {
    if (readonly) return;
    setHoverRating(value);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const displayRating = hoverRating || tempRating || rating;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayRating;
          const isHalfFilled = !readonly && star === Math.ceil(displayRating) && displayRating % 1 !== 0;
          
          return (
            <button
              key={star}
              type="button"
              className={`${
                readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
              } transition-all duration-150 ${
                !readonly ? "focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-opacity-50 rounded" : ""
              }`}
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              onMouseLeave={handleMouseLeave}
              disabled={readonly}
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              {isFilled ? (
                <StarIcon 
                  className={`${sizeClasses[size]} text-yellow-400 drop-shadow-sm`} 
                />
              ) : isHalfFilled ? (
                <div className="relative">
                  <StarOutlineIcon className={`${sizeClasses[size]} text-gray-300`} />
                  <div className="absolute inset-0 overflow-hidden" style={{ width: `${(displayRating % 1) * 100}%` }}>
                    <StarIcon className={`${sizeClasses[size]} text-yellow-400`} />
                  </div>
                </div>
              ) : (
                <StarOutlineIcon 
                  className={`${sizeClasses[size]} ${
                    readonly ? "text-gray-300" : "text-gray-300 hover:text-yellow-200"
                  }`} 
                />
              )}
            </button>
          );
        })}
      </div>
      
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {displayRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}